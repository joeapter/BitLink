-- Atomic eSIM claim, to close a real race condition found in production
-- (2026-09-10): two lines provisioned in the same custom order both called
-- collectUsedIccIds() before either had persisted its pick, so both read the
-- same "not yet used" snapshot and both chose the same ICCID from Annatel's
-- inventory. The first line to reach Annatel got it; the second got a 422
-- "icc_id already exists" and its whole line failed.
--
-- collectUsedIccIds() was read-then-write with no lock between the read and
-- the write — safe for one job at a time, not for two running concurrently.
-- A unique constraint makes the claim step itself atomic: only one process
-- can ever successfully INSERT a given icc_id, so a second job racing for
-- the same one gets a clean, immediate conflict to react to (try the next
-- candidate) instead of discovering the collision only after Annatel does.
create table if not exists public.esim_iccid_reservations (
  icc_id text primary key,
  provisioning_job_id uuid not null references public.provisioning_jobs(id) on delete cascade,
  reserved_at timestamptz not null default now()
);

comment on table public.esim_iccid_reservations is
  'Atomic claim on an eSIM ICCID during provisioning. A row here means some job has committed to that ICCID (successfully at the carrier or still trying) — the primary key is the concurrency guard, not just a record of history. Deleted once the outcome is known: on success because telecom_lines.metadata.esim_icc_id becomes the authoritative record, on failure because we do not actually hold that ICCID at the carrier and holding a phantom local claim would only block a future line from picking it.';

-- Looked up by job during retry-cleanup and by collectUsedIccIds' exclusion
-- query; both are point lookups or full-table scans on a small table, so no
-- additional index beyond the primary key is needed at current volume.
