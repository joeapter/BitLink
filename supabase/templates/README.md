# Supabase Auth email templates

Branded HTML for the six emails GoTrue sends (password reset, signup
confirmation, magic link, invite, email change, reauthentication).

**Do not edit the `.html` files.** They are generated:

```bash
npm run emails:auth
```

Edit [`scripts/build-auth-emails.mjs`](../../scripts/build-auth-emails.mjs)
instead. The layout there deliberately mirrors `layout()` in
[`src/lib/email/templates.ts`](../../src/lib/email/templates.ts) so auth mail and
order mail look like the same company. If you restyle one, restyle both.

## Why this exists

Auth mail used to go out through Supabase's built-in sender. Two problems:

1. **Unbranded** — plain text from a `supabase.io` address, with a
   `<project>.supabase.co` link. It affects the website as well as the app.
2. **Rate limited to a handful per hour.** Past that, GoTrue stops sending and
   reports no error to the caller. Reset emails simply never arrive.

Migadu also gives us authentication the built-in sender structurally cannot:
`bitlink.co.il` publishes SPF `-all`, Migadu DKIM keys, and DMARC
`p=quarantine`, so mail sent through Migadu is fully aligned.

## Links point at our own domain

Every template builds its own URL rather than using `{{ .ConfirmationURL }}`:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
```

This is handled by [`src/app/auth/confirm/route.ts`](../../src/app/auth/confirm/route.ts),
which calls `verifyOtp`. Two benefits over the default:

- The customer sees a `bitlink.co.il` link, not `<project>.supabase.co`.
- **It works cross-device.** `/auth/callback` exchanges a PKCE `code`, which
  needs the verifier cookie from the browser that started the flow — so
  requesting a reset on a phone and opening the email on a laptop fails there.
  `verifyOtp` has no such constraint.

`/auth/confirm` was already written and allow-listed but had never carried
production traffic, so verify the reset flow after rollout (step 2).

## Rollout

### 0. Deploy first — the templates depend on it

The templates reference `https://bitlink.co.il/assets/logo-email.png`, which
ships in this same commit. Install the templates before deploying and every
auth email goes out with a broken logo.

```bash
curl -sI https://www.bitlink.co.il/assets/logo-email.png | head -1   # want 200
```

### 1. Push the config

SMTP, the send rate limit, and all six templates are declared in `config.toml`,
so this is one command rather than a tour of the dashboard:

```bash
supabase config diff                                    # review first
export SUPABASE_AUTH_SMTP_PASSWORD="$(grep '^SMTP_PASSWORD=' .env.production.local | cut -d= -f2- | tr -d '"')"
supabase config push
```

`config push` only writes properties `config.toml` actually declares and leaves
everything else untouched — but it defaults to *proceeding* when run without a
TTY, so always run `config diff` first rather than relying on the prompt.

The Migadu mailbox is the same one `src/lib/email/send.ts` already sends order
mail from. For reference, the dashboard equivalent is Authentication → Emails →
SMTP Settings:

| Field | Value |
| --- | --- |
| Host | `smtp.migadu.com` |
| Port | `587` |
| Username | `orders@bitlink.co.il` |
| Password | existing Migadu password (`SMTP_PASSWORD` in Vercel) |
| Sender email | `orders@bitlink.co.il` |
| Sender name | `BitLink` |

Port 465 also works, but 587/STARTTLS is what Supabase expects by default.

To send as something friendlier (`accounts@`, `no-reply@`), add it as an alias
in Migadu first — keep the **username** as the real mailbox either way.

### 2. Verify

Do this on a real account — it is the path that has never been exercised:

1. Sign out, "Forgot password", submit your own address.
2. Mail arrives from `orders@bitlink.co.il`, branded, logo visible.
3. The link reads `bitlink.co.il/auth/confirm?...`, not `supabase.co`.
4. Clicking it lands on `/reset-password`, not the homepage or `/login`.
5. Repeat with the email open on a **different device** than the request — that
   is the case the old PKCE flow could not handle.
