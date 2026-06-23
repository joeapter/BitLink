-- Add international number rate types to carrier_rates.
-- Pricing for US / UK / Canada numbers is not yet in the Annatel contract —
-- rows are seeded at 0. Update via /admin/carrier-rates when addendum is signed.

-- Drop and recreate the call_type constraint to include international types.
alter table public.carrier_rates
  drop constraint if exists carrier_rates_call_type_check;

alter table public.carrier_rates
  add constraint carrier_rates_call_type_check
  check (call_type in (
    'data',
    'voice',
    'sms',
    'line_fee',
    'interconnect_out',
    'interconnect_in',
    'intl_number_us',    -- monthly DID fee: US number
    'intl_number_uk',    -- monthly DID fee: UK number
    'intl_number_ca',    -- monthly DID fee: Canada number
    'intl_calls_us',     -- per-minute: calls to/from US number
    'intl_calls_uk',     -- per-minute: calls to/from UK number
    'intl_calls_ca'      -- per-minute: calls to/from Canada number
  ));

-- Placeholder rows — fill in when contract addendum is received
insert into public.carrier_rates (call_type, rate_agurot, unit, description) values
  ('intl_number_us', 0, 'per_number_month', 'US DID number — monthly fee: pending contract addendum'),
  ('intl_number_uk', 0, 'per_number_month', 'UK DID number — monthly fee: pending contract addendum'),
  ('intl_number_ca', 0, 'per_number_month', 'Canada DID number — monthly fee: pending contract addendum'),
  ('intl_calls_us',  0, 'per_minute',       'Calls to/from US number — per minute: pending contract addendum'),
  ('intl_calls_uk',  0, 'per_minute',       'Calls to/from UK number — per minute: pending contract addendum'),
  ('intl_calls_ca',  0, 'per_minute',       'Calls to/from Canada number — per minute: pending contract addendum')
on conflict (call_type) do nothing;
