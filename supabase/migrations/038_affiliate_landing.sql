-- Where a Rep's link sends people.
--
-- Some Reps sell the free trial; others send people straight to the plans.
-- Stored per Rep rather than as a global setting so both can run at once, and
-- so a Rep can be switched without reissuing the link they've already shared —
-- /r/<code> resolves the destination at click time.
--
-- Payout is unaffected either way: a Rep earns when a real paid plan is
-- executed, whether that came from a converted trial or a direct purchase.

alter table public.affiliates
  add column if not exists landing text not null default 'trial';

alter table public.affiliates
  drop constraint if exists affiliates_landing_check;

alter table public.affiliates
  add constraint affiliates_landing_check check (landing in ('trial', 'plans'));
