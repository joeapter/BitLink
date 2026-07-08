-- BitLink — migration 017
-- Multi-line subscriptions: one Stripe subscription per customer, each line is
-- its own subscription ITEM. Enables combined billing (one bill, shared renewal
-- date, Stripe-native proration) with per-line control (pause/cancel one item).
--
-- Also adds custom_line_orders: admin-built, custom-priced order drafts that
-- back a payment link and drive multi-line provisioning on payment.

-- ── subscribers: one row per line-item, not per subscription ────────────────
-- Drop the "one line per subscription" constraint and track the item id.
alter table public.subscribers drop constraint if exists subscribers_stripe_subscription_id_key;
alter table public.subscribers add column if not exists stripe_subscription_item_id text;
alter table public.subscribers add column if not exists monthly_price_cents integer;

create index if not exists idx_subscribers_stripe_subscription on public.subscribers(stripe_subscription_id);
create unique index if not exists idx_subscribers_stripe_item
  on public.subscribers(stripe_subscription_item_id)
  where stripe_subscription_item_id is not null;

-- ── custom_line_orders: admin-built payment-link orders ─────────────────────
-- lines jsonb is an ordered array; each element:
--   { plan_slug, is_esim, is_port_in, port_number, wants_intl_number,
--     intl_country, custom_price_cents }
create table if not exists public.custom_line_orders (
  id                          uuid        primary key default gen_random_uuid(),
  token                       text        not null unique,
  customer_id                 uuid        references public.customers(id) on delete set null,
  created_by                  uuid        references public.profiles(id) on delete set null,
  lines                       jsonb       not null default '[]'::jsonb,
  note                        text,
  status                      text        not null default 'draft'
                                check (status in ('draft','paid','provisioning','completed','cancelled')),
  stripe_checkout_session_id  text,
  stripe_subscription_id      text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists idx_custom_line_orders_customer on public.custom_line_orders(customer_id);
create index if not exists idx_custom_line_orders_session  on public.custom_line_orders(stripe_checkout_session_id);

create trigger custom_line_orders_set_updated_at
  before update on public.custom_line_orders
  for each row execute function public.set_updated_at();

alter table public.custom_line_orders enable row level security;

create policy "custom_line_orders admin all"
  on public.custom_line_orders for all
  using (public.is_admin()) with check (public.is_admin());
