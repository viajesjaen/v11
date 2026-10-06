-- Gymkanas v2: resultados y clasificación pública por alias.
create table if not exists public.gymkana_scores (
  id uuid primary key default gen_random_uuid(),
  gymkana_id uuid not null references public.gymkanas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default 'Jugador',
  score integer not null default 0,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(gymkana_id,user_id)
);
alter table public.gymkana_scores enable row level security;
drop policy if exists "gymkana_scores_public_read" on public.gymkana_scores;
create policy "gymkana_scores_public_read" on public.gymkana_scores for select using (true);
drop policy if exists "gymkana_scores_own_insert" on public.gymkana_scores;
create policy "gymkana_scores_own_insert" on public.gymkana_scores for insert with check (auth.uid() = user_id);
drop policy if exists "gymkana_scores_own_update" on public.gymkana_scores;
create policy "gymkana_scores_own_update" on public.gymkana_scores for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Gymkana piloto activa: preguntas + geolocalización + QR + cámara.
-- Los retos físicos se completan en la aplicación cuando se configuran sus destinos.
insert into public.gymkanas (id,name,icon,description,mode,active)
select gen_random_uuid(),'Jaén de leyenda','🐉','Una Gymkana para descubrir las leyendas y el patrimonio de Jaén mediante preguntas y retos presenciales.','both',true
where not exists (select 1 from public.gymkanas where name='Jaén de leyenda');

insert into public.gymkana_challenges (gymkana_id,sort_order,title,description,challenge_type,points,options,correct_option,qr_token,latitude,longitude,radius_meters,active)
select g.id,0,'La leyenda del Lagarto','¿Qué criatura protagoniza una de las leyendas más conocidas de Jaén?','quiz',100,'["Un dragón","Un lagarto","Un lobo","Un águila"]'::jsonb,1,'',null,null,40,true
from public.gymkanas g where g.name='Jaén de leyenda'
and not exists(select 1 from public.gymkana_challenges c where c.gymkana_id=g.id);
insert into public.gymkana_challenges (gymkana_id,sort_order,title,description,challenge_type,points,options,correct_option,qr_token,latitude,longitude,radius_meters,active)
select g.id,1,'Encuentra el punto','Acércate al punto indicado para desbloquear esta prueba.','geolocation',150,'[]'::jsonb,null,'',37.7684,-3.7908,80,true
from public.gymkanas g where g.name='Jaén de leyenda' and not exists(select 1 from public.gymkana_challenges c where c.gymkana_id=g.id and c.sort_order=1);
insert into public.gymkana_challenges (gymkana_id,sort_order,title,description,challenge_type,points,options,correct_option,qr_token,latitude,longitude,radius_meters,active)
select g.id,2,'Los Baños Árabes','¿Qué monumento conserva unos importantes baños de época andalusí?','quiz',100,'["Palacio de Villardompardo","Arco de San Lorenzo","Catedral","Castillo"]'::jsonb,0,'',null,null,40,true
from public.gymkanas g where g.name='Jaén de leyenda' and not exists(select 1 from public.gymkana_challenges c where c.gymkana_id=g.id and c.sort_order=2);
insert into public.gymkana_challenges (gymkana_id,sort_order,title,description,challenge_type,points,options,correct_option,qr_token,latitude,longitude,radius_meters,active)
select g.id,3,'El QR secreto','Busca y escanea el QR colocado en el punto de la Gymkana.','qr',150,'[]'::jsonb,null,'JAEN-LEYENDA-QR-01',null,null,40,true
from public.gymkanas g where g.name='Jaén de leyenda' and not exists(select 1 from public.gymkana_challenges c where c.gymkana_id=g.id and c.sort_order=3);
insert into public.gymkana_challenges (gymkana_id,sort_order,title,description,challenge_type,points,options,correct_option,qr_token,latitude,longitude,radius_meters,active)
select g.id,4,'Reconoce el monumento','Enfoca el monumento asociado a esta prueba.','camera',200,'[]'::jsonb,null,'',null,null,40,true
from public.gymkanas g where g.name='Jaén de leyenda' and not exists(select 1 from public.gymkana_challenges c where c.gymkana_id=g.id and c.sort_order=4);
insert into public.gymkana_challenges (gymkana_id,sort_order,title,description,challenge_type,points,options,correct_option,qr_token,latitude,longitude,radius_meters,active)
select g.id,5,'El castillo','¿Qué fortaleza corona la ciudad de Jaén?','quiz',100,'["Castillo de Burgalimar","Castillo de Santa Catalina","Alcázar de los Reyes","Castillo de La Guardia"]'::jsonb,1,'',null,null,40,true
from public.gymkanas g where g.name='Jaén de leyenda' and not exists(select 1 from public.gymkana_challenges c where c.gymkana_id=g.id and c.sort_order=5);
