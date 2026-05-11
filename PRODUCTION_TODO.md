# BitLink Production Launch Checklist

- Replace legal placeholders with reviewed Terms, Privacy, Acceptable Use, support, refund, billing, and telecom-specific language.
- Create Stripe products and recurring monthly prices, then fill all `STRIPE_PRICE_*` variables.
- Configure the Stripe webhook endpoint at `/api/stripe/webhook` and verify events in Stripe Dashboard.
- Confirm Supabase email settings, redirect URLs, rate limits, and MFA/admin access policy.
- Create the first admin user in Supabase Auth, then set `public.profiles.role = 'admin'` for that user.
- Decide whether checkout is guest-first, account-first, or hybrid before launch; current MVP supports guest checkout plus account linking by email.
- Connect a real telecom provider, reseller API, eSIM provider, or internal provisioning workflow behind `src/lib/provider`.
- Add production observability for webhook failures, provisioning lag, support response SLA, and payment failure recovery.
- Add automated E2E tests for signup, checkout session creation, Stripe webhook sync, admin provisioning updates, and account access policies.
- Configure domain, TLS, transactional email, support inbox, and data retention policy for `bitlink.co.il`.
