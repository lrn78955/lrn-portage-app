-- LRN PORTAGE APP - Script Supabase initial
-- À exécuter dans Supabase > SQL Editor

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'consultant' check (role in ('admin', 'consultant', 'client')),
  created_at timestamptz not null default now()
);

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid references public.profiles(id) on delete set null,
  client_id uuid references public.profiles(id) on delete set null,
  title text not null,
  tjm numeric,
  start_date date,
  end_date date,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.cra (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references public.missions(id) on delete cascade,
  consultant_id uuid references public.profiles(id) on delete cascade,
  month text not null,
  worked_days numeric not null default 0,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  file_path text,
  document_type text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.missions enable row level security;
alter table public.cra enable row level security;
alter table public.documents enable row level security;

create policy "Users can read their own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can insert their own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id);

create policy "Users can read their own documents"
on public.documents for select
using (auth.uid() = owner_id);

create policy "Users can insert their own documents"
on public.documents for insert
with check (auth.uid() = owner_id);

create policy "Consultants and clients can read their own missions"
on public.missions for select
using (auth.uid() = consultant_id or auth.uid() = client_id);

create policy "Consultants can read their own CRA"
on public.cra for select
using (auth.uid() = consultant_id);

create policy "Consultants can insert their own CRA"
on public.cra for insert
with check (auth.uid() = consultant_id);

create policy "Consultants can update their own CRA"
on public.cra for update
using (auth.uid() = consultant_id);
