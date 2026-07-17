-- Track when an international DID is released from a line back to inventory.
-- Annatel confirmed released DIDs return to the pool; we quarantine them from
-- customer-facing pickers for 90 days and show admins when a number was last
-- in use (released numbers sort to the bottom of the admin picker).
alter table public.international_dids
  add column if not exists released_at timestamptz,
  add column if not exists released_from_line_id uuid references public.telecom_lines(id) on delete set null;
