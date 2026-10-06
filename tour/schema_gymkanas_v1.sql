-- Descubre Jaén · Gymkanas v1
-- Añade jugadores al sistema existente y crea el modelo de Gymkanas.
-- No modifica tourism_routes ni las tablas de monumentos/colaboradores.

-- 1) El sistema actual usa profiles para admin/owner. Añadimos player sin alterar sus permisos.
do $$
begin
  alter table public.profiles drop constraint if exists profiles_role_check;
  alter table public.profiles add constraint profiles_role_check check (role in ('admin','owner','player'));
exception when duplicate_object then null;
end $$;

-- Al registrarse desde la web pública con metadata role=player se crea como jugador.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email,''),
    coalesce(new.raw_user_meta_data->>'full_name',''),
    case when new.raw_user_meta_data->>'role' = 'player' then 'player' else 'owner' end
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

-- 2) Gymkanas.
create table if not exists public.gymkanas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text default '🎯',
  description text default '',
  cover_url text default '',
  mode text not null default 'both' check (mode in ('quiz','presential','both')),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gymkana_challenges (
  id uuid primary key default gen_random_uuid(),
  gymkana_id uuid not null references public.gymkanas(id) on delete cascade,
  sort_order integer not null default 0,
  title text not null,
  description text default '',
  challenge_type text not null default 'quiz' check (challenge_type in ('quiz','qr','camera','geolocation')),
  points integer not null default 100 check (points >= 0),
  options jsonb not null default '[]'::jsonb,
  correct_option integer,
  target_business_id uuid references public.businesses(id) on delete set null,
  qr_token text default '',
  latitude double precision,
  longitude double precision,
  radius_meters integer not null default 40,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gymkana_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  gymkana_id uuid not null references public.gymkanas(id) on delete cascade,
  current_challenge integer not null default 0,
  score integer not null default 0,
  completed boolean not null default false,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, gymkana_id)
);

create table if not exists public.gymkana_answers (
  id uuid primary key default gen_random_uuid(),
  progress_id uuid not null references public.gymkana_progress(id) on delete cascade,
  challenge_id uuid not null references public.gymkana_challenges(id) on delete cascade,
  answer_text text default '',
  correct boolean not null default false,
  points_awarded integer not null default 0,
  answered_at timestamptz not null default now(),
  unique(progress_id, challenge_id)
);

create index if not exists gymkanas_active_idx on public.gymkanas(active, name);
create index if not exists gymkana_challenges_gymkana_idx on public.gymkana_challenges(gymkana_id, active, sort_order);
create index if not exists gymkana_progress_user_idx on public.gymkana_progress(user_id, updated_at desc);

alter table public.gymkanas enable row level security;
alter table public.gymkana_challenges enable row level security;
alter table public.gymkana_progress enable row level security;
alter table public.gymkana_answers enable row level security;

-- Público: solo ve gymkanas publicadas y sus pruebas activas.
drop policy if exists "Public can read active gymkanas" on public.gymkanas;
create policy "Public can read active gymkanas" on public.gymkanas
for select to anon, authenticated using (active = true);

drop policy if exists "Public can read active gymkana challenges" on public.gymkana_challenges;
create policy "Public can read active gymkana challenges" on public.gymkana_challenges
for select to anon, authenticated using (
  active = true and exists (select 1 from public.gymkanas g where g.id = gymkana_id and g.active = true)
);

-- Admin: gestión completa de Gymkanas.
drop policy if exists "Admins can manage gymkanas" on public.gymkanas;
create policy "Admins can manage gymkanas" on public.gymkanas
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage gymkana challenges" on public.gymkana_challenges;
create policy "Admins can manage gymkana challenges" on public.gymkana_challenges
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Jugadores: cada uno solo puede ver/modificar su propio progreso.
drop policy if exists "Players can read own gymkana progress" on public.gymkana_progress;
create policy "Players can read own gymkana progress" on public.gymkana_progress
for select to authenticated using (user_id = auth.uid());

drop policy if exists "Players can insert own gymkana progress" on public.gymkana_progress;
create policy "Players can insert own gymkana progress" on public.gymkana_progress
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Players can update own gymkana progress" on public.gymkana_progress;
create policy "Players can update own gymkana progress" on public.gymkana_progress
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Players can read own gymkana answers" on public.gymkana_answers;
create policy "Players can read own gymkana answers" on public.gymkana_answers
for select to authenticated using (exists (select 1 from public.gymkana_progress p where p.id = progress_id and p.user_id = auth.uid()));

drop policy if exists "Players can insert own gymkana answers" on public.gymkana_answers;
create policy "Players can insert own gymkana answers" on public.gymkana_answers
for insert to authenticated with check (exists (select 1 from public.gymkana_progress p where p.id = progress_id and p.user_id = auth.uid()));

-- Gymkana inicial de prueba. Se publica a propósito solo si se descomenta el UPDATE final.
insert into public.gymkanas (name, icon, description, mode, active)
select 'Jaén de leyenda', '🐉', 'Descubre cuánto sabes sobre las leyendas y el patrimonio de Jaén.', 'both', false
where not exists (select 1 from public.gymkanas where name = 'Jaén de leyenda');

insert into public.gymkana_challenges (gymkana_id, sort_order, title, description, challenge_type, points, options, correct_option)
select g.id, v.sort_order, v.title, v.description, 'quiz', 100, v.options::jsonb, v.correct_option
from public.gymkanas g
cross join (values
  (0,'El Lagarto de Jaén','¿Qué criatura protagoniza una de las leyendas más conocidas de Jaén?','["Un dragón","Un lagarto","Un lobo","Un águila"]',1),
  (1,'El lugar de la leyenda','¿Con qué lugar se relaciona tradicionalmente la leyenda del Lagarto de Jaén?','["El Raudal de la Magdalena","La Catedral","El Castillo de Santa Catalina","La Plaza de Santa María"]',0),
  (2,'Los Baños','¿Qué monumento conserva unos importantes baños de época andalusí?','["Palacio de Villardompardo","Arco de San Lorenzo","Catedral","Castillo"]',0),
  (3,'La Catedral','¿Qué gran edificio renacentista domina buena parte del perfil monumental de Jaén?','["La Catedral","La Muralla","Los Baños Árabes","El Arco de San Andrés"]',0),
  (4,'El Castillo','¿Qué fortaleza corona la ciudad de Jaén?','["Castillo de Burgalimar","Castillo de Santa Catalina","Alcázar de los Reyes","Castillo de La Guardia"]',1)
) as v(sort_order,title,description,options,correct_option)
where g.name='Jaén de leyenda'
and not exists (select 1 from public.gymkana_challenges c where c.gymkana_id=g.id);

-- Para probarla en producción, ejecuta manualmente:
-- update public.gymkanas set active=true where name='Jaén de leyenda';
