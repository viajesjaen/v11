-- AR Turismo v9.0: historia enriquecida + navegación por brújula
alter table public.businesses add column if not exists latitude double precision;
alter table public.businesses add column if not exists longitude double precision;
alter table public.businesses add column if not exists navigation_enabled boolean not null default true;

-- La columna description ya es text y ahora almacena HTML sanitizado del editor enriquecido.
-- No hace falta cambiar su tipo.
