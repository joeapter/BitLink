-- Tracks admin-initiated port-in requests for existing lines. Two kinds:
--
-- intl_port_in_requests: US/UK/Canada — always a manual process (Annatel
-- coordinates with the losing US-side carrier by email, 3-5 business days).
-- This table is pure tracking; nothing here calls Annatel automatically.
-- "Completing" a request attaches the number via the provider's generic DID
-- endpoint and folds billing into the line's subscription.
--
-- israeli_port_in_requests: a real Israeli MNP port, SMS-verified and
-- initiated through Annatel's API, but landing on an existing line requires
-- relocating the DID off the temporary line Annatel's port-in mechanism
-- creates (see lib/custom-orders/israeli-port-in.ts for why).
create table if not exists public.intl_port_in_requests (
  id uuid primary key default gen_random_uuid(),
  line_id uuid not null references public.telecom_lines(id) on delete cascade,
  country text not null check (country in ('us', 'canada', 'uk')),
  number text not null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  one_time_fee_billing_mode text not null default 'paid' check (one_time_fee_billing_mode in ('paid', 'free')),
  monthly_billing_mode text not null default 'paid' check (monthly_billing_mode in ('paid', 'free')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.intl_port_in_requests enable row level security;

create policy "Service role manages intl_port_in_requests"
  on public.intl_port_in_requests for all
  using (auth.role() = 'service_role');

create table if not exists public.israeli_port_in_requests (
  id uuid primary key default gen_random_uuid(),
  line_id uuid not null references public.telecom_lines(id) on delete cascade,
  number text not null,
  -- 'replace' releases the line's current primary number back to inventory
  -- and installs the ported number as primary; 'secondary' attaches it
  -- alongside the existing number(s), same as the existing secondary-DID
  -- feature.
  mode text not null check (mode in ('replace', 'secondary')),
  billing_mode text not null default 'paid' check (billing_mode in ('paid', 'free')),
  status text not null default 'pending_auth' check (
    status in ('pending_auth', 'verifying', 'ready_to_port', 'porting', 'ready_to_complete', 'completed', 'failed', 'cancelled')
  ),
  provider_bulk_request_id text,
  provider_landing_line_id text,
  error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.israeli_port_in_requests enable row level security;

create policy "Service role manages israeli_port_in_requests"
  on public.israeli_port_in_requests for all
  using (auth.role() = 'service_role');
