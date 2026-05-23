-- BitLink migration 003
-- Extend provider_sync_logs with full request/response detail and correlation columns.
-- Existing rows will have NULLs for new columns — that is intentional and safe.

alter table public.provider_sync_logs
  add column if not exists request_url          text,
  add column if not exists request_method       text,
  add column if not exists request_headers      jsonb,
  add column if not exists response_headers     jsonb,
  add column if not exists correlation_id       text,
  add column if not exists telecom_line_id      uuid references public.telecom_lines(id) on delete set null,
  add column if not exists provisioning_job_id  uuid references public.provisioning_jobs(id) on delete set null;

-- Operational debugging: look up all provider calls for a given job, line, or trace
create index if not exists idx_sync_logs_provider_job
  on public.provider_sync_logs(provider_job_id)
  where provider_job_id is not null;

create index if not exists idx_sync_logs_provisioning_job
  on public.provider_sync_logs(provisioning_job_id)
  where provisioning_job_id is not null;

create index if not exists idx_sync_logs_telecom_line
  on public.provider_sync_logs(telecom_line_id)
  where telecom_line_id is not null;

create index if not exists idx_sync_logs_correlation
  on public.provider_sync_logs(correlation_id)
  where correlation_id is not null;
