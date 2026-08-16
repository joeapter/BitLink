-- Admin SMS console: outbound marketing/service SMS composed at /admin/sms.
-- Default channel is 'device' — the console opens the message in the Messages
-- app on Joe's own phone (free, sent from his BitLink line) and logs the
-- handoff here; a gateway channel exists but needs no account to be useful.
-- Customers get an sms_opt_out flag the composer respects — Israeli spam law
-- requires honoring opt-outs even for existing customers.

create table public.sms_messages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  to_number text not null,
  body text not null,
  campaign text,
  -- 'opened' = handed off to the Messages app on Joe's phone (device channel);
  -- we can't observe whether he actually hit send, so it never becomes 'sent'.
  status text not null default 'queued'
    check (status in ('queued', 'opened', 'sent', 'failed')),
  provider text not null default 'device',
  provider_message_id text,
  error text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index sms_messages_customer_id_idx on public.sms_messages(customer_id);
create index sms_messages_created_at_idx on public.sms_messages(created_at desc);
create index sms_messages_campaign_idx on public.sms_messages(campaign) where campaign is not null;

alter table public.sms_messages enable row level security;

create policy "Service role full access to sms_messages"
  on public.sms_messages
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

alter table public.customers
  add column if not exists sms_opt_out boolean not null default false;

-- Reusable message templates the composer offers. Bodies support {name}
-- (recipient's first name) and {link} (their personal referral link).
create table public.sms_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  body text not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger sms_templates_set_updated_at
  before update on public.sms_templates
  for each row execute function public.set_updated_at();

alter table public.sms_templates enable row level security;

create policy "Service role full access to sms_templates"
  on public.sms_templates
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

insert into public.sms_templates (name, body) values
  (
    'Referral: 5GB for you + 5GB for a friend',
    'Hi {name}, it''s BitLink.
Refer a friend and you BOTH get +5GB/month free, every month your lines stay active.
Your link: {link}
Great phone service & free data...
BitLink, it''s a no brainer!
Reply STOP to opt out.'
  ),
  (
    'Maaser to your yeshiva/seminary',
    'Hi {name}, it''s BitLink.
Yeshiva or Seminary for the year? Reply with the name of your yeshiva/seminary, and we''ll send maaser from your line directly to them every month.
Great phone service & tzedakah...
BitLink, it''s a no brainer!
Reply STOP to opt out.'
  );
