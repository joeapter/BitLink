-- Support messages / notes per ticket
create table if not exists public.support_messages (
  id                   uuid primary key default gen_random_uuid(),
  ticket_id            uuid not null references public.support_tickets(id) on delete cascade,
  direction            text not null default 'internal', -- internal | inbound | outbound
  channel              text not null default 'note',     -- note | whatsapp | email | call
  body                 text not null,
  sent_by              uuid references public.profiles(id) on delete set null,
  whatsapp_message_id  text,
  metadata             jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now()
);

create index support_messages_ticket_idx on public.support_messages(ticket_id, created_at);

alter table public.support_messages enable row level security;

create policy "support messages admin managed"
  on public.support_messages for all
  using (public.is_admin())
  with check (public.is_admin());
