-- BitLink — migration 014
-- Pause My Plan: customer-voluntary line freeze at $10/month.
--
-- Adds the 'paused' status to telecom_lines and subscribers. A paused line is
-- frozen at Annatel (suspension_type 'freeze' — holds the number and SIM) while
-- the Stripe subscription is swapped to the $10/month pause price. The pause
-- timestamp lives in telecom_lines.metadata->>'paused_at' (jsonb), matching
-- other lifecycle timestamps like esim_activated_at.
--
-- Business rule (enforced by copy + ops, not the DB): a line may stay paused
-- for up to 18 months without reactivation, after which it may be terminated
-- and the number released.

alter table public.telecom_lines drop constraint telecom_lines_status_check;
alter table public.telecom_lines add constraint telecom_lines_status_check
  check (status in (
    'draft','provisioning','active','suspended','paused',
    'porting','terminated','failed'
  ));

alter table public.subscribers drop constraint subscribers_status_check;
alter table public.subscribers add constraint subscribers_status_check
  check (status in ('pending','provisioning','active','suspended','paused','cancelled'));
