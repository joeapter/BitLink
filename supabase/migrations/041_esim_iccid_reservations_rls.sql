-- Close the one RLS gap in the schema. Migration 040 created
-- esim_iccid_reservations but never enabled row level security on it, so it
-- was the only table in `public` reachable with the anon key that ships in
-- the site's JS bundle: verified 2026-09-13 by querying as the `anon` role,
-- which could read all 6 rows (every other customer table returned 0).
--
-- The exposure isn't PII — the table holds only an ICCID, a provisioning job
-- id, and a timestamp. The risk is integrity: anon also held INSERT/UPDATE/
-- DELETE, and this table's whole purpose is to be the atomic claim that stops
-- two concurrent provisioning jobs picking the same eSIM ICCID (see 040).
-- Deleting a row out from under a running job reintroduces exactly the race
-- that migration existed to fix, and a bogus insert can block a real ICCID
-- from ever being chosen.
--
-- Safe to apply: the only code that touches this table is
-- src/lib/provisioning/orchestrator.ts, which uses the service-role admin
-- client for all three operations (select/insert/delete), and `service_role`
-- has rolbypassrls = true — confirmed against production. Enabling RLS here
-- cannot affect provisioning.
alter table public.esim_iccid_reservations enable row level security;

-- Redundant strictly speaking, since service_role bypasses RLS, but it keeps
-- this table consistent with the twelve other service-role-only tables
-- (abandoned_checkouts, driver_codes, physical_sim_deliveries, …) and means
-- the intent survives if that role attribute is ever changed.
create policy "Service role full access to esim_iccid_reservations"
  on public.esim_iccid_reservations
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
