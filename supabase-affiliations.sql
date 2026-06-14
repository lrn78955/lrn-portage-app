-- LRN PORTAGE APP - Affiliations consultants / clients
create table if not exists public.consultant_clients (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (consultant_id, client_id)
);

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

alter table public.consultant_clients enable row level security;

drop policy if exists "Consultant clients read access" on public.consultant_clients;
drop policy if exists "Consultant clients insert access" on public.consultant_clients;
drop policy if exists "Consultant clients delete access" on public.consultant_clients;

create policy "Consultant clients read access"
on public.consultant_clients for select
using (
  public.is_admin()
  or auth.uid() = consultant_id
  or auth.uid() = client_id
);

create policy "Consultant clients insert access"
on public.consultant_clients for insert
with check (public.is_admin());

create policy "Consultant clients delete access"
on public.consultant_clients for delete
using (public.is_admin());

alter table public.profiles enable row level security;

drop policy if exists "Affiliated profiles read access" on public.profiles;

create policy "Affiliated profiles read access"
on public.profiles for select
using (
  public.is_admin()
  or auth.uid() = id
  or exists (
    select 1
    from public.consultant_clients cc
    where
      (cc.consultant_id = auth.uid() and cc.client_id = public.profiles.id)
      or
      (cc.client_id = auth.uid() and cc.consultant_id = public.profiles.id)
  )
);

-- Renforce la création de CRA : un consultant ne peut créer un CRA que pour un client affilié.
drop policy if exists "CRA insert access" on public.cra;

create policy "CRA insert access"
on public.cra for insert
with check (
  public.is_admin()
  or (
    auth.uid() = consultant_id
    and exists (
      select 1
      from public.consultant_clients cc
      where cc.consultant_id = auth.uid()
      and cc.client_id = public.cra.client_id
    )
  )
);
