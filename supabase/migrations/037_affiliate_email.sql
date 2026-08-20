-- Reps get an email the moment a trial they sent converts to a paying
-- customer, so `contact` (freeform: "@racheli / whatsapp") isn't enough — we
-- need a real address to send to. Separate column, nullable: a Rep without an
-- email still tracks and still earns, they just don't get notified.

alter table public.affiliates
  add column if not exists email text;
