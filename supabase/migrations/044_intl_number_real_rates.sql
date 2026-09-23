-- Correct the international DID monthly fees in carrier_rates.
--
-- These three rows have sat at ₪0.00 with the description "pending contract
-- addendum" since the table was seeded (migration 023, Jun 2026). The real
-- figures have in fact been known and recorded all along, on the DID rows
-- themselves — international_dids.monthly_cost_agorot — so the tenant has been
-- carrying a cost that one table knew about and the other reported as free:
--
--   US      ₪6 / number / month   (25 numbers held)
--   Canada  ₪6 / number / month   (25 numbers held)
--   UK      ₪9 / number / month   (25 numbers held)
--
-- At 75 numbers held and 6 assigned that is ₪525/month total, ₪486 of it on
-- idle inventory. Annatel will not take the spare blocks back, so it is a
-- fixed cost to be amortised rather than trimmed — which is worth knowing when
-- pricing the add-on, since each additional international number sold is very
-- nearly pure contribution.
--
-- NOTE: this migration corrects the RECORD, not any calculation. Nothing reads
-- intl_number_* today — the org profit report's cost function only applies
-- line_fee, data, voice, interconnect_out and sms — so international DID cost
-- is still absent from every profit figure. Wiring it in is a separate change.
--
-- The per-minute intl_calls_* rows are deliberately left at zero: those really
-- are still pending, and zeroing a rate we do not know beats inventing one.

update public.carrier_rates
   set rate_agurot = 600,
       description = 'US DID number — monthly fee: ₪6.00 per number per month',
       updated_at  = now()
 where call_type = 'intl_number_us';

update public.carrier_rates
   set rate_agurot = 600,
       description = 'Canada DID number — monthly fee: ₪6.00 per number per month',
       updated_at  = now()
 where call_type = 'intl_number_ca';

update public.carrier_rates
   set rate_agurot = 900,
       description = 'UK DID number — monthly fee: ₪9.00 per number per month',
       updated_at  = now()
 where call_type = 'intl_number_uk';

-- Keep the two sources of truth honest about each other. If a DID row ever
-- disagrees with the rate card again, this is the query that shows it.
--
--   select d.country, d.monthly_cost_agorot, r.rate_agurot
--     from international_dids d
--     join carrier_rates r
--       on r.call_type = 'intl_number_' || case d.country
--            when 'us' then 'us' when 'uk' then 'uk' when 'canada' then 'ca' end
--    where d.monthly_cost_agorot <> r.rate_agurot;
