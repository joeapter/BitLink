-- Track sales rep notification emails so admin retries and provisioning retries
-- do not repeatedly email the same person.

alter table public.sales_reps
  add column if not exists welcome_email_sent_at timestamptz,
  add column if not exists welcome_email_error text;

alter table public.sales_rep_commissions
  add column if not exists notification_email_sent_at timestamptz,
  add column if not exists notification_email_error text;
