-- LRN PORTAGE APP V5 - Factures générées depuis CRA
-- À exécuter dans Supabase > SQL Editor

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  cra_id uuid not null references public.cra(id) on delete cascade,
  invoice_number text not null,
  data jsonb not null,
  subtotal numeric(12,2) not null default 0,
  vat_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cra_id)
);

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

alter table public.invoices enable row level security;

drop policy if exists "Admins can read invoices" on public.invoices;
drop policy if exists "Admins can insert invoices" on public.invoices;
drop policy if exists "Admins can update invoices" on public.invoices;
drop policy if exists "Admins can delete invoices" on public.invoices;

create policy "Admins can read invoices"
on public.invoices for select
using (public.is_admin());

create policy "Admins can insert invoices"
on public.invoices for insert
with check (public.is_admin());

create policy "Admins can update invoices"
on public.invoices for update
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete invoices"
on public.invoices for delete
using (public.is_admin());
