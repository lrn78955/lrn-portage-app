-- LRN PORTAGE APP - Documents
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  file_path text not null,
  document_type text not null default 'autre',
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "Documents read access" on public.documents;
drop policy if exists "Documents insert access" on public.documents;
drop policy if exists "Documents delete access" on public.documents;

create policy "Documents read access"
on public.documents for select
using (public.is_admin() or owner_id = auth.uid());

create policy "Documents insert access"
on public.documents for insert
with check (public.is_admin() or owner_id = auth.uid());

create policy "Documents delete access"
on public.documents for delete
using (public.is_admin() or owner_id = auth.uid());

drop policy if exists "Storage documents read" on storage.objects;
drop policy if exists "Storage documents insert" on storage.objects;
drop policy if exists "Storage documents update" on storage.objects;
drop policy if exists "Storage documents delete" on storage.objects;

create policy "Storage documents read"
on storage.objects for select
using (
  bucket_id = 'documents'
  and (
    public.is_admin()
    or split_part(name, '/', 1) = auth.uid()::text
  )
);

create policy "Storage documents insert"
on storage.objects for insert
with check (
  bucket_id = 'documents'
  and (
    public.is_admin()
    or split_part(name, '/', 1) = auth.uid()::text
  )
);

create policy "Storage documents update"
on storage.objects for update
using (
  bucket_id = 'documents'
  and (
    public.is_admin()
    or split_part(name, '/', 1) = auth.uid()::text
  )
)
with check (
  bucket_id = 'documents'
  and (
    public.is_admin()
    or split_part(name, '/', 1) = auth.uid()::text
  )
);

create policy "Storage documents delete"
on storage.objects for delete
using (
  bucket_id = 'documents'
  and (
    public.is_admin()
    or split_part(name, '/', 1) = auth.uid()::text
  )
);
