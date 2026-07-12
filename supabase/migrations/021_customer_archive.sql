-- BitLink — migration 021
-- Soft-archive for customers: hides a record from the default admin list
-- (e.g. a signup that never activated) without deleting anything. Fully
-- reversible; archived customers stay searchable for re-engagement.

alter table public.customers add column if not exists archived_at timestamptz;

create index if not exists idx_customers_archived_at on public.customers(archived_at);
