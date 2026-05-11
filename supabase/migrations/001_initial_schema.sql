create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  monthly_price_cents integer not null check (monthly_price_cents > 0),
  currency text not null default 'USD',
  stripe_price_id text,
  features jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  full_name text,
  email text unique,
  phone text,
  stripe_customer_id text unique,
  referral_code text unique,
  referred_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  plan_id uuid references public.plans(id) on delete set null,
  stripe_checkout_session_id text unique,
  payment_status text not null default 'pending',
  order_status text not null default 'checkout_created',
  provisioning_status text not null default 'new_order' check (
    provisioning_status in (
      'new_order',
      'payment_confirmed',
      'awaiting_sim_assignment',
      'sim_assigned',
      'activation_sent',
      'active',
      'suspended',
      'cancelled'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  plan_id uuid references public.plans(id) on delete set null,
  stripe_subscription_id text unique,
  status text not null default 'incomplete',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.provisioning_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  status text not null,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_customer_id uuid references public.customers(id) on delete set null,
  referred_customer_id uuid references public.customers(id) on delete set null,
  referral_code text,
  status text not null default 'pending',
  reward_type text,
  reward_value_cents integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  subject text not null,
  message text not null,
  status text not null default 'open',
  priority text not null default 'normal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  stripe_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger plans_set_updated_at before update on public.plans
  for each row execute function public.set_updated_at();
create trigger customers_set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();
create trigger referrals_set_updated_at before update on public.referrals
  for each row execute function public.set_updated_at();
create trigger support_tickets_set_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.customer_belongs_to_current_user(customer_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.customers
    where id = customer_uuid
      and user_id = auth.uid()
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    new.raw_user_meta_data ->> 'phone',
    'customer'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    phone = coalesce(public.profiles.phone, excluded.phone),
    updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.subscriptions enable row level security;
alter table public.provisioning_events enable row level security;
alter table public.referrals enable row level security;
alter table public.support_tickets enable row level security;
alter table public.payment_events enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles readable by owner or admin"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy "profiles insertable by owner or admin"
on public.profiles for insert
with check (id = auth.uid() or public.is_admin());

create policy "profiles updatable by owner or admin"
on public.profiles for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "active plans are public"
on public.plans for select
using (active = true or public.is_admin());

create policy "plans admin managed"
on public.plans for all
using (public.is_admin())
with check (public.is_admin());

create policy "customers readable by owner or admin"
on public.customers for select
using (user_id = auth.uid() or public.is_admin());

create policy "customers insertable by owner or admin"
on public.customers for insert
with check (user_id = auth.uid() or public.is_admin());

create policy "customers updatable by owner or admin"
on public.customers for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy "orders readable by owning customer or admin"
on public.orders for select
using (public.is_admin() or public.customer_belongs_to_current_user(customer_id));

create policy "orders admin managed"
on public.orders for all
using (public.is_admin())
with check (public.is_admin());

create policy "subscriptions readable by owning customer or admin"
on public.subscriptions for select
using (public.is_admin() or public.customer_belongs_to_current_user(customer_id));

create policy "subscriptions admin managed"
on public.subscriptions for all
using (public.is_admin())
with check (public.is_admin());

create policy "provisioning events readable by owning customer or admin"
on public.provisioning_events for select
using (public.is_admin() or public.customer_belongs_to_current_user(customer_id));

create policy "provisioning events admin managed"
on public.provisioning_events for all
using (public.is_admin())
with check (public.is_admin());

create policy "referrals readable by participants or admin"
on public.referrals for select
using (
  public.is_admin()
  or public.customer_belongs_to_current_user(referrer_customer_id)
  or public.customer_belongs_to_current_user(referred_customer_id)
);

create policy "referrals admin managed"
on public.referrals for all
using (public.is_admin())
with check (public.is_admin());

create policy "support tickets readable by owner or admin"
on public.support_tickets for select
using (public.is_admin() or public.customer_belongs_to_current_user(customer_id));

create policy "support tickets insertable by owner or admin"
on public.support_tickets for insert
with check (public.is_admin() or public.customer_belongs_to_current_user(customer_id));

create policy "support tickets admin managed"
on public.support_tickets for update
using (public.is_admin())
with check (public.is_admin());

create policy "payment events admin readable"
on public.payment_events for select
using (public.is_admin());

create policy "payment events admin managed"
on public.payment_events for all
using (public.is_admin())
with check (public.is_admin());

create policy "audit logs admin readable"
on public.audit_logs for select
using (public.is_admin());

create policy "audit logs admin insertable"
on public.audit_logs for insert
with check (public.is_admin());

create index customers_user_id_idx on public.customers(user_id);
create index orders_customer_id_idx on public.orders(customer_id);
create index orders_provisioning_status_idx on public.orders(provisioning_status);
create index subscriptions_customer_id_idx on public.subscriptions(customer_id);
create index provisioning_events_customer_id_idx on public.provisioning_events(customer_id);
create index provisioning_events_order_id_idx on public.provisioning_events(order_id);
create index referrals_referrer_customer_id_idx on public.referrals(referrer_customer_id);
create index support_tickets_customer_id_idx on public.support_tickets(customer_id);
