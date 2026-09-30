-- AR Turismo v10.4 · Colaboradores y patrocinadores
-- Ejecutar en Supabase > SQL Editor después del esquema existente.
-- Los campos sponsor_name/sponsor_url de businesses se mantienen por compatibilidad.

create table if not exists public.tourism_collaborators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  collaborator_type text not null default 'collaborator' check (collaborator_type in ('sponsor','collaborator','recommended')),
  description text default '',
  logo_url text default '',
  website text default '',
  phone text default '',
  whatsapp text default '',
  instagram text default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tourism_collaborator_places (
  id uuid primary key default gen_random_uuid(),
  collaborator_id uuid not null references public.tourism_collaborators(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  role text not null default 'collaborator' check (role in ('sponsor','collaborator','recommended')),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (collaborator_id, business_id)
);

create index if not exists tourism_collaborator_places_business_idx on public.tourism_collaborator_places(business_id, active, sort_order);
create index if not exists tourism_collaborator_places_collaborator_idx on public.tourism_collaborator_places(collaborator_id, active);

alter table public.tourism_collaborators enable row level security;
alter table public.tourism_collaborator_places enable row level security;

drop policy if exists "Public can read active tourism collaborators" on public.tourism_collaborators;
create policy "Public can read active tourism collaborators"
on public.tourism_collaborators for select to anon, authenticated
using (active = true);

drop policy if exists "Public can read active collaborator places" on public.tourism_collaborator_places;
create policy "Public can read active collaborator places"
on public.tourism_collaborator_places for select to anon, authenticated
using (
  active = true
  and exists (select 1 from public.businesses b where b.id = business_id and b.active = true)
  and exists (select 1 from public.tourism_collaborators c where c.id = collaborator_id and c.active = true)
);

drop policy if exists "Admins can manage tourism collaborators" on public.tourism_collaborators;
create policy "Admins can manage tourism collaborators"
on public.tourism_collaborators for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Admins can manage collaborator places" on public.tourism_collaborator_places;
create policy "Admins can manage collaborator places"
on public.tourism_collaborator_places for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
