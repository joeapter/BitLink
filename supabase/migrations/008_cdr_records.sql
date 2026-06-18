-- CDR records table: stores per-call/data/SMS usage records from Annatel FTP.
-- Populated by the VPS relay (cdr-relay.js) via /api/cdrs/ingest every 4 hours.

create table if not exists public.cdr_records (
  id                uuid        primary key default gen_random_uuid(),
  telecom_line_id   uuid        references public.telecom_lines(id) on delete set null,
  customer_id       uuid        references public.customers(id) on delete set null,
  provider_line_id  text        not null,    -- Annatel account/number identifier
  call_type         text        not null check (call_type in ('voice', 'sms', 'data', 'other')),
  duration_sec      integer     not null default 0,
  data_bytes        bigint      not null default 0,
  sms_count         integer     not null default 0,
  direction         text        not null default 'outgoing' check (direction in ('outgoing', 'incoming', 'unknown')),
  destination       text,
  occurred_at       timestamptz not null,
  raw_filename      text,
  created_at        timestamptz not null default now()
);

-- Dedup index: same line + timestamp + type + direction is the same event
create unique index if not exists cdr_records_dedup_idx
  on public.cdr_records (provider_line_id, occurred_at, call_type, direction);

-- Query indexes
create index if not exists cdr_records_line_idx      on public.cdr_records (telecom_line_id);
create index if not exists cdr_records_customer_idx  on public.cdr_records (customer_id);
create index if not exists cdr_records_occurred_idx  on public.cdr_records (occurred_at desc);

-- RLS: admins can read all; customers can only see their own lines
alter table public.cdr_records enable row level security;

create policy "Admins can manage cdr_records"
  on public.cdr_records for all
  using (auth.role() = 'service_role');

create policy "Customers can view own cdr_records"
  on public.cdr_records for select
  using (
    customer_id in (
      select id from public.customers where user_id = auth.uid()
    )
  );
