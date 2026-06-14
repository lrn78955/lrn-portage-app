-- LRN PORTAGE APP - Bons de commande / Purchase Orders

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
  order_number text not null,
  client_name text not null,
  client_address text,
  client_email text,
  client_ref text,
  payment_terms text not null default 'Dans un délai de 30 jours',
  daily_rate numeric(12,2) not null default 0,
  extra_hour_rate numeric(12,2) not null default 0,
  vat_rate numeric(5,2) not null default 20,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, order_number)
);

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
