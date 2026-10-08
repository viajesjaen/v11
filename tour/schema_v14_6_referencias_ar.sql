-- AR TURISMO v14.6 - Varias imágenes de referencia para reconocimiento AR
-- Ejecutar en Supabase SQL Editor.

create table if not exists public.business_targets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  storage_path text not null,
  mime_type text not null default '',
  title text default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_targets_business_idx on public.business_targets(business_id, sort_order);

alter table public.business_targets enable row level security;

drop policy if exists "Public can read active business targets" on public.business_targets;
drop policy if exists "Admins can manage business targets" on public.business_targets;
drop policy if exists "Owners can read assigned business targets" on public.business_targets;
drop policy if exists "Owners can insert assigned business targets" on public.business_targets;
drop policy if exists "Owners can update assigned business targets" on public.business_targets;
drop policy if exists "Owners can delete assigned business targets" on public.business_targets;

create policy "Public can read active business targets" on public.business_targets
for select to anon using (active = true and exists (select 1 from public.businesses b where b.id = business_id and b.active = true));

create policy "Admins can manage business targets" on public.business_targets
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Owners can read assigned business targets" on public.business_targets
for select to authenticated using (exists (select 1 from public.business_users bu where bu.business_id = business_targets.business_id and bu.user_id = auth.uid()));

create policy "Owners can insert assigned business targets" on public.business_targets
for insert to authenticated with check (exists (select 1 from public.business_users bu where bu.business_id = business_targets.business_id and bu.user_id = auth.uid()));

create policy "Owners can update assigned business targets" on public.business_targets
for update to authenticated using (exists (select 1 from public.business_users bu where bu.business_id = business_targets.business_id and bu.user_id = auth.uid())) with check (exists (select 1 from public.business_users bu where bu.business_id = business_targets.business_id and bu.user_id = auth.uid()));

create policy "Owners can delete assigned business targets" on public.business_targets
for delete to authenticated using (exists (select 1 from public.business_users bu where bu.business_id = business_targets.business_id and bu.user_id = auth.uid()));

insert into storage.buckets (id,name,public,allowed_mime_types,file_size_limit)
values ('target-images','target-images',true,array['image/*']::text[],52428800)
on conflict (id) do nothing;

drop policy if exists "Public can view target images" on storage.objects;
create policy "Public can view target images" on storage.objects
for select to anon, authenticated using (bucket_id='target-images');

drop policy if exists "Admins can manage target images" on storage.objects;
create policy "Admins can manage target images" on storage.objects
for all to authenticated using (bucket_id='target-images' and public.is_admin()) with check (bucket_id='target-images' and public.is_admin());

drop policy if exists "Owners can upload target images" on storage.objects;
drop policy if exists "Owners can update target images" on storage.objects;
drop policy if exists "Owners can delete target images" on storage.objects;

do $$
begin
  execute $p$create policy "Owners can upload target images" on storage.objects for insert to authenticated with check (bucket_id='target-images' and exists (select 1 from public.business_users bu where bu.business_id::text = split_part(name,'__',1) and bu.user_id=auth.uid()));$p$;
  execute $p$create policy "Owners can update target images" on storage.objects for update to authenticated using (bucket_id='target-images' and exists (select 1 from public.business_users bu where bu.business_id::text = split_part(name,'__',1) and bu.user_id=auth.uid())) with check (bucket_id='target-images' and exists (select 1 from public.business_users bu where bu.business_id::text = split_part(name,'__',1) and bu.user_id=auth.uid()));$p$;
  execute $p$create policy "Owners can delete target images" on storage.objects for delete to authenticated using (bucket_id='target-images' and exists (select 1 from public.business_users bu where bu.business_id::text = split_part(name,'__',1) and bu.user_id=auth.uid()));$p$;
end $$;
