-- Step 1 of consolidating `subscriptions` (legacy) into `subscribers`
-- (canonical). ADDITIVE ONLY — nothing reads these columns yet, so applying
-- this changes no behaviour. It exists so the read/write switch that follows
-- has somewhere to land.
--
-- Why the legacy table still exists at all: `subscribers` tracks the line
-- linkage and provisioning state, but has never carried Stripe's billing
-- PERIOD. That lives only in `subscriptions.current_period_*` and is what the
-- account page shows as "next billing date". So the legacy table is not dead
-- data — it is the Stripe mirror, and it cannot be dropped until these
-- columns are populated and read from.
--
-- Audit at 2026-08-17: 22 legacy rows, 24 canonical, ZERO legacy-only rows
-- (every subscriptions row has a subscribers match on stripe_subscription_id).
-- 10 rows carry current_period_end; plan_id is null on all 22 (dead column);
-- cancel_at_period_end is false on all 22.

alter table public.subscribers
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end   timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false;

-- Backfill the period data from the legacy mirror.
update public.subscribers b
set current_period_start = s.current_period_start,
    current_period_end   = s.current_period_end,
    cancel_at_period_end = coalesce(s.cancel_at_period_end, false),
    updated_at           = now()
from public.subscriptions s
where s.stripe_subscription_id = b.stripe_subscription_id
  and (s.current_period_end is not null or s.cancel_at_period_end);
