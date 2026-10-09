-- Corrección de permisos para subir imágenes de referencia AR (v14.6)
-- Ejecutar en Supabase > SQL Editor con un usuario con permisos de administrador.
-- No cambia imágenes existentes ni datos de monumentos.

-- Asegura que el bucket exista y sea público para poder mostrar las referencias en AR.
insert into storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
values ('target-images', 'target-images', true, array['image/*']::text[], 52428800)
on conflict (id) do update set
  public = excluded.public,
  allowed_mime_types = excluded.allowed_mime_types,
  file_size_limit = excluded.file_size_limit;

-- Elimina las políticas previas de este bucket para evitar reglas duplicadas o contradictorias.
drop policy if exists "Admins can manage target images" on storage.objects;
drop policy if exists "Owners can upload target images" on storage.objects;
drop policy if exists "Owners can update target images" on storage.objects;
drop policy if exists "Owners can delete target images" on storage.objects;
drop policy if exists "Admins can upload target images v2" on storage.objects;
drop policy if exists "Admins can update target images v2" on storage.objects;
drop policy if exists "Admins can delete target images v2" on storage.objects;
drop policy if exists "Owners can upload target images v2" on storage.objects;
drop policy if exists "Owners can update target images v2" on storage.objects;
drop policy if exists "Owners can delete target images v2" on storage.objects;

-- Lectura pública (necesaria para que la cámara cargue las referencias).
drop policy if exists "Public can view target images" on storage.objects;
create policy "Public can view target images"
on storage.objects for select to anon, authenticated
using (bucket_id = 'target-images');

-- El administrador se valida con el mismo helper usado por el panel de administración.
create policy "Admins can upload target images v2"
on storage.objects for insert to authenticated
with check (bucket_id = 'target-images' and public.is_admin());

create policy "Admins can update target images v2"
on storage.objects for update to authenticated
using (bucket_id = 'target-images' and public.is_admin())
with check (bucket_id = 'target-images' and public.is_admin());

create policy "Admins can delete target images v2"
on storage.objects for delete to authenticated
using (bucket_id = 'target-images' and public.is_admin());

-- Permite también a propietarios asignados gestionar referencias de su propio establecimiento.
create policy "Owners can upload target images v2"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'target-images'
  and exists (
    select 1 from public.business_users bu
    where bu.business_id::text = split_part(name, '__', 1)
      and bu.user_id = auth.uid()
  )
);

create policy "Owners can update target images v2"
on storage.objects for update to authenticated
using (
  bucket_id = 'target-images'
  and exists (
    select 1 from public.business_users bu
    where bu.business_id::text = split_part(name, '__', 1)
      and bu.user_id = auth.uid()
  )
)
with check (
  bucket_id = 'target-images'
  and exists (
    select 1 from public.business_users bu
    where bu.business_id::text = split_part(name, '__', 1)
      and bu.user_id = auth.uid()
  )
);

create policy "Owners can delete target images v2"
on storage.objects for delete to authenticated
using (
  bucket_id = 'target-images'
  and exists (
    select 1 from public.business_users bu
    where bu.business_id::text = split_part(name, '__', 1)
      and bu.user_id = auth.uid()
  )
);
