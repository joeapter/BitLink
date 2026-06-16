-- ── Support v2 ────────────────────────────────────────────────────────────────
-- Adds ticket numbers, WhatsApp flow fields, macros table, and indexes.
-- Existing support_tickets rows are left intact (ticket_number nullable for
-- old rows, required via trigger for all new inserts).

-- Sequence for human-readable ticket numbers: BL-1001, BL-1002, …
create sequence if not exists public.support_ticket_number_seq start 1001;

-- Add new columns (safe with IF NOT EXISTS guard via DO block)
alter table public.support_tickets
  add column if not exists ticket_number    text unique,
  add column if not exists customer_name   text,
  add column if not exists whatsapp_number text,
  add column if not exists email           text,
  add column if not exists bitlink_phone   text,
  add column if not exists category        text not null default 'other',
  add column if not exists source          text not null default 'website';

-- Auto-set ticket_number on insert if not provided
create or replace function public.set_ticket_number()
returns trigger language plpgsql as $$
begin
  if new.ticket_number is null then
    new.ticket_number := 'BL-' || nextval('public.support_ticket_number_seq')::text;
  end if;
  return new;
end;
$$;

drop trigger if exists support_tickets_set_ticket_number on public.support_tickets;
create trigger support_tickets_set_ticket_number
  before insert on public.support_tickets
  for each row execute function public.set_ticket_number();

-- Indexes
create index if not exists support_tickets_status_idx       on public.support_tickets(status);
create index if not exists support_tickets_category_idx     on public.support_tickets(category);
create index if not exists support_tickets_created_at_idx   on public.support_tickets(created_at desc);
create index if not exists support_tickets_whatsapp_idx     on public.support_tickets(whatsapp_number);
create index if not exists support_tickets_bitlink_phone_idx on public.support_tickets(bitlink_phone);

-- ── Macros ────────────────────────────────────────────────────────────────────
create table if not exists public.support_macros (
  id          uuid primary key default gen_random_uuid(),
  title       text    not null,
  category    text,
  body        text    not null,
  usage_count integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger support_macros_set_updated_at
  before update on public.support_macros
  for each row execute function public.set_updated_at();

create index if not exists support_macros_category_active_idx
  on public.support_macros(category, active);

alter table public.support_macros enable row level security;

create policy "support macros admin managed"
  on public.support_macros for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── Seed macros ───────────────────────────────────────────────────────────────
insert into public.support_macros (title, category, body) values
(
  'No data — first checks',
  'no_data',
  'Hey, I can help. First, restart your phone once. Then make sure mobile data is on and WiFi is off. Send me a screenshot of the signal indicator at the top of your screen — does it say LTE, 5G, SOS, or No Service?'
),
(
  'eSIM activation — first checks',
  'esim_activation',
  'No worries, this is usually a quick fix. Go to Settings → Cellular (or Mobile Service) and check if the BitLink eSIM appears. If yes, make sure it''s turned on and set as the data line.'
),
(
  'Port-in status reassurance',
  'porting',
  'Porting can take a little time and may briefly interrupt service when the number switches. I''m checking the status now and will update you as soon as I see movement.'
),
(
  'Billing — payment failed',
  'billing',
  'I''m looking at the billing side now. If your card failed, we''ll help you update the payment and keep your line active. Can you confirm which card you''re using?'
),
(
  'Provider escalation',
  'escalation',
  'I''m escalating this to our network provider now. I''ll keep this ticket open and update you as soon as I get a response — usually within a few hours.'
),
(
  'Resolved confirmation',
  'resolved',
  'Can you confirm everything is working now? Once you confirm, I''ll mark this ticket resolved. Thanks for your patience!'
),
(
  'Roaming — setup check',
  'roaming_travel',
  'For roaming to work, make sure Data Roaming is enabled in your phone settings (Settings → Cellular → Data Roaming). Also confirm your plan includes international roaming — I''ll check on my end too.'
),
(
  'Lost phone — immediate steps',
  'lost_phone',
  'I''m sorry to hear that. I can suspend your line immediately to prevent unauthorized use. Want me to do that now? Once you have a replacement phone or SIM, we''ll reactivate it.'
)
on conflict do nothing;
