-- LRN PORTAGE APP V3 - Documents + Storage
-- À exécuter dans Supabase > SQL Editor

-- Bucket privé pour les documents
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Fonction admin si pas déjà présente
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- Nettoyage policies profiles admin
drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
on public.profiles for select
using (public.is_admin() or auth.uid() = id);

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
on public.profiles for update
using (public.is_admin() or auth.uid() = id)
with check (public.is_admin() or auth.uid() = id);

-- Documents DB
alter table public.documents enable row level security;

drop policy if exists "Users can read their own documents" on public.documents;
drop policy if exists "Users can insert their own documents" on public.documents;
drop policy if exists "Admins can read all documents" on public.documents;
drop policy if exists "Admins can insert documents for anyone" on public.documents;

create policy "Users and admins can read documents"
on public.documents for select
using (public.is_admin() or auth.uid() = owner_id);

create policy "Users and admins can insert documents"
on public.documents for insert
with check (public.is_admin() or auth.uid() = owner_id);

-- Storage policies
drop policy if exists "Users and admins can upload documents" on storage.objects;
drop policy if exists "Users and admins can read documents" on storage.objects;
drop policy if exists "Users and admins can update documents" on storage.objects;
drop policy if exists "Users and admins can delete documents" on storage.objects;

create policy "Users and admins can upload documents"
on storage.objects for insert
with check (
  bucket_id = 'documents'
  and (
    public.is_admin()
    or auth.uid()::text = (storage.foldername(name))[1]
  )
);

create policy "Users and admins can read documents"
on storage.objects for select
using (
  bucket_id = 'documents'
  and (
    public.is_admin()
    or auth.uid()::text = (storage.foldername(name))[1]
  )
);

create policy "Users and admins can update documents"
on storage.objects for update
using (
  bucket_id = 'documents'
  and (
    public.is_admin()
    or auth.uid()::text = (storage.foldername(name))[1]
  )
);

create policy "Users and admins can delete documents"
on storage.objects for delete
using (
  bucket_id = 'documents'
  and (
    public.is_admin()
    or auth.uid()::text = (storage.foldername(name))[1]
  )
);
