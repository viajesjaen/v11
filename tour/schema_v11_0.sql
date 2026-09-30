-- AR Turismo v11.0 · Sistema de rutas
-- Ejecutar después de schema_v10_4.sql

create table if not exists public.tourism_routes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  cover_url text default '',
  category text default '',
  duration_minutes integer,
  distance_meters numeric,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tourism_route_places (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.tourism_routes(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (route_id, business_id)
);

create index if not exists tourism_routes_active_idx on public.tourism_routes(active, name);
create index if not exists tourism_route_places_route_idx on public.tourism_route_places(route_id, active, sort_order);
create index if not exists tourism_route_places_business_idx on public.tourism_route_places(business_id, active);

alter table public.tourism_routes enable row level security;
alter table public.tourism_route_places enable row level security;

drop policy if exists "Public can read active tourism routes" on public.tourism_routes;
create policy "Public can read active tourism routes"
on public.tourism_routes for select to anon, authenticated
using (active = true);

drop policy if exists "Public can read active tourism route places" on public.tourism_route_places;
create policy "Public can read active tourism route places"
on public.tourism_route_places for select to anon, authenticated
using (
  active = true
  and exists (select 1 from public.tourism_routes r where r.id = route_id and r.active = true)
  and exists (select 1 from public.businesses b where b.id = business_id and b.active = true)
);

drop policy if exists "Admins can manage tourism routes" on public.tourism_routes;
create policy "Admins can manage tourism routes"
on public.tourism_routes for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Admins can manage tourism route places" on public.tourism_route_places;
create policy "Admins can manage tourism route places"
on public.tourism_route_places for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
