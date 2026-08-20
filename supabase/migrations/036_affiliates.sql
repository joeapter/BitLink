-- Affiliate program: influencers who share the free-trial link and get paid
-- when a trial converts to a paid plan.
--
-- Attribution deliberately reuses customers.referred_by — the same raw-code
-- mechanism the airport driver cards use. The code is stored as typed, with no
-- FK, so a link works the moment it is handed out and keeps working even if the
-- affiliate row is renamed or removed later.
--
-- Payout is per CONVERTED trial, by the plan they landed on:
--   basic                     -> $5
--   student-5g / max-5g       -> $10
--   kosher-basic / kosher-plus-> $5   (priced with basic)
-- Rates live on the row so a specific affiliate can be given different terms
-- without a migration.

create table public.affiliates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  contact text,
  notes text,
  status text not null default 'active'
    check (status in ('active', 'paused')),
  -- cents, so the admin UI never does float maths on money
  rate_basic_cents    integer not null default 500,
  rate_premium_cents  integer not null default 1000,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index affiliates_code_idx on public.affiliates(code);
create index affiliates_status_idx on public.affiliates(status);

create trigger affiliates_set_updated_at
  before update on public.affiliates
  for each row execute function public.set_updated_at();

alter table public.affiliates enable row level security;

create policy "Service role full access to affiliates"
  on public.affiliates
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Payouts already made, so the admin page can show outstanding vs settled.
create table public.affiliate_payments (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  method text,
  reference text,
  notes text,
  paid_at timestamptz not null default now(),
  created_by uuid,
  created_at timestamptz not null default now()
);

create index affiliate_payments_affiliate_idx on public.affiliate_payments(affiliate_id);

alter table public.affiliate_payments enable row level security;

create policy "Service role full access to affiliate_payments"
  on public.affiliate_payments
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
