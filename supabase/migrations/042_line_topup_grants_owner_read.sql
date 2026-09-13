-- Customers could not see their own top-up grants, so the usage meter showed
-- them a smaller allowance than they actually have.
--
-- line_topup_grants (migration 020) shipped with only an admin policy. But
-- LineUsageMeter reads it with the user-scoped client to build activeTopupIds,
-- which getCdrUsageBuckets folds into the plan allowance. Under RLS that read
-- silently returns zero rows for a non-admin, so the CDR-derived meter reports
-- base-plan-only: a customer with a 5GB referral bonus sees a 50GB meter
-- instead of 55GB, and "Remaining" is understated by whatever they earned.
-- Silent, because an RLS-filtered read is an empty result, not an error.
--
-- Verified against production 2026-09-13: 22 active grants across 20 of the 52
-- active lines, and a real customer with 2 grants on 2 lines could read their
-- lines but saw 0 of their grants. The same read in usage-alerts.ts uses the
-- admin client and was always correct — only the customer-facing meter was
-- wrong, which is why this never showed up in alerting.
--
-- Fixed at the database rather than by swapping the component to the admin
-- client: the ownership rule belongs next to the data, it keeps the meter
-- honest for any future reader (the native mobile app reads this table
-- directly), and it follows the self-scoped pattern already used by
-- telecom_lines, orders and cdr_records.
--
-- SELECT only, and deliberately no INSERT/UPDATE/DELETE: granting a top-up is
-- an admin action, and the existing admin policy still covers all writes.
-- Permissive policies are OR'd, so this widens reads without narrowing
-- anything an admin can already do.
--
-- Predicate verified before applying: evaluated against all 22 rows it
-- returned exactly the 2 belonging to user A, exactly the 2 belonging to
-- user B, and 0 for a session with no JWT claims.
create policy "line_topup_grants owner read"
  on public.line_topup_grants for select
  using (
    exists (
      select 1
      from public.telecom_lines l
      where l.id = line_topup_grants.line_id
        and public.customer_belongs_to_current_user(l.customer_id)
    )
  );
