-- BitLink migration 004
-- Stripe billing infrastructure: stripe_events, stripe_customers, subscribers.
-- Depends on: public.customers, public.telecom_lines, public.provisioning_jobs,
--             public.is_admin(), public.set_updated_at()

-- ================================================================
-- STRIPE EVENTS
-- Store-first idempotent log of every inbound Stripe webhook event.
-- Mirrors the design of webhook_events (Annatel) — raw payload stored first,
-- processing happens async via Inngest, status tracks the lifecycle.
-- ================================================================

create table public.stripe_events (
  id                uuid        primary key default gen_random_uuid(),
  stripe_event_id   text        not null unique,          -- evt_xxx from Stripe
  event_type        text        not null,                  -- e.g. checkout.session.completed
  api_version       text,
  livemode          boolean     not null default false,
  received_at       timestamptz not null default now(),
  raw_payload       jsonb       not null,                  -- full Stripe Event object
  status            text        not null default 'received'
                      check (status in ('received','processing','processed','failed','skipped')),
  error             text,
  attempt_count     integer     not null default 0,
  processed_at      timestamptz,
  created_at        timestamptz not null default now()
);

create index idx_stripe_events_type   on public.stripe_events(event_type, received_at desc);
create index idx_stripe_events_status on public.stripe_events(status)
  where status not in ('processed', 'skipped');

-- ================================================================
-- STRIPE CUSTOMERS
-- Explicit mapping between BitLink customers and Stripe customer IDs.
-- Separates billing identity from application identity and supports
-- future multi-account or test/live mode scenarios.
-- ================================================================

create table public.stripe_customers (
  id                  uuid        primary key default gen_random_uuid(),
  customer_id         uuid        references public.customers(id) on delete set null,
  stripe_customer_id  text        not null unique,          -- cus_xxx
  stripe_email        text,
  livemode            boolean     not null default false,
  synced_at           timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

create index idx_stripe_customers_customer  on public.stripe_customers(customer_id);

-- ================================================================
-- SUBSCRIBERS
-- Domain bridge entity: Stripe subscription ↔ telecom line lifecycle.
-- Each active Stripe subscription has exactly one subscriber record.
-- Full trace: stripe_event → subscriber → telecom_line → provisioning_job → provider calls.
-- ================================================================

create table public.subscribers (
  id                          uuid        primary key default gen_random_uuid(),
  customer_id                 uuid        references public.customers(id) on delete set null,
  stripe_subscription_id      text        not null unique,    -- sub_xxx
  stripe_customer_id          text        not null,           -- cus_xxx
  plan_slug                   text        not null,
  telecom_line_id             uuid        references public.telecom_lines(id) on delete set null,
  provisioning_job_id         uuid        references public.provisioning_jobs(id) on delete set null,
  originating_stripe_event_id uuid        references public.stripe_events(id) on delete set null,
  status                      text        not null default 'pending'
                                check (status in ('pending','provisioning','active','suspended','cancelled')),
  correlation_id              text,
  activated_at                timestamptz,
  cancelled_at                timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_subscribers_customer     on public.subscribers(customer_id);
create index idx_subscribers_telecom_line on public.subscribers(telecom_line_id);
create index idx_subscribers_status       on public.subscribers(status);
create index idx_subscribers_correlation  on public.subscribers(correlation_id)
  where correlation_id is not null;

create trigger subscribers_set_updated_at
  before update on public.subscribers
  for each row execute function public.set_updated_at();

-- ================================================================
-- ROW LEVEL SECURITY — admin-only for all three tables
-- ================================================================

alter table public.stripe_events     enable row level security;
alter table public.stripe_customers  enable row level security;
alter table public.subscribers       enable row level security;

create policy "stripe_events admin all"
  on public.stripe_events for all
  using (public.is_admin()) with check (public.is_admin());

create policy "stripe_customers admin all"
  on public.stripe_customers for all
  using (public.is_admin()) with check (public.is_admin());

create policy "subscribers admin all"
  on public.subscribers for all
  using (public.is_admin()) with check (public.is_admin());
