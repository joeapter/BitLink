-- Trial charge retry ladder.
--
-- Until now a failed auto-continue charge set trial_lines.status = 'frozen'
-- and stopped there: no retry, no email, no recovery path. Two customers were
-- lost that way in Aug 2026 (both had simply declined cards, neither had said
-- no). This adds the state needed to retry the card every 2 days for a month,
-- warn once, and then terminate.
--
-- 'frozen' is deliberately KEPT in the status check: the historical rows still
-- carry it, and rewriting their history to fit the new ladder would misdate
-- when those trials actually ended.

alter table public.trial_lines
  add column charge_failed_at      timestamptz,
  add column last_retry_at         timestamptz,
  add column retry_count           integer not null default 0,
  add column frozen_at             timestamptz,
  add column termination_warned_at timestamptz,
  add column terminated_at         timestamptz;

comment on column public.trial_lines.charge_failed_at is
  'First auto-continue decline. All ladder timing is measured from here, never from the last retry — retry spacing drifts and would move the termination date we promise the customer.';
comment on column public.trial_lines.frozen_at is
  'When the line was actually suspended. The line keeps working for the first TRIAL_FREEZE_AFTER_DAYS of the ladder, so past_due does NOT imply suspended — read this column, not the status.';
comment on column public.trial_lines.retry_count is
  'Number of charge attempts made since charge_failed_at. Diagnostic only; the ladder is driven by dates.';

alter table public.trial_lines drop constraint trial_lines_status_check;

alter table public.trial_lines add constraint trial_lines_status_check
  check (status in (
    'pending_provision',
    'active',
    'converted',
    'frozen',      -- legacy: pre-ladder failed charge, no retries were made
    'past_due',    -- charge failed, retrying every 2 days; see frozen_at for whether the line is still up
    'cancelled',   -- customer opted out before the deadline
    'terminated'   -- ladder exhausted: line cancelled at the carrier
  ));

-- Partial: the sweep only ever scans rows currently on the ladder.
create index trial_lines_past_due_idx
  on public.trial_lines (charge_failed_at)
  where status = 'past_due';
