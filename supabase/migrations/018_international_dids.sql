-- BitLink — migration 018
-- International DID inventory: US/Canada/UK numbers BitLink owns via Annatel,
-- for the US/CA/UK number add-on. Annatel's /api/dids has no concept of
-- "assigned vs available" (confirmed against the live API), so BitLink tracks
-- that itself here — same pattern already used for the Israeli DID pool
-- (see collectUsedNumbers/getAvailableDid in lib/provisioning/orchestrator.ts).
--
-- Lifecycle: available -> reserved (customer picked one at checkout, before
-- payment settles) -> assigned (attached to a live line via provider.assignDid
-- once the line goes ACTIVE, see completeJob() in orchestrator.ts).

create table if not exists public.international_dids (
  id                  uuid        primary key default gen_random_uuid(),
  number              text        not null unique,
  country             text        not null check (country in ('us','canada','uk')),
  region              text,
  city                text,
  monthly_cost_cents  integer     not null default 0,
  status              text        not null default 'available'
                        check (status in ('available','reserved','assigned')),
  reserved_token      text,
  reserved_at         timestamptz,
  assigned_line_id    uuid        references public.telecom_lines(id) on delete set null,
  assigned_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_international_dids_country_status
  on public.international_dids(country, status);

create trigger international_dids_set_updated_at
  before update on public.international_dids
  for each row execute function public.set_updated_at();

alter table public.international_dids enable row level security;

create policy "international_dids admin all"
  on public.international_dids for all
  using (public.is_admin()) with check (public.is_admin());

-- ── Seed: 2026-07-08 Annatel DID order (WHK-235665) ─────────────────────────
-- UK mobile numbers have no region/city breakdown from Annatel — "Mobile" is
-- their own label, not a real place. US block had no per-number detail rows
-- in the order confirmation, so region/city there are inferred from the NANP
-- area code (315 -> Syracuse NY, 929 -> NYC) and monthly_cost_cents assumes
-- the same rate as the Canada block (same trunk/tier) — confirm with Annatel
-- if exact US cost matters for margin tracking.
insert into public.international_dids (number, country, region, city, monthly_cost_cents)
values
  ('+447520654104', 'uk', null, 'Mobile', 90),
  ('+447520654122', 'uk', null, 'Mobile', 90),
  ('+447520654167', 'uk', null, 'Mobile', 90),
  ('+447520654108', 'uk', null, 'Mobile', 90),
  ('+447520654214', 'uk', null, 'Mobile', 90),
  ('+447520654064', 'uk', null, 'Mobile', 90),
  ('+447520654368', 'uk', null, 'Mobile', 90),
  ('+447520654410', 'uk', null, 'Mobile', 90),
  ('+447520654382', 'uk', null, 'Mobile', 90),
  ('+447520654285', 'uk', null, 'Mobile', 90),
  ('+447520654229', 'uk', null, 'Mobile', 90),
  ('+447520654236', 'uk', null, 'Mobile', 90),
  ('+447520654290', 'uk', null, 'Mobile', 90),
  ('+447520654053', 'uk', null, 'Mobile', 90),
  ('+447520654373', 'uk', null, 'Mobile', 90),
  ('+447520654318', 'uk', null, 'Mobile', 90),
  ('+447520654137', 'uk', null, 'Mobile', 90),
  ('+447520654250', 'uk', null, 'Mobile', 90),
  ('+447520654155', 'uk', null, 'Mobile', 90),
  ('+447520654143', 'uk', null, 'Mobile', 90),
  ('+447520654195', 'uk', null, 'Mobile', 90),
  ('+447520654183', 'uk', null, 'Mobile', 90),
  ('+447520654305', 'uk', null, 'Mobile', 90),
  ('+447520654065', 'uk', null, 'Mobile', 90),
  ('+447520654319', 'uk', null, 'Mobile', 90),
  ('+15144185941', 'canada', 'Quebec', 'Montreal', 45),
  ('+15144186026', 'canada', 'Quebec', 'Montreal', 45),
  ('+15144186025', 'canada', 'Quebec', 'Montreal', 45),
  ('+15144185931', 'canada', 'Quebec', 'Montreal', 45),
  ('+15144185942', 'canada', 'Quebec', 'Montreal', 45),
  ('+15144185947', 'canada', 'Quebec', 'Montreal', 45),
  ('+15144185936', 'canada', 'Quebec', 'Montreal', 45),
  ('+15144185932', 'canada', 'Quebec', 'Montreal', 45),
  ('+15144186022', 'canada', 'Quebec', 'Montreal', 45),
  ('+15144186020', 'canada', 'Quebec', 'Montreal', 45),
  ('+16474959016', 'canada', 'Ontario', 'Toronto', 45),
  ('+16474939679', 'canada', 'Ontario', 'Toronto', 45),
  ('+16474939689', 'canada', 'Ontario', 'Toronto', 45),
  ('+16474939684', 'canada', 'Ontario', 'Toronto', 45),
  ('+16474939691', 'canada', 'Ontario', 'Toronto', 45),
  ('+16474939749', 'canada', 'Ontario', 'Toronto', 45),
  ('+16474939721', 'canada', 'Ontario', 'Toronto', 45),
  ('+16474958053', 'canada', 'Ontario', 'Toronto', 45),
  ('+16474939695', 'canada', 'Ontario', 'Toronto', 45),
  ('+16474958016', 'canada', 'Ontario', 'Toronto', 45),
  ('+16474939690', 'canada', 'Ontario', 'Toronto', 45),
  ('+16474939761', 'canada', 'Ontario', 'Toronto', 45),
  ('+16474958055', 'canada', 'Ontario', 'Toronto', 45),
  ('+16474939676', 'canada', 'Ontario', 'Toronto', 45),
  ('+16474939755', 'canada', 'Ontario', 'Toronto', 45),
  ('+13155127626', 'us', 'New York', 'Syracuse', 45),
  ('+13155127627', 'us', 'New York', 'Syracuse', 45),
  ('+13155127628', 'us', 'New York', 'Syracuse', 45),
  ('+13155127629', 'us', 'New York', 'Syracuse', 45),
  ('+13155127630', 'us', 'New York', 'Syracuse', 45),
  ('+13155127631', 'us', 'New York', 'Syracuse', 45),
  ('+13155127632', 'us', 'New York', 'Syracuse', 45),
  ('+13155127633', 'us', 'New York', 'Syracuse', 45),
  ('+13155127634', 'us', 'New York', 'Syracuse', 45),
  ('+13155127636', 'us', 'New York', 'Syracuse', 45),
  ('+13155127637', 'us', 'New York', 'Syracuse', 45),
  ('+13155127638', 'us', 'New York', 'Syracuse', 45),
  ('+13155127639', 'us', 'New York', 'Syracuse', 45),
  ('+19295978759', 'us', 'New York', 'New York City', 45),
  ('+19295978859', 'us', 'New York', 'New York City', 45),
  ('+19295978870', 'us', 'New York', 'New York City', 45),
  ('+19295978901', 'us', 'New York', 'New York City', 45),
  ('+19295978913', 'us', 'New York', 'New York City', 45),
  ('+19295978917', 'us', 'New York', 'New York City', 45),
  ('+19295978918', 'us', 'New York', 'New York City', 45),
  ('+19295978919', 'us', 'New York', 'New York City', 45),
  ('+19295978922', 'us', 'New York', 'New York City', 45),
  ('+19295978928', 'us', 'New York', 'New York City', 45),
  ('+19295978931', 'us', 'New York', 'New York City', 45),
  ('+19295978932', 'us', 'New York', 'New York City', 45)
on conflict (number) do nothing;
