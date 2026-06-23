-- Organization referral system
-- Organizations (Yeshiva / Seminary / Shul / etc.) get a unique referral link.
-- When a customer signs up via that link, their customer record is tagged with
-- the org's referral code. The monthly admin report uses this to compute 10%
-- charity checks per organization.

-- ── 1. Organizations table ────────────────────────────────────────────────────

create table public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  type          text not null default 'other'
                  check (type in ('yeshiva', 'seminary', 'shul', 'other')),
  referral_code text not null unique,
  contact_name  text,
  contact_email text,
  notes         text,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create index organizations_referral_code_idx on public.organizations(referral_code);

-- ── 2. Add carrier cost (ILS agurot) to plans ────────────────────────────────
-- 1 ILS = 100 agurot, same relationship as USD/cents.
-- profit_ils = (monthly_price_cents / 100 * exchange_rate) - (cost_agurot / 100)

alter table public.plans
  add column cost_agurot integer not null default 0 check (cost_agurot >= 0);

-- ── 3. Tag customers with the org that referred them ─────────────────────────

alter table public.customers
  add column org_referral_code text references public.organizations(referral_code) on delete set null;

create index customers_org_referral_code_idx on public.customers(org_referral_code);

-- ── 4. RLS ────────────────────────────────────────────────────────────────────

alter table public.organizations enable row level security;

create policy "organizations admin managed"
  on public.organizations for all
  using (public.is_admin())
  with check (public.is_admin());
