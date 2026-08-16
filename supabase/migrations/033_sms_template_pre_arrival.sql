-- Third SMS template: customers who signed up with a US/UK/CA number are
-- usually still abroad and haven't landed yet. SMS-to-email forwarding is a
-- carrier-side setting (it intercepts the text before it reaches the handset),
-- so it works before they ever set foot in Israel — which lets them register
-- WhatsApp and an Israeli bank on their Israeli number from home.
--
-- WORDING DEPENDS ON A MANUAL STEP: this says forwarding is already on, which
-- is only true because Joe sets it up per customer from the admin line tools
-- BEFORE texting them. The console's "SMS→email on" badge and its filter come
-- from the sms_forwarder_added audit log, so only send this to badged rows.
-- If that workflow ever changes, this copy has to change with it.
--
-- Separate migration because 032 was already applied by hand; on conflict do
-- nothing so re-running is safe and never clobbers edits made in the console.

insert into public.sms_templates (name, body) values
  (
    'Pre-arrival: SMS to email while still abroad',
    'Hi {name}, it''s BitLink.
Not in Israel yet? We''ve got you covered.
We''ve switched on automatic SMS-to-email for your line, so every text to your Israeli number also lands in {email}. Go set up WhatsApp and your Israeli bank before you even fly.
Great phone service & a head start...
BitLink, it''s a no brainer!
Reply STOP to opt out.'
  )
on conflict (name) do nothing;
