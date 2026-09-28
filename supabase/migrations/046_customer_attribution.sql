-- Where an uncoded customer actually came from.
--
-- Coded traffic was already attributed: customers.referred_by carries a Rep or
-- driver code, org_referral_code carries a partner. Everyone else — the
-- majority — had nothing at all. On 2026-09-28 a customer bought Student 5G
-- with no code of any kind and the only available answer was a GA4 channel
-- total for the day, which cannot say which page found her.
--
-- Stored on the customer rather than the order because it is a property of how
-- the person arrived, and it is FIRST touch: the page that found them, not the
-- one they were on when they paid, which is /plans for nearly everybody.
--
-- All nullable. Traffic that predates this, or arrives with the cookie blocked,
-- simply has no attribution — which must never block a sale.
alter table public.customers
  add column if not exists attribution_landing  text,
  add column if not exists attribution_referrer text,
  add column if not exists attribution_source   text,
  add column if not exists attribution_medium   text,
  add column if not exists attribution_campaign text,
  add column if not exists attribution_at       timestamptz;

comment on column public.customers.attribution_landing is
  'First page this customer ever landed on. The one that found them — not the page they checked out from.';
comment on column public.customers.attribution_referrer is
  'Referring host only (google.com, chatgpt.com). Host, never the full URL: referrer query strings can carry someone else''s search terms.';

-- Answers "which pages actually produce customers", which is the whole point.
create index if not exists customers_attribution_landing_idx
  on public.customers (attribution_landing)
  where attribution_landing is not null;
