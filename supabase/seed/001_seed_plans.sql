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
  'israel-basic',
  'Israel Basic',
  'Simple monthly Israeli service for everyday calling and connectivity.',
  3499,
  'USD',
  null,
  '["Monthly Israeli service", "Simple plan setup", "Online account access", "Activation handled by the BitLink team"]'::jsonb,
  10,
  true
),
(
  'israel-plus',
  'Israel Plus',
  'Includes outgoing calls to USA, Canada, UK, and Australia.',
  4999,
  'USD',
  null,
  '["Outgoing calls to USA, Canada, UK, and Australia", "200 long-distance minutes per month", "Simple monthly billing", "Activation handled by the BitLink team"]'::jsonb,
  20,
  true
),
(
  'data-plus',
  'Data Plus',
  'More data, more flexibility, and international calling included.',
  5999,
  'USD',
  null,
  '["Designed for heavier everyday data use", "International calling included", "Online subscription visibility", "Activation handled by the BitLink team"]'::jsonb,
  30,
  true
),
(
  'unlimited-data-plus',
  'Unlimited Data Plus',
  'Unlimited-feeling data experience with international calling included.',
  7999,
  'USD',
  null,
  '["Unlimited-feeling data experience", "International calling included", "Designed for heavy everyday use", "Activation handled by the BitLink team"]'::jsonb,
  40,
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
