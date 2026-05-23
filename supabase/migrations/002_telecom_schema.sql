-- BitLink telecom schema — migration 002
-- Adds all telecom-specific tables on top of the existing 001 schema.
-- Depends on: public.set_updated_at(), public.is_admin(),
--             public.customer_belongs_to_current_user(), public.customers

-- ================================================================
-- TELECOM LINES
-- Root entity. Every subscriber has exactly one active line.
-- ================================================================

create table public.telecom_lines (
  id                  uuid primary key default gen_random_uuid(),
  provider_id         text not null default 'annatel',
  provider_line_id    uuid,
  external_id         text not null unique,          -- YOUR idempotency key; sent as external_id to Annatel
  customer_id         uuid references public.customers(id) on delete set null,
  status              text not null default 'draft'
                        check (status in (
                          'draft','provisioning','active','suspended',
                          'porting','terminated','failed'
                        )),
  is_kosher           boolean not null default false,
  language            text default 'he_IL',
  metadata            jsonb not null default '{}'::jsonb,
  status_transitions  jsonb not null default '[]'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  terminated_at       timestamptz,
  created_by          uuid references public.profiles(id) on delete set null,
  updated_by          uuid references public.profiles(id) on delete set null
);

create index idx_telecom_lines_customer    on public.telecom_lines(customer_id);
create index idx_telecom_lines_status      on public.telecom_lines(status);
create index idx_telecom_lines_provider    on public.telecom_lines(provider_id, provider_line_id);
create index idx_telecom_lines_external_id on public.telecom_lines(external_id);

create trigger telecom_lines_set_updated_at
  before update on public.telecom_lines
  for each row execute function public.set_updated_at();

-- ================================================================
-- PHONE NUMBERS (DIDs)
-- end_at = NULL means currently active.
-- Unique constraint on active numbers prevents double-assignment.
-- ================================================================

create table public.phone_numbers (
  id                    uuid primary key default gen_random_uuid(),
  line_id               uuid not null references public.telecom_lines(id) on delete cascade,
  number                text not null,                  -- E.164 format: +972...
  provider_did_id       uuid,
  is_primary            boolean not null default true,
  is_ported             boolean not null default false,
  ported_from_operator  text,
  ported_to_operator    text,
  is_open_to_port_out   boolean not null default false,
  is_technical          boolean not null default false,
  start_at              timestamptz not null default now(),
  end_at                timestamptz,
  created_at            timestamptz not null default now()
);

create unique index idx_phone_numbers_active
  on public.phone_numbers(number) where end_at is null;
create index idx_phone_numbers_line on public.phone_numbers(line_id);

-- ================================================================
-- SIM PROFILES
-- Physical and eSIM cards. icc_id is globally unique.
-- ================================================================

