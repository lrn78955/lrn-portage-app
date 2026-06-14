-- LRN PORTAGE APP - Bons de commande / Purchase Orders V5.8.9

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

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  consultant_id uuid references public.profiles(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  file_path text,
  order_number text not null,
  supplier_ref text,
  supplier_code text,
  order_date date,
  end_date date,
  client_name text not null,
  client_address text,
  client_email text,
  client_ref text,
  payment_terms text not null default 'Règlement à 30 jours fin de mois',
  daily_rate numeric(12,2) not null default 0,
  extra_hour_rate numeric(12,2) not null default 0,
  vat_rate numeric(5,2) not null default 20,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, order_number)
);

alter table public.purchase_orders add column if not exists consultant_id uuid references public.profiles(id) on delete set null;
alter table public.purchase_orders add column if not exists document_id uuid references public.documents(id) on delete set null;
alter table public.purchase_orders add column if not exists file_path text;
alter table public.purchase_orders add column if not exists supplier_ref text;
alter table public.purchase_orders add column if not exists supplier_code text;
alter table public.purchase_orders add column if not exists order_date date;
alter table public.purchase_orders add column if not exists end_date date;
alter table public.purchase_orders add column if not exists updated_at timestamptz not null default now();

alter table public.purchase_orders enable row level security;

drop policy if exists "Admins can read purchase orders" on public.purchase_orders;
drop policy if exists "Admins can insert purchase orders" on public.purchase_orders;
drop policy if exists "Admins can update purchase orders" on public.purchase_orders;
drop policy if exists "Admins can delete purchase orders" on public.purchase_orders;

create policy "Admins can read purchase orders"
on public.purchase_orders for select
using (public.is_admin());

create policy "Admins can insert purchase orders"
on public.purchase_orders for insert
with check (public.is_admin());

create policy "Admins can update purchase orders"
on public.purchase_orders for update
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete purchase orders"
on public.purchase_orders for delete
using (public.is_admin());
