-- Sales rep referral program and customer referral bonus grants.
-- Sales reps are login/profile based, not line based. The one-time cash
-- commission is sales-rep-only; the monthly 5GB bonus is open to all customers.

create table if not exists public.sales_reps (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  referral_code text not null unique,
  status text not null default 'active' check (status in ('active', 'inactive')),
  payout_amount_agorot integer not null default 3000 check (payout_amount_agorot >= 0),
  currency text not null default 'ILS',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_rep_payments (
  id uuid primary key default gen_random_uuid(),
  sales_rep_id uuid not null references public.sales_reps(id) on delete cascade,
  amount_agorot integer not null check (amount_agorot > 0),
  currency text not null default 'ILS',
  paid_at timestamptz not null default now(),
  method text,
  reference text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_rep_commissions (
  id uuid primary key default gen_random_uuid(),
  sales_rep_id uuid not null references public.sales_reps(id) on delete cascade,
  referral_id uuid references public.referrals(id) on delete set null,
  referred_customer_id uuid references public.customers(id) on delete set null,
  referred_line_id uuid references public.telecom_lines(id) on delete set null,
  amount_agorot integer not null default 3000 check (amount_agorot >= 0),
  currency text not null default 'ILS',
  status text not null default 'pending' check (status in ('pending', 'paid', 'void')),
  earned_at timestamptz not null default now(),
  paid_at timestamptz,
  payment_id uuid references public.sales_rep_payments(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.referral_bonus_grants (
  id uuid primary key default gen_random_uuid(),
  sales_rep_id uuid references public.sales_reps(id) on delete set null,
  referrer_customer_id uuid references public.customers(id) on delete set null,
  beneficiary_customer_id uuid references public.customers(id) on delete set null,
  beneficiary_line_id uuid references public.telecom_lines(id) on delete set null,
  referred_line_id uuid references public.telecom_lines(id) on delete set null,
  grant_month date not null,
  bonus_gb integer not null default 5 check (bonus_gb > 0),
  provider_line_id text,
  provider_topup_name text,
  status text not null default 'pending' check (status in ('pending', 'applied', 'skipped', 'failed')),
  error text,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.referrals
  add column if not exists referred_line_id uuid references public.telecom_lines(id) on delete set null,
  add column if not exists sales_rep_id uuid references public.sales_reps(id) on delete set null,
  add column if not exists reward_value_agorot integer,
  add column if not exists activated_at timestamptz;

create trigger sales_reps_set_updated_at before update on public.sales_reps
  for each row execute function public.set_updated_at();
create trigger sales_rep_commissions_set_updated_at before update on public.sales_rep_commissions
  for each row execute function public.set_updated_at();
create trigger referral_bonus_grants_set_updated_at before update on public.referral_bonus_grants
  for each row execute function public.set_updated_at();

create index if not exists sales_reps_profile_id_idx on public.sales_reps(profile_id);
create index if not exists sales_reps_customer_id_idx on public.sales_reps(customer_id);
create index if not exists sales_reps_referral_code_idx on public.sales_reps(referral_code);
create index if not exists sales_rep_payments_sales_rep_id_idx on public.sales_rep_payments(sales_rep_id);
create index if not exists sales_rep_commissions_sales_rep_id_idx on public.sales_rep_commissions(sales_rep_id);
create index if not exists sales_rep_commissions_referred_customer_id_idx on public.sales_rep_commissions(referred_customer_id);
create index if not exists sales_rep_commissions_referred_line_id_idx on public.sales_rep_commissions(referred_line_id);
create unique index if not exists sales_rep_commissions_rep_line_unique
  on public.sales_rep_commissions(sales_rep_id, referred_line_id)
  where referred_line_id is not null;
create index if not exists referral_bonus_grants_sales_rep_id_idx on public.referral_bonus_grants(sales_rep_id);
create index if not exists referral_bonus_grants_referrer_customer_id_idx on public.referral_bonus_grants(referrer_customer_id);
create index if not exists referral_bonus_grants_month_idx on public.referral_bonus_grants(grant_month);
create unique index if not exists referral_bonus_grants_month_line_unique
  on public.referral_bonus_grants(beneficiary_customer_id, beneficiary_line_id, referred_line_id, grant_month)
  where beneficiary_customer_id is not null and beneficiary_line_id is not null and referred_line_id is not null;
create index if not exists referrals_sales_rep_id_idx on public.referrals(sales_rep_id);
create index if not exists referrals_referred_line_id_idx on public.referrals(referred_line_id);
create unique index if not exists referrals_referred_line_id_unique
  on public.referrals(referred_line_id)
  where referred_line_id is not null;
create index if not exists customers_referred_by_idx on public.customers(referred_by);

create or replace function public.sales_rep_belongs_to_current_user(rep_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.sales_reps
    where id = rep_uuid
      and profile_id = auth.uid()
  );
$$;

alter table public.sales_reps enable row level security;
alter table public.sales_rep_payments enable row level security;
alter table public.sales_rep_commissions enable row level security;
alter table public.referral_bonus_grants enable row level security;

create policy "sales reps readable by owner or admin"
on public.sales_reps for select
using (public.is_admin() or profile_id = auth.uid());

create policy "sales reps admin managed"
on public.sales_reps for all
using (public.is_admin())
with check (public.is_admin());

create policy "sales rep payments readable by owner or admin"
on public.sales_rep_payments for select
using (public.is_admin() or public.sales_rep_belongs_to_current_user(sales_rep_id));

create policy "sales rep payments admin managed"
on public.sales_rep_payments for all
using (public.is_admin())
with check (public.is_admin());

create policy "sales rep commissions readable by owner or admin"
on public.sales_rep_commissions for select
using (public.is_admin() or public.sales_rep_belongs_to_current_user(sales_rep_id));

create policy "sales rep commissions admin managed"
on public.sales_rep_commissions for all
using (public.is_admin())
with check (public.is_admin());

create policy "referral bonus grants readable by owner or admin"
on public.referral_bonus_grants for select
using (
  public.is_admin()
  or public.customer_belongs_to_current_user(beneficiary_customer_id)
  or public.customer_belongs_to_current_user(referrer_customer_id)
  or public.sales_rep_belongs_to_current_user(sales_rep_id)
);

create policy "referral bonus grants admin managed"
on public.referral_bonus_grants for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "referrals readable by participants or admin" on public.referrals;
create policy "referrals readable by participants or admin"
on public.referrals for select
using (
  public.is_admin()
  or public.customer_belongs_to_current_user(referrer_customer_id)
  or public.customer_belongs_to_current_user(referred_customer_id)
  or public.sales_rep_belongs_to_current_user(sales_rep_id)
);
