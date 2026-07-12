-- BitLink — migration 022
-- Switch CDR dedup to Annatel's per-record uid. The old tuple index
-- (provider_line_id, occurred_at, call_type, direction) silently dropped
-- distinct records sharing the same second (ignoreDuplicates on upsert);
-- Annatel ships a unique uid on every record in both file types, which is
-- the true identity. Table is empty at migration time (the parser bug meant
-- nothing was ever stored), so no backfill concerns.

alter table public.cdr_records add column if not exists uid text;

drop index if exists cdr_records_dedup_idx;

create unique index if not exists cdr_records_uid_idx on public.cdr_records (uid);
