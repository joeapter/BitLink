-- Pre-printed referral codes for airport drivers (the "card stack" program).
-- Codes are printed on physical cards before anyone owns them; Joe claims a
-- code for a driver on the spot from /admin/drivers. Attribution needs no
-- claim: checkout stores the raw code in customers.referred_by regardless.
-- Deliberately separate from sales_reps (which requires a login profile) —
-- drivers get paid manually, 30 shekel per activated line.
create table if not exists public.driver_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  driver_name text,
  driver_phone text,
  driver_email text,
  notes text,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.driver_codes enable row level security;

create policy "Service role manages driver_codes"
  on public.driver_codes for all
  using (auth.role() = 'service_role');
