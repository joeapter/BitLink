-- BitLink — migration 019
-- Correct international_dids wholesale cost: Annatel bills BitLink in ILS,
-- not USD as migration 018 assumed. Per-line DID cost confirmed directly:
-- US/Canada = 6 ILS/month, UK = 9 ILS/month. Renamed to make the currency
-- unambiguous — this column is pure admin/finance tracking, never read by
-- any pricing logic, so the rename is safe.

alter table public.international_dids rename column monthly_cost_cents to monthly_cost_agorot;

update public.international_dids set monthly_cost_agorot = 600 where country in ('us', 'canada');
update public.international_dids set monthly_cost_agorot = 900 where country = 'uk';