create table public.sim_profiles (
  id                  uuid primary key default gen_random_uuid(),
  line_id             uuid references public.telecom_lines(id) on delete set null,
  icc_id              text not null unique,             -- ICCID
  imsi                text,
  msisdn              text,
  eid                 text,                             -- eSIM EID
  is_esim             boolean not null default false,
  provider_id         text not null default 'annatel',
  provider_status     text,                             -- Annatel raw status (Released, Active, etc.)
  status              text not null default 'inventory'
                        check (status in (
                          'inventory','reserved','provisioning',
                          'active','suspended','retired','failed'
                        )),
  profile_type        text,
  mno_id              text,
  assigned_at         timestamptz,
  activated_at        timestamptz,
  status_transitions  jsonb not null default '[]'::jsonb,
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_sim_profiles_line   on public.sim_profiles(line_id);
create index idx_sim_profiles_status on public.sim_profiles(status);
create index idx_sim_profiles_esim   on public.sim_profiles(eid) where eid is not null;

create trigger sim_profiles_set_updated_at
  before update on public.sim_profiles
  for each row execute function public.set_updated_at();

-- ================================================================
-- LINE PLANS
-- Active plan assignments. end_at = NULL means currently active.
-- ================================================================

create table public.line_plans (
  id                uuid primary key default gen_random_uuid(),
  line_id           uuid not null references public.telecom_lines(id) on delete cascade,
  plan_name         text not null,
  provider_plan_id  uuid,
  is_main           boolean not null default false,
  is_topup          boolean not null default false,
  start_at          timestamptz not null default now(),
  end_at            timestamptz,
  assigned_by       uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now()
);

create index idx_line_plans_line   on public.line_plans(line_id);
create index idx_line_plans_active on public.line_plans(line_id) where end_at is null;

-- ================================================================
-- PROVISIONING JOBS
-- One job per provider operation. idempotency_key prevents duplicate submission.
-- ================================================================

create table public.provisioning_jobs (
  id                  uuid primary key default gen_random_uuid(),
  line_id             uuid references public.telecom_lines(id) on delete set null,
  provider_job_id     text unique,                      -- Annatel's bur_... ID
  idempotency_key     text not null unique,
  type                text not null
                        check (type in (
                          'create_line','modify_line','suspend_line','reactivate_line',
                          'terminate_line','assign_sim','replace_sim','assign_plan',
                          'remove_plan','add_topup','trigger_ota','port_in'
                        )),
  status              text not null default 'pending'
                        check (status in (
                          'pending','submitted','syncing','completed','failed','cancelled'
                        )),
  attempt_count       integer not null default 0,
  max_attempts        integer not null default 3,
  payload             jsonb not null,
  result              jsonb,
  error               text,
  next_retry_at       timestamptz,
  status_transitions  jsonb not null default '[]'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  completed_at        timestamptz,
  created_by          uuid references public.profiles(id) on delete set null
);

create index idx_provisioning_jobs_line     on public.provisioning_jobs(line_id);
create index idx_provisioning_jobs_status   on public.provisioning_jobs(status);
create index idx_provisioning_jobs_retry    on public.provisioning_jobs(next_retry_at)
  where status = 'failed' and attempt_count < max_attempts;
create index idx_provisioning_jobs_provider on public.provisioning_jobs(provider_job_id);

create trigger provisioning_jobs_set_updated_at
  before update on public.provisioning_jobs
  for each row execute function public.set_updated_at();

-- ================================================================
-- SUSPENSION HISTORY
-- Append-only record of every suspension/reactivation cycle.
-- ================================================================

create table public.suspension_history (
  id                      uuid primary key default gen_random_uuid(),
  line_id                 uuid not null references public.telecom_lines(id) on delete cascade,
  suspension_type         text not null,                -- 'billing','voluntary','block','fraud','admin'
  provider_suspension_id  uuid,
  reason                  text not null,
  suspended_by            uuid references public.profiles(id) on delete set null,
  suspended_at            timestamptz not null default now(),
  reactivated_by          uuid references public.profiles(id) on delete set null,
  reactivated_at          timestamptz,
  is_active               boolean not null default true
);

create index idx_suspension_history_line   on public.suspension_history(line_id);
create index idx_suspension_history_active on public.suspension_history(line_id)
  where is_active = true;

-- ================================================================
-- WEBHOOK EVENTS
-- Raw payload stored first; async processing happens second.
-- raw_payload stored as base64 text to avoid bytea encoding complexity.
-- ================================================================

create table public.webhook_events (
  id                  uuid primary key default gen_random_uuid(),
  provider_id         text not null default 'annatel',
  provider_event_id   text,
  received_at         timestamptz not null default now(),
  headers             jsonb not null default '{}'::jsonb,
  raw_payload         text not null,                    -- base64-encoded raw bytes
  parsed_payload      jsonb,
  event_type          text,
  signature_valid     boolean,
  status              text not null default 'received'
                        check (status in (
                          'received','processing','processed','failed','skipped'
                        )),
  processed_at        timestamptz,
  error               text,
  attempt_count       integer not null default 0,
  idempotency_key     text unique
);

create index idx_webhook_events_status    on public.webhook_events(status);
create index idx_webhook_events_type      on public.webhook_events(event_type, received_at desc);
create index idx_webhook_events_provider  on public.webhook_events(provider_id, received_at desc);

-- ================================================================
-- TELECOM EVENTS
-- Normalized event log. One row per domain event regardless of source.
-- ================================================================

create table public.telecom_events (
  id              uuid primary key default gen_random_uuid(),
  event_type      text not null,
  aggregate_type  text not null,                        -- 'line','sim','portability','phone_number'
  aggregate_id    uuid,
  payload         jsonb not null,
  source          text not null check (source in ('webhook','api','system','admin')),
  source_event_id uuid references public.webhook_events(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index idx_telecom_events_type      on public.telecom_events(event_type, created_at desc);
create index idx_telecom_events_aggregate on public.telecom_events(aggregate_type, aggregate_id);

-- ================================================================
-- OCS BALANCE SNAPSHOTS
-- Point-in-time snapshots of OCS balances. OCS is the source of truth.
-- ================================================================

create table public.ocs_balance_snapshots (
  id              uuid primary key default gen_random_uuid(),
  line_id         uuid not null references public.telecom_lines(id) on delete cascade,
  snapshotted_at  timestamptz not null default now(),
  balances        jsonb not null,
  is_stale        boolean not null default false
);

create index idx_ocs_snapshots_line on public.ocs_balance_snapshots(line_id, snapshotted_at desc);

-- ================================================================
-- PROVIDER SYNC LOGS
-- Immutable audit log of every outbound call to Annatel (or any provider).
-- ================================================================

create table public.provider_sync_logs (
  id                uuid primary key default gen_random_uuid(),
  provider_id       text not null default 'annatel',
  operation         text not null,
  provider_job_id   text,
  request_payload   jsonb,
  response_payload  jsonb,
  http_status       integer,
  duration_ms       integer,
  succeeded         boolean not null,
  error             text,
  created_at        timestamptz not null default now()
);

create index idx_sync_logs_provider on public.provider_sync_logs(provider_id, created_at desc);
create index idx_sync_logs_failed   on public.provider_sync_logs(created_at desc)
  where not succeeded;

-- ================================================================
-- ROW LEVEL SECURITY
-- Admin: full access to all telecom tables.
-- Customer: read-only on own line via customer_id.
-- ================================================================

alter table public.telecom_lines         enable row level security;
alter table public.phone_numbers         enable row level security;
alter table public.sim_profiles          enable row level security;
alter table public.line_plans            enable row level security;
alter table public.provisioning_jobs     enable row level security;
alter table public.suspension_history    enable row level security;
alter table public.webhook_events        enable row level security;
alter table public.telecom_events        enable row level security;
alter table public.ocs_balance_snapshots enable row level security;
alter table public.provider_sync_logs    enable row level security;

create policy "telecom_lines admin all"
  on public.telecom_lines for all
  using (public.is_admin()) with check (public.is_admin());

create policy "telecom_lines customer read"
  on public.telecom_lines for select
  using (public.customer_belongs_to_current_user(customer_id));

create policy "phone_numbers admin all"
  on public.phone_numbers for all
  using (public.is_admin()) with check (public.is_admin());

create policy "sim_profiles admin all"
  on public.sim_profiles for all
  using (public.is_admin()) with check (public.is_admin());

create policy "line_plans admin all"
  on public.line_plans for all
  using (public.is_admin()) with check (public.is_admin());

create policy "provisioning_jobs admin all"
  on public.provisioning_jobs for all
  using (public.is_admin()) with check (public.is_admin());

create policy "suspension_history admin all"
  on public.suspension_history for all
  using (public.is_admin()) with check (public.is_admin());

create policy "webhook_events admin all"
  on public.webhook_events for all
  using (public.is_admin()) with check (public.is_admin());

create policy "telecom_events admin all"
  on public.telecom_events for all
  using (public.is_admin()) with check (public.is_admin());

create policy "ocs_balance_snapshots admin all"
  on public.ocs_balance_snapshots for all
  using (public.is_admin()) with check (public.is_admin());

create policy "provider_sync_logs admin all"
  on public.provider_sync_logs for all
  using (public.is_admin()) with check (public.is_admin());
