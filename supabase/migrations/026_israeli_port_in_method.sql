-- Tracks which mechanism actually completed an Israeli port-in: a direct
-- add onto the target line (type: 'add', line_id set), or the landing-line
-- fallback (type: 'create', a temporary line later relocated). The direct
-- path is confirmed accepted by Annatel's validator (a probe with a bogus
-- line_id got "line_id does not exist" rather than any other rejection) but
-- has not yet completed a real port end-to-end, unlike the landing-line
-- path which has (twice, Jul 7 2026).
alter table public.israeli_port_in_requests
  add column if not exists method text check (method in ('direct', 'landing'));
