-- Sign-off change across every SMS template: "BitLink, it's a no brainer!"
-- becomes "BitLink, Next."
--
-- Written as its own migration rather than editing 032/033, which are already
-- applied — migrations stay append-only, and a fresh environment still lands
-- on the same final wording after running all four in order.
--
-- Safe to re-run: the WHERE clause matches nothing once it has been applied.

update public.sms_templates
set body = replace(body, 'BitLink, it''s a no brainer!', 'BitLink, Next.')
where body like '%no brainer%';
