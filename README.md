# BitLink

Production-grade MVP foundation for `bitlink.co.il`: public telecom website, plan checkout, customer account portal, admin dashboard, Supabase schema, Stripe Billing integration, and a manual telecom provider abstraction.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Supabase Auth, Postgres, RLS, storage-ready helpers
- Stripe Billing Checkout, webhook sync, customer portal route
- Framer Motion, lucide-react, zod

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Fill `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ISRAEL_BASIC=
STRIPE_PRICE_ISRAEL_PLUS=
STRIPE_PRICE_DATA_PLUS=
STRIPE_PRICE_UNLIMITED_DATA_PLUS=
```

4. Apply Supabase SQL:

- Run `supabase/migrations/001_initial_schema.sql`
- Run `supabase/seed/001_seed_plans.sql`

5. Create Stripe products and monthly recurring prices for the four plans. Put the resulting price IDs into the `STRIPE_PRICE_*` variables.

6. Run the app:

```bash
npm run dev
```

## Admin User

Create a user through Supabase Auth or `/signup`, then promote that profile in Supabase SQL:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```

Admin routes are server-protected by `profiles.role = 'admin'`.

## Important Routes

- Public: `/`, `/plans`, `/plans/israel-basic`, `/plans/israel-plus`, `/plans/data-plus`, `/plans/unlimited-data-plus`, `/refer`, `/support`
- Checkout: `/checkout`, `/checkout/success`, `/checkout/cancel`
- Auth/account: `/login`, `/signup`, `/account`, `/account/billing`, `/account/activation`, `/account/referrals`
- Admin: `/admin`, `/admin/customers`, `/admin/orders`, `/admin/subscriptions`, `/admin/provisioning`, `/admin/plans`, `/admin/referrals`, `/admin/support`, `/admin/settings`

## Stripe Webhooks

Configure Stripe to send events to:

```text
https://bitlink.co.il/api/stripe/webhook
```

Handled events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

The webhook verifies the Stripe signature and never fakes successful payment state.

## Provider Layer

Provider integration is intentionally abstracted behind:

- `src/lib/provider/provider-types.ts`
- `src/lib/provider/manual-provider.ts`
- `src/lib/provider/index.ts`

The MVP manual provider writes provisioning events and returns safe placeholders. Replace it later with a real telecom provider, reseller API, eSIM provider, or internal provisioning platform without rewriting checkout/account/admin flows.

## Quality Commands

```bash
npm run lint
npm run typecheck
npm run build
```

## Production TODO

See `PRODUCTION_TODO.md`.
