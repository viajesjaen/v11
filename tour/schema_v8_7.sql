-- AR LOCAL v8.7 - Galería, audios y vídeos para establecimientos
-- Ejecuta este SQL en Supabase > SQL Editor DESPUÉS de schema_v8_5.sql.

create table if not exists public.business_media (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  media_type text not null check (media_type in ('image','audio','video')),
  storage_path text not null,
  mime_type text not null default '',
  title text default '',
  description text default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_media_business_idx on public.business_media(business_id, media_type, sort_order);

alter table public.business_media enable row level security;

drop policy if exists "Public can read active business media" on public.business_media;
drop policy if exists "Admins can manage business media" on public.business_media;
drop policy if exists "Owners can read assigned business media" on public.business_media;
drop policy if exists "Owners can insert assigned business media" on public.business_media;
drop policy if exists "Owners can update assigned business media" on public.business_media;
drop policy if exists "Owners can delete assigned business media" on public.business_media;

create policy "Public can read active business media" on public.business_media
for select to anon using (active = true and exists (select 1 from public.businesses b where b.id = business_id and b.active = true));

create policy "Admins can manage business media" on public.business_media
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Owners can read assigned business media" on public.business_media
for select to authenticated using (exists (select 1 from public.business_users bu where bu.business_id = business_media.business_id and bu.user_id = auth.uid()));

create policy "Owners can insert assigned business media" on public.business_media
for insert to authenticated with check (exists (select 1 from public.business_users bu where bu.business_id = business_media.business_id and bu.user_id = auth.uid()));

create policy "Owners can update assigned business media" on public.business_media
for update to authenticated using (exists (select 1 from public.business_users bu where bu.business_id = business_media.business_id and bu.user_id = auth.uid())) with check (exists (select 1 from public.business_users bu where bu.business_id = business_media.business_id and bu.user_id = auth.uid()));

create policy "Owners can delete assigned business media" on public.business_media
for delete to authenticated using (exists (select 1 from public.business_users bu where bu.business_id = business_media.business_id and bu.user_id = auth.uid()));

-- Buckets públicos: el contenido publicado debe poder verse desde la ficha pública.
insert into storage.buckets (id,name,public,allowed_mime_types,file_size_limit)
values ('media-images','media-images',true,array['image/*']::text[],52428800)
on conflict (id) do nothing;
insert into storage.buckets (id,name,public,allowed_mime_types,file_size_limit)
values ('media-audio','media-audio',true,array['audio/*']::text[],52428800)
on conflict (id) do nothing;
insert into storage.buckets (id,name,public,allowed_mime_types,file_size_limit)
values ('media-video','media-video',true,array['video/*']::text[],52428800)
on conflict (id) do nothing;

-- Lectura pública.
drop policy if exists "Public can view media images" on storage.objects;
drop policy if exists "Public can view media audio" on storage.objects;
drop policy if exists "Public can view media video" on storage.objects;
create policy "Public can view media images" on storage.objects for select to anon, authenticated using (bucket_id='media-images');
create policy "Public can view media audio" on storage.objects for select to anon, authenticated using (bucket_id='media-audio');
create policy "Public can view media video" on storage.objects for select to anon, authenticated using (bucket_id='media-video');

-- Los propietarios usan rutas con el formato BUSINESS_UUID__NOMBRE.ext.
-- Así podemos comprobar el negocio sin exponer ninguna clave de servicio.
drop policy if exists "Owners can upload media images" on storage.objects;
drop policy if exists "Owners can update media images" on storage.objects;
drop policy if exists "Owners can delete media images" on storage.objects;
drop policy if exists "Owners can upload media audio" on storage.objects;
drop policy if exists "Owners can update media audio" on storage.objects;
drop policy if exists "Owners can delete media audio" on storage.objects;
drop policy if exists "Owners can upload media video" on storage.objects;
drop policy if exists "Owners can update media video" on storage.objects;
drop policy if exists "Owners can delete media video" on storage.objects;

do $$
begin
  execute $p$create policy "Owners can upload media images" on storage.objects for insert to authenticated with check (bucket_id='media-images' and exists (select 1 from public.business_users bu where bu.business_id::text = split_part(name,'__',1) and bu.user_id=auth.uid()));$p$;
  execute $p$create policy "Owners can update media images" on storage.objects for update to authenticated using (bucket_id='media-images' and exists (select 1 from public.business_users bu where bu.business_id::text = split_part(name,'__',1) and bu.user_id=auth.uid())) with check (bucket_id='media-images' and exists (select 1 from public.business_users bu where bu.business_id::text = split_part(name,'__',1) and bu.user_id=auth.uid()));$p$;
  execute $p$create policy "Owners can delete media images" on storage.objects for delete to authenticated using (bucket_id='media-images' and exists (select 1 from public.business_users bu where bu.business_id::text = split_part(name,'__',1) and bu.user_id=auth.uid()));$p$;
  execute $p$create policy "Owners can upload media audio" on storage.objects for insert to authenticated with check (bucket_id='media-audio' and exists (select 1 from public.business_users bu where bu.business_id::text = split_part(name,'__',1) and bu.user_id=auth.uid()));$p$;
  execute $p$create policy "Owners can update media audio" on storage.objects for update to authenticated using (bucket_id='media-audio' and exists (select 1 from public.business_users bu where bu.business_id::text = split_part(name,'__',1) and bu.user_id=auth.uid())) with check (bucket_id='media-audio' and exists (select 1 from public.business_users bu where bu.business_id::text = split_part(name,'__',1) and bu.user_id=auth.uid()));$p$;
  execute $p$create policy "Owners can delete media audio" on storage.objects for delete to authenticated using (bucket_id='media-audio' and exists (select 1 from public.business_users bu where bu.business_id::text = split_part(name,'__',1) and bu.user_id=auth.uid()));$p$;
  execute $p$create policy "Owners can upload media video" on storage.objects for insert to authenticated with check (bucket_id='media-video' and exists (select 1 from public.business_users bu where bu.business_id::text = split_part(name,'__',1) and bu.user_id=auth.uid()));$p$;
  execute $p$create policy "Owners can update media video" on storage.objects for update to authenticated using (bucket_id='media-video' and exists (select 1 from public.business_users bu where bu.business_id::text = split_part(name,'__',1) and bu.user_id=auth.uid())) with check (bucket_id='media-video' and exists (select 1 from public.business_users bu where bu.business_id::text = split_part(name,'__',1) and bu.user_id=auth.uid()));$p$;
  execute $p$create policy "Owners can delete media video" on storage.objects for delete to authenticated using (bucket_id='media-video' and exists (select 1 from public.business_users bu where bu.business_id::text = split_part(name,'__',1) and bu.user_id=auth.uid()));$p$;
exception when duplicate_object then null;
end $$;

-- Administradores pueden gestionar todos los objetos multimedia.
drop policy if exists "Admins can manage media images" on storage.objects;
drop policy if exists "Admins can manage media audio" on storage.objects;
drop policy if exists "Admins can manage media video" on storage.objects;
create policy "Admins can manage media images" on storage.objects for all to authenticated using (bucket_id='media-images' and public.is_admin()) with check (bucket_id='media-images' and public.is_admin());
create policy "Admins can manage media audio" on storage.objects for all to authenticated using (bucket_id='media-audio' and public.is_admin()) with check (bucket_id='media-audio' and public.is_admin());
create policy "Admins can manage media video" on storage.objects for all to authenticated using (bucket_id='media-video' and public.is_admin()) with check (bucket_id='media-video' and public.is_admin());
