-- Stop a monthly top-up grant retrying the same refusal every morning.
--
-- The grant runner is idempotent on (grant_id, grant_month) but only treats
-- 'applied' as done, so a run that lands in 'failed' is attempted again at
-- 05:30 the next day, and the next, for the rest of the month. Nothing counts
-- the attempts and nothing tells anyone.
--
-- Aaron Schiffman's free 5GB grant did exactly that from 2026-08-20 to
-- 2026-09-30 — about forty identical calls — and every one came back
--   422 {"errors": {"plan": ["balance has already been taken"]}}
-- which is the carrier saying the line ALREADY HOLDS that balance. So the
-- customer had what he was given; the runner just could not tell "already
-- done" from "did not work", and retried a success forty times.
--
-- Two columns' worth of fix: a distinct status for that answer, and a count so
-- a genuine failure gives up instead of running daily.

alter table public.line_topup_grant_runs
  add column if not exists attempts integer not null default 0;

comment on column public.line_topup_grant_runs.attempts is
  'Carrier calls made for this grant-month. Caps daily retries of a failure that will never succeed.';

-- 'already_present' = the carrier refused because the line already has the
-- balance. Not a failure and not something to retry: the grant is in effect.
alter table public.line_topup_grant_runs
  drop constraint if exists line_topup_grant_runs_status_check;

alter table public.line_topup_grant_runs
  add constraint line_topup_grant_runs_status_check
  check (status in ('pending', 'applied', 'already_present', 'failed'));

comment on column public.line_topup_grant_runs.status is
  'pending | applied | already_present (carrier says the line already holds it — satisfied, do not retry) | failed';

-- Backfill the runs that caused this. Both were the "already taken" refusal,
-- so they were satisfied all along and should never have been retried.
update public.line_topup_grant_runs
   set status = 'already_present'
 where status = 'failed'
   and error like '%422%';
