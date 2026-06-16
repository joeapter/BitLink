-- resolved_at on tickets for resolution time tracking
alter table public.support_tickets
  add column if not exists resolved_at timestamptz;

-- Auto-set resolved_at when status changes to 'resolved'
create or replace function public.set_ticket_resolved_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'resolved' and old.status != 'resolved' then
    new.resolved_at := now();
  end if;
  if new.status != 'resolved' then
    new.resolved_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists support_tickets_set_resolved_at on public.support_tickets;
create trigger support_tickets_set_resolved_at
  before update on public.support_tickets
  for each row execute function public.set_ticket_resolved_at();

-- Call notes — structured post-call log per ticket
create table if not exists public.support_call_notes (
  id                        uuid primary key default gen_random_uuid(),
  ticket_id                 uuid not null references public.support_tickets(id) on delete cascade,
  issue_summary             text,
  root_cause                text,
  fix_given                 text,
  should_create_macro       boolean not null default false,
  should_update_onboarding  boolean not null default false,
  created_by                uuid references public.profiles(id) on delete set null,
  created_at                timestamptz not null default now()
);

create index support_call_notes_ticket_idx on public.support_call_notes(ticket_id);

alter table public.support_call_notes enable row level security;

create policy "support call notes admin managed"
  on public.support_call_notes for all
  using (public.is_admin())
  with check (public.is_admin());

-- Ticket events — audit trail for status/priority changes
create table if not exists public.support_ticket_events (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.support_tickets(id) on delete cascade,
  event_type  text not null,
  event_body  text,
  metadata    jsonb not null default '{}'::jsonb,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index support_ticket_events_ticket_idx on public.support_ticket_events(ticket_id, created_at);

alter table public.support_ticket_events enable row level security;

create policy "support ticket events admin managed"
  on public.support_ticket_events for all
  using (public.is_admin())
  with check (public.is_admin());

-- WhatsApp webhook events — raw inbound payloads from Meta
create table if not exists public.support_webhook_events (
  id                uuid primary key default gen_random_uuid(),
  provider          text not null default 'whatsapp',
  event_type        text,
  raw_payload       jsonb not null,
  processed         boolean not null default false,
  processing_error  text,
  created_at        timestamptz not null default now()
);

create index support_webhook_events_created_idx on public.support_webhook_events(created_at desc);
create index support_webhook_events_processed_idx on public.support_webhook_events(processed) where processed = false;

alter table public.support_webhook_events enable row level security;

create policy "support webhook events admin managed"
  on public.support_webhook_events for all
  using (public.is_admin())
  with check (public.is_admin());
