-- Abandoned-checkout recovery: cold-feet customers who opened a Stripe
-- Checkout session for the Basic plan and never completed it. A cron job
-- (every 2h) finds these, emails a recovery link with the activation fee
-- waived, and this table both records that we've already emailed a given
-- session (the unique constraint is the dedup guard) and backs the
-- /recover/[token] landing page.

create table public.abandoned_checkouts (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  customer_id uuid not null references public.customers(id) on delete cascade,
  stripe_checkout_session_id text not null unique,
  plan_slug text not null,
  is_esim boolean not null default true,
  status text not null default 'pending'
    check (status in ('pending', 'recovered', 'expired')),
  expires_at timestamptz not null,
  email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index abandoned_checkouts_customer_id_idx on public.abandoned_checkouts(customer_id);
create index abandoned_checkouts_status_idx on public.abandoned_checkouts(status);

alter table public.abandoned_checkouts enable row level security;

create policy "Service role full access to abandoned_checkouts"
  on public.abandoned_checkouts
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
