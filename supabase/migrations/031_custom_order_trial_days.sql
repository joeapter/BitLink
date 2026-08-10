-- Optional delayed-billing window for admin-built custom orders: when set,
-- the Stripe subscription created at checkout starts in "trialing" status
-- for this many days (card saved, provisioning/shipping happens immediately,
-- first real charge fires automatically when the trial ends) instead of
-- charging right away. NULL means bill immediately, the existing behavior.
alter table custom_line_orders
  add column if not exists trial_days integer;
