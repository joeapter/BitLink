-- Free trial offer (students/olim): generic settings store + kill switch,
-- and trial-line lifecycle tracking (started, decision due, converted/frozen).

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

insert into public.app_settings (key, value) values ('trial_offer_enabled', 'true');

alter table public.app_settings enable row level security;

create policy "Service role full access to app_settings"
  on public.app_settings
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table public.trial_lines (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  telecom_line_id uuid references public.telecom_lines(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  stripe_customer_id text not null,
  status text not null default 'pending_provision'
    check (status in ('pending_provision', 'active', 'converted', 'frozen', 'cancelled')),
  started_at timestamptz,
  decision_due_at timestamptz,
  decided_at timestamptz,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trial_lines_customer_id_idx on public.trial_lines(customer_id);
create index trial_lines_status_idx on public.trial_lines(status);
create index trial_lines_stripe_customer_id_idx on public.trial_lines(stripe_customer_id);

alter table public.trial_lines enable row level security;

create policy "Service role full access to trial_lines"
  on public.trial_lines
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
