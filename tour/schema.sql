-- Ejecuta este SQL en Supabase > SQL Editor
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

alter table public.businesses enable row level security;

create policy "Public can read active businesses"
on public.businesses for select to anon, authenticated
using (active = true);

create policy "Authenticated admins can read all businesses"
on public.businesses for select to authenticated
using (true);

create policy "Authenticated admins can insert"
on public.businesses for insert to authenticated
with check (true);

create policy "Authenticated admins can update"
on public.businesses for update to authenticated
using (true) with check (true);

create policy "Authenticated admins can delete"
on public.businesses for delete to authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('targets', 'targets', true)
on conflict (id) do nothing;

create policy "Public can view target images"
on storage.objects for select to anon, authenticated
using (bucket_id = 'targets');

create policy "Authenticated admins can upload target images"
on storage.objects for insert to authenticated
with check (bucket_id = 'targets');

create policy "Authenticated admins can update target images"
on storage.objects for update to authenticated
using (bucket_id = 'targets') with check (bucket_id = 'targets');

create policy "Authenticated admins can delete target images"
on storage.objects for delete to authenticated
using (bucket_id = 'targets');
