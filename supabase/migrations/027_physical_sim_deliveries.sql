-- Tracks shipping for physical-SIM orders (public checkout, portal add-line,
-- and admin custom orders — all three collect delivery details when
-- physical SIM is chosen). Method is derived server-side from city, never
-- trusted from the client: courier for the whitelisted Jerusalem-area
-- cities, Israel Post everywhere else.
create table if not exists public.physical_sim_deliveries (
  id uuid primary key default gen_random_uuid(),
  telecom_line_id uuid not null references public.telecom_lines(id) on delete cascade,
  method text not null check (method in ('courier', 'israel_post')),
  city text not null,
  address_line1 text not null,
  address_line2 text,
  requested_date date,
  status text not null default 'pending' check (status in ('pending', 'shipped', 'delivered', 'cancelled')),
  tracking_note text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.physical_sim_deliveries enable row level security;

create policy "Service role manages physical_sim_deliveries"
  on public.physical_sim_deliveries for all
  using (auth.role() = 'service_role');

create index if not exists physical_sim_deliveries_line_id_idx on public.physical_sim_deliveries(telecom_line_id);
create index if not exists physical_sim_deliveries_status_idx on public.physical_sim_deliveries(status);
