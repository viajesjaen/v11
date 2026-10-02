-- AR LOCAL v8.5 - propietarios de establecimientos y permisos por negocio
-- Ejecuta este SQL en Supabase > SQL Editor.

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text default '',
  description text default '',
  phone text default '',
  whatsapp text default '',
  website text default '',
  instagram text default '',
  address text default '',
  offer text default '',
  sponsor_name text default '',
  sponsor_url text default '',
  target_path text default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Perfil de cada usuario autenticado.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text default '',
  role text not null default 'owner' check (role in ('admin','owner')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Relación usuario <-> negocio. Un propietario puede gestionar uno o varios negocios.
create table if not exists public.business_users (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.business_users enable row level security;

-- Helper: comprobar si el usuario actual es administrador.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Crear perfil automáticamente al registrarse un usuario.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email,''), coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Perfiles: cada usuario ve el suyo; el administrador ve todos.
drop policy if exists "profiles own read" on public.profiles;
drop policy if exists "profiles admin all" on public.profiles;
create policy "profiles own read" on public.profiles
for select to authenticated using (id = auth.uid());
create policy "profiles admin all" on public.profiles
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Relaciones: propietario ve las suyas; admin gestiona todas.
drop policy if exists "business_users own read" on public.business_users;
drop policy if exists "business_users admin all" on public.business_users;
create policy "business_users own read" on public.business_users
for select to authenticated using (user_id = auth.uid());
create policy "business_users admin all" on public.business_users
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Negocios públicos activos; admin ve todo; propietario solo los asignados.
drop policy if exists "Public can read active businesses" on public.businesses;
drop policy if exists "Authenticated admins can read all businesses" on public.businesses;
drop policy if exists "Authenticated admins can insert" on public.businesses;
drop policy if exists "Authenticated admins can update" on public.businesses;
drop policy if exists "Authenticated admins can delete" on public.businesses;
drop policy if exists "Owners can read assigned businesses" on public.businesses;
drop policy if exists "Owners can update assigned businesses" on public.businesses;
drop policy if exists "Admins can insert businesses" on public.businesses;
drop policy if exists "Admins can update businesses" on public.businesses;
drop policy if exists "Admins can delete businesses" on public.businesses;

create policy "Public can read active businesses" on public.businesses
for select to anon using (active = true);
create policy "Authenticated can read permitted businesses" on public.businesses
for select to authenticated
using (
  public.is_admin() or exists (
    select 1 from public.business_users bu
    where bu.business_id = businesses.id and bu.user_id = auth.uid()
  ) or active = true
);
create policy "Admins can insert businesses" on public.businesses
for insert to authenticated with check (public.is_admin());
create policy "Admins can update businesses" on public.businesses
for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Owners can update assigned businesses" on public.businesses
for update to authenticated
using (exists (select 1 from public.business_users bu where bu.business_id = businesses.id and bu.user_id = auth.uid()))
with check (exists (select 1 from public.business_users bu where bu.business_id = businesses.id and bu.user_id = auth.uid()));
create policy "Admins can delete businesses" on public.businesses
for delete to authenticated using (public.is_admin());

-- Storage: bucket público para que el reconocimiento pueda descargar las imágenes.
insert into storage.buckets (id, name, public)
values ('targets', 'targets', true)
on conflict (id) do nothing;

drop policy if exists "Public can view target images" on storage.objects;
drop policy if exists "Authenticated admins can upload target images" on storage.objects;
drop policy if exists "Authenticated admins can update target images" on storage.objects;
drop policy if exists "Authenticated admins can delete target images" on storage.objects;
drop policy if exists "Owners can upload assigned target images" on storage.objects;
drop policy if exists "Owners can update assigned target images" on storage.objects;
drop policy if exists "Owners can delete assigned target images" on storage.objects;

create policy "Public can view target images" on storage.objects
for select to anon, authenticated using (bucket_id = 'targets');

create policy "Admins can upload target images" on storage.objects
for insert to authenticated
with check (bucket_id = 'targets' and public.is_admin());
create policy "Admins can update target images" on storage.objects
for update to authenticated
using (bucket_id = 'targets' and public.is_admin())
with check (bucket_id = 'targets' and public.is_admin());
create policy "Admins can delete target images" on storage.objects
for delete to authenticated using (bucket_id = 'targets' and public.is_admin());

-- Los propietarios solo pueden escribir una imagen cuyo nombre empiece por el UUID de un negocio que tengan asignado.
create policy "Owners can upload assigned target images" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'targets' and exists (
    select 1 from public.business_users bu
    where bu.business_id::text = split_part(name, '.', 1)
      and bu.user_id = auth.uid()
  )
);
create policy "Owners can update assigned target images" on storage.objects
for update to authenticated
using (
  bucket_id = 'targets' and exists (
    select 1 from public.business_users bu
    where bu.business_id::text = split_part(name, '.', 1)
      and bu.user_id = auth.uid()
  )
)
with check (
  bucket_id = 'targets' and exists (
    select 1 from public.business_users bu
    where bu.business_id::text = split_part(name, '.', 1)
      and bu.user_id = auth.uid()
  )
);
create policy "Owners can delete assigned target images" on storage.objects
for delete to authenticated
using (
  bucket_id = 'targets' and exists (
    select 1 from public.business_users bu
    where bu.business_id::text = split_part(name, '.', 1)
      and bu.user_id = auth.uid()
  )
);

-- IMPORTANTE: después de crear tu usuario administrador, ejecuta una vez:
-- update public.profiles set role = 'admin' where email = 'TU_EMAIL_ADMIN';
