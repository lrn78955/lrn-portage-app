-- LRN PORTAGE APP V2 - Droits admin
-- À exécuter dans Supabase > SQL Editor après avoir mis ton profil en role = 'admin'

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

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
on public.profiles for select
using (public.is_admin() or auth.uid() = id);

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
on public.profiles for update
using (public.is_admin() or auth.uid() = id)
with check (public.is_admin() or auth.uid() = id);

drop policy if exists "Admins can read all documents" on public.documents;
create policy "Admins can read all documents"
on public.documents for select
using (public.is_admin() or auth.uid() = owner_id);

drop policy if exists "Admins can read all missions" on public.missions;
create policy "Admins can read all missions"
on public.missions for select
using (public.is_admin() or auth.uid() = consultant_id or auth.uid() = client_id);

drop policy if exists "Admins can read all CRA" on public.cra;
create policy "Admins can read all CRA"
on public.cra for select
using (public.is_admin() or auth.uid() = consultant_id);
