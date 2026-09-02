-- Dunning state for failed renewals.
--
-- Before this, a failed payment left exactly one trace: subscribers.status
-- flipped to 'suspended' by handlePaymentFailed. That says a payment failed
-- but not *when*, so there was no way to drive a schedule off it — and
-- status alone can't distinguish "declined an hour ago" from "declined ten
-- days ago", which is the whole basis of a dunning ladder.
--
-- payment_failed_at is the clock everything else hangs off: it is stamped on
-- the FIRST decline and left alone by subsequent retries, so the ladder
-- measures days since the problem started, not days since Stripe last tried.
-- Stripe's retry spacing is irregular (attempts 3, 4 and 5 on our current
-- past-due customers landed 1–3 days apart), so anchoring to attempt count
-- or last-attempt time would make the customer-facing dates drift.
--
-- The three _at stamps below are idempotency guards, not history: each stage
-- fires only when its column is null, so a cron that runs twice in a day (or
-- retries mid-sweep) cannot email the same person twice.
--
-- All four are cleared when payment succeeds, so a customer who recovers and
-- later fails again starts a fresh ladder rather than resuming the old one.

alter table public.subscribers
  add column if not exists payment_failed_at     timestamptz,
  add column if not exists dunning_notified_at   timestamptz,
  add column if not exists dunning_warned_at     timestamptz,
  add column if not exists dunning_suspended_at  timestamptz;

comment on column public.subscribers.payment_failed_at is
  'First decline of the current failure run. Null when billing is healthy. Cleared on recovery.';
comment on column public.subscribers.dunning_notified_at is
  'Day-1 "your payment did not go through" email sent.';
comment on column public.subscribers.dunning_warned_at is
  'Day-7 "we will pause your line" email sent.';
comment on column public.subscribers.dunning_suspended_at is
  'Day-10 carrier suspension applied.';

-- The daily sweep scans for subscribers in a failure run; everything else
-- about them is irrelevant to it. Partial index keeps that scan proportional
-- to the number of failing lines rather than the whole table.
create index if not exists subscribers_payment_failed_at_idx
  on public.subscribers (payment_failed_at)
  where payment_failed_at is not null;

-- Backfill the three customers already past due, so they enter the ladder at
-- the right rung instead of being treated as fresh failures. updated_at is
-- when handlePaymentFailed suspended them, which is the closest record we
-- have of when the decline happened.
--
-- dunning_notified_at is set to now() rather than left null on purpose: all
-- three were emailed by hand on Aug 31, and a null here would send them a
-- duplicate day-1 notice on the sweep's first run. They still get the day-7
-- warning on schedule, measured from the real failure date.
update public.subscribers
   set payment_failed_at   = coalesce(payment_failed_at, updated_at),
       dunning_notified_at = coalesce(dunning_notified_at, now())
 where status = 'suspended'
   and payment_failed_at is null;
