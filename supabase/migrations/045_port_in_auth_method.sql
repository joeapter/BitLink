-- Let a port-in choose how the owner proves the number is theirs.
--
-- Until now the method was implied by the line: kosher lines got IVR (a
-- certified kosher phone cannot display an SMS), everything else got sms_code.
-- That is the right default and stays the default, but it is not always right.
-- An SMS can simply fail to arrive — a customer's number on 2026-09-27 never
-- received the code, and Annatel's own support suggested verifying by voice
-- instead, which we had no way to ask for.
--
-- IVR is confirmed working on this tenant as of 2026-09-28 (POST
-- .../authentications with authentication_type 'ivr' returns 201). It returned
-- 422 through July because Annatel had no IVR authentication_method configured
-- for us; that has since been provisioned.
--
-- Nullable on purpose: null means "decide from the line", preserving the
-- existing behaviour for every row already in the table and for any caller
-- that does not care. It is written at the moment the code is SENT, because
-- verification has to use the same method the challenge was issued with.
alter table public.israeli_port_in_requests
  add column if not exists auth_method text
    check (auth_method in ('sms_code', 'ivr'));

comment on column public.israeli_port_in_requests.auth_method is
  'How ownership was actually challenged. Null = derived from the line (kosher => ivr). Set when the code is sent, so verify uses the same method.';
