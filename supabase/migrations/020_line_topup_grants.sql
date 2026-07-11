-- BitLink — migration 020
-- Topup grants: admin can give a customer a topup (free or paid, one-time or
-- monthly recurring) for any line; customers can self-serve buy a one-time
-- topup from their account. Shares one table so a line's topup history is
-- visible in one place regardless of source.
--
-- Monthly grants are re-applied by a daily cron (see referral-bonuses.ts for
-- the identical idempotency pattern) — line_topup_grant_runs is the
-- per-calendar-month idempotency ledger, one row per (grant, month).

create table if not exists public.line_topup_grants (
  id                            uuid        primary key default gen_random_uuid(),
  line_id                       uuid        not null references public.telecom_lines(id) on delete cascade,
  topup_id                      text        not null,
  topup_name                    text        not null,
  label                         text        not null,
  frequency                     text        not null check (frequency in ('once','monthly')),
  billing_mode                  text        not null check (billing_mode in ('free','paid')),
  status                        text        not null default 'active'
                                  check (status in ('active','cancelled')),
  stripe_subscription_item_id   text,
  source                        text        not null default 'admin' check (source in ('admin','self_serve')),
  created_by                    uuid        references public.profiles(id) on delete set null,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

create index if not exists idx_line_topup_grants_line on public.line_topup_grants(line_id);
create index if not exists idx_line_topup_grants_active_monthly
  on public.line_topup_grants(status) where frequency = 'monthly';

create trigger line_topup_grants_set_updated_at
  before update on public.line_topup_grants
  for each row execute function public.set_updated_at();

alter table public.line_topup_grants enable row level security;

create policy "line_topup_grants admin all"
  on public.line_topup_grants for all
  using (public.is_admin()) with check (public.is_admin());

create table if not exists public.line_topup_grant_runs (
  id           uuid        primary key default gen_random_uuid(),
  grant_id     uuid        not null references public.line_topup_grants(id) on delete cascade,
  grant_month  date        not null,
  status       text        not null default 'pending' check (status in ('pending','applied','failed')),
  error        text,
  applied_at   timestamptz,
  created_at   timestamptz not null default now(),
  unique (grant_id, grant_month)
);

alter table public.line_topup_grant_runs enable row level security;

create policy "line_topup_grant_runs admin all"
  on public.line_topup_grant_runs for all
  using (public.is_admin()) with check (public.is_admin());
