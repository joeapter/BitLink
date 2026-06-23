-- Carrier rate table for cost-of-service calculation.
-- Rates come from the Annatel RESELLER contract signed 2026-06-01 (Appendix A / נספח א').
-- Monthly org profit report = (revenue USD × exchange rate) − CDR-derived cost ILS.
--
-- Interconnect rates: Israel Ministry of Communications abolished all mobile-to-mobile
-- interconnect fees (דמי קישוריות) in June 2025 via a 3-year phase-down, moving to a
-- "Bill and Keep" model. The legal rate for both outgoing and incoming interconnect is
-- now ₪0.00 per minute. Sources: Globes, Calcalist, Developing Telecoms (2022–2025).

create table public.carrier_rates (
  id           uuid        primary key default gen_random_uuid(),
  call_type    text        not null unique
                             check (call_type in (
                               'data',             -- GB used
                               'voice',            -- per billed minute (outgoing and incoming)
                               'sms',              -- per outgoing SMS
                               'line_fee',         -- fixed monthly per active line
                               'interconnect_out', -- outgoing interconnect — set by law
                               'interconnect_in'   -- incoming interconnect — set by law
                             )),
  rate_agurot  numeric(12,4) not null default 0 check (rate_agurot >= 0),
  unit         text        not null,
  description  text,
  updated_at   timestamptz not null default now()
);

-- Seed with contract rates
insert into public.carrier_rates (call_type, rate_agurot, unit, description) values
  ('data',             160,  'per_gb',          'Data: ₪1.60/GB — Annatel contract Appendix A'),
  ('voice',            1,    'per_minute',       'Voice: ₪0.01/min (רדיו לדקה) — Annatel contract Appendix A'),
  ('sms',              1,    'per_sms',          'SMS: ₪0.01/SMS (outgoing) — Annatel contract Appendix A'),
  ('line_fee',         250,  'per_line_month',   'Active line fee: ₪2.50/month — Annatel contract Appendix A'),
  ('interconnect_out', 0,    'per_minute',       'Outgoing interconnect: ₪0.00 — abolished by Ministry of Communications June 2025 (Bill and Keep model, 3-year phase-down complete)'),
  ('interconnect_in',  0,    'per_minute',       'Incoming interconnect: ₪0.00 — abolished by Ministry of Communications June 2025 (Bill and Keep model, 3-year phase-down complete)')
on conflict (call_type) do update set
  rate_agurot = excluded.rate_agurot,
  unit        = excluded.unit,
  description = excluded.description,
  updated_at  = now();

-- Admins can view and update; no public access
alter table public.carrier_rates enable row level security;

create policy "carrier_rates admin managed"
  on public.carrier_rates for all
  using (public.is_admin())
  with check (public.is_admin());
