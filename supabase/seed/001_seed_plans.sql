insert into public.plans (
  slug,
  name,
  description,
  monthly_price_cents,
  currency,
  stripe_price_id,
  features,
  sort_order,
  active
) values
(
  'basic',
  'Basic',
  'A clean starting point for reliable monthly service with an Israeli number, basic 5G data, and included calls and texts.',
  1499,
  'USD',
  null,
  '["1GB 5G data", "1,000 min to Israeli numbers", "500 SMS", "eSIM activation", "VAT included"]'::jsonb,
  0,
  true
),
(
  'student-5g',
  'Student 5G',
  'The most popular choice for students — generous 5G data with 5,000 local minutes and 1,000 SMS included.',
  3499,
  'USD',
  null,
  '["50GB 5G data", "5,000 min to Israeli numbers", "1,000 SMS", "eSIM activation", "VAT included"]'::jsonb,
  1,
  true
),
(
  'max-5g',
  'Max 5G',
  '120GB of 5G data for students who stream all day — includes 5,000 local minutes, 1,000 SMS, and 150 min to US/CA.',
  3999,
  'USD',
  null,
  '["120GB 5G data", "5,000 min to Israeli numbers", "150 min to US & Canada", "1,000 SMS", "eSIM activation", "VAT included"]'::jsonb,
  2,
  true
),
(
  'kosher-basic',
  'Kosher Basic',
  '5,000 minutes on a kosher-certified number — designed for certified kosher phones, voice only.',
  1999,
  'USD',
  null,
  '["5,000 min to Israeli numbers", "Physical SIM card", "Voice only — no data or SMS", "VAT included"]'::jsonb,
  3,
  true
),
(
  'kosher-plus',
  'Kosher+',
  'Everything in Kosher Basic, plus 150 minutes to US and Canadian numbers.',
  2499,
  'USD',
  null,
  '["5,000 min to Israeli numbers", "150 min to US & Canada", "Physical SIM card", "Voice only — no data or SMS", "VAT included"]'::jsonb,
  4,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  monthly_price_cents = excluded.monthly_price_cents,
  currency = excluded.currency,
  features = excluded.features,
  sort_order = excluded.sort_order,
  active = excluded.active,
  updated_at = now();
