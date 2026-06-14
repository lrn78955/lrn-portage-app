-- LRN PORTAGE APP V4 - Module CRA
-- À exécuter dans Supabase > SQL Editor

create table if not exists public.cra (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.profiles(id) on delete set null,
  month date not null,
  worked_days numeric(5,2) not null default 0,
  extra_hours numeric(6,2) not null default 0,
  extra_hours_rate numeric(10,2) not null default 44.64,
  saturday_days numeric(6,2) not null default 0,
  saturday_rate numeric(10,2) not null default 223.21,
  consultant_comment text,
  client_comment text,
  client_comment_visibility text not null default 'both'
    check (client_comment_visibility in ('admin_only', 'both')),
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'approved', 'rejected')),
  submitted_at timestamptz,
  validated_by uuid references public.profiles(id) on delete set null,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cra add column if not exists client_id uuid references public.profiles(id) on delete set null;
alter table public.cra add column if not exists consultant_comment text;
alter table public.cra add column if not exists client_comment text;
alter table public.cra add column if not exists client_comment_visibility text not null default 'both';
alter table public.cra add column if not exists submitted_at timestamptz;
alter table public.cra add column if not exists validated_by uuid references public.profiles(id) on delete set null;
alter table public.cra add column if not exists validated_at timestamptz;
alter table public.cra add column if not exists updated_at timestamptz;

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

alter table public.cra enable row level security;

drop policy if exists "CRA read access" on public.cra;
drop policy if exists "CRA insert access" on public.cra;
drop policy if exists "CRA update access" on public.cra;
drop policy if exists "CRA delete access" on public.cra;

create policy "CRA read access"
on public.cra for select
using (
  public.is_admin()
  or auth.uid() = consultant_id
  or auth.uid() = client_id
);

create policy "CRA insert access"
on public.cra for insert
with check (
  public.is_admin()
  or auth.uid() = consultant_id
);

create policy "CRA update access"
on public.cra for update
using (
  public.is_admin()
  or auth.uid() = consultant_id
  or auth.uid() = client_id
)
with check (
  public.is_admin()
  or auth.uid() = consultant_id
  or auth.uid() = client_id
);

create policy "CRA delete access"
on public.cra for delete
using (
  public.is_admin()
  or auth.uid() = consultant_id
);


-- V5.2 - Heures supplémentaires / samedis dans le CRA
alter table public.cra add column if not exists extra_hours numeric(6,2) not null default 0;
alter table public.cra add column if not exists extra_hours_rate numeric(10,2) not null default 44.64;
alter table public.cra add column if not exists saturday_days numeric(6,2) not null default 0;
alter table public.cra add column if not exists saturday_rate numeric(10,2) not null default 223.21;


-- V5.3 - Suppression CRA par admin ou consultant propriétaire
drop policy if exists "CRA delete access" on public.cra;

create policy "CRA delete access"
on public.cra for delete
using (
  public.is_admin()
  or auth.uid() = consultant_id
);
