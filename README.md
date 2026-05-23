# BitLink

Israeli MVNO platform — subscription billing, telecom provisioning, and customer management for bitlink.co.il.

## Overview

BitLink is a production-grade Next.js application for an Israeli MVNO (Mobile Virtual Network Operator). It handles:

- **Plan subscriptions** via Stripe Billing (checkout, webhooks, customer portal)
- **Telecom line provisioning** via Annatel (async BulkRequest pattern with durable job tracking)
- **Customer account portal** (activation timeline, billing management, referrals)
- **Admin dashboard** (provisioning queue, job retry/reconcile, customer management)

The telecom provider is fully abstracted behind a `TelecomProvider` interface. Local development uses a mock provider that resolves synchronously — no Annatel credentials required.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript strict) |
| Database | Supabase (Postgres + Auth + Row Level Security) |
| Billing | Stripe Billing + Webhooks |
| Job queue | Inngest (durable functions, cron reconciliation) |
| Telecom | Annatel API (behind `TelecomProvider` abstraction) |
| Styling | Tailwind CSS v4, Framer Motion |
| Logging | Pino v9 (structured JSON) |
| Validation | Zod v4 |

## Prerequisites

- Node.js 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli): `brew install supabase/tap/supabase`
- [Inngest CLI](https://www.inngest.com/docs/cli): `npm i -g inngest-cli` (for local event processing)
- A Supabase project ([free tier](https://supabase.com) works)
- Stripe account (for billing features)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY at minimum

# 3. Link Supabase and apply migrations
supabase link --project-ref <your-project-ref>
npm run db:push

# 4. Start dev server
npm run dev
```

Open http://localhost:3000.

## Environment Variables

See `.env.example` for the full annotated template. Never commit `.env.local`.

### Required (core)

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API — **server-side only** |

### Required (billing)

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` for dev, `sk_live_...` for production |
| `STRIPE_WEBHOOK_SECRET` | From Stripe CLI output or Dashboard → Webhooks |
| `STRIPE_PRICE_ISRAEL_BASIC` | Stripe Price ID for Israel Basic plan |
| `STRIPE_PRICE_ISRAEL_PLUS` | Stripe Price ID for Israel Plus plan |
| `STRIPE_PRICE_DATA_PLUS` | Stripe Price ID for Data Plus plan |
| `STRIPE_PRICE_UNLIMITED_DATA_PLUS` | Stripe Price ID for Unlimited Data Plus plan |

### Required (real Annatel provisioning only)

Set `TELECOM_PROVIDER=mock` to bypass all of these during local dev.

| Variable | Description |
|---|---|
| `ANNATEL_API_KEY` | Obtain from Annatel business portal — **TODO before going live** |
| `ANNATEL_TENANT_ID` | Obtain from Annatel business portal — **TODO before going live** |
| `ANNATEL_WEBHOOK_SECRET` | Obtain from Annatel business portal — **TODO before going live** |

### Optional

| Variable | Default | Description |
|---|---|---|
| `TELECOM_PROVIDER` | `''` | Set to `mock` to skip real Annatel calls |
| `INNGEST_EVENT_KEY` | — | Required in production; not needed locally |
| `INNGEST_SIGNING_KEY` | — | Required in production; not needed locally |
| `LOG_LEVEL` | `info` | `trace` / `debug` / `info` / `warn` / `error` |
| `SENTRY_DSN` | — | Error monitoring |

## Supabase Setup

### 1. Create a project

[Create a new Supabase project](https://supabase.com/dashboard) and note the Project Reference ID.

### 2. Apply migrations

```bash
supabase link --project-ref <project-ref>
npm run db:push
```

This applies in order:
- `supabase/migrations/001_initial_schema.sql` — auth, profiles, customers, plans, subscriptions, referrals
- `supabase/migrations/002_telecom_schema.sql` — telecom lines, provisioning jobs, webhook events, SIM profiles, sync logs

### 3. Seed plan data

```bash
# Run in Supabase SQL editor or via CLI:
supabase db execute --file supabase/seed/001_seed_plans.sql
```

### 4. Create an admin user

Sign up via `/signup`, then promote the user in the Supabase SQL editor:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'you@example.com';
```

Admin routes are protected server-side by `profiles.role = 'admin'` via `src/lib/auth/admin-guard.ts`.

### 5. Row-Level Security

All tables have RLS enabled. Admin policies grant full access. Customer policies scope data to the authenticated user. Never disable RLS in production.

## Inngest Setup

Inngest handles durable provisioning workflows and the reconciliation cron.

### Local development

```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: Inngest Dev Server (connects to your local app)
npm run inngest:dev
```

The Inngest Dev Server UI is available at http://localhost:8288. Use it to inspect function runs, replay events, and debug provisioning flows.

### Registered functions

| Function ID | Trigger | Purpose |
|---|---|---|
| `provision-line` | `provisioning/line.create` | Execute create_line job through the provider |
| `process-annatel-webhook` | `webhook/annatel.received` | Link inbound Annatel webhooks to provisioning jobs |
| `reconcile-jobs-cron` | Cron `*/5 * * * *` | Poll stale SYNCING/SUBMITTED jobs for completion |

### Production

Set `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` from the Inngest Cloud dashboard. Webhook endpoint: `POST /api/webhooks/inngest`.

## Mock Provider

Set `TELECOM_PROVIDER=mock` in `.env.local` (already set in `.env.example`).

The mock provider (`src/lib/telecom/mock/mock-provider.ts`):

- Resolves `createLine` synchronously — no async polling or webhooks needed
- Returns stable `mock_line_*` and `bur_mock_*` IDs
- `verifyWebhookSignature` always returns `true`
- Supports `simulateFailure()` for testing error paths

When using the mock, `POST /api/admin/lines` runs the full provisioning job in the same request and returns the completed line + job state immediately.

## Real Annatel Integration

> **Not yet active.** All Annatel code is implemented but requires live credentials.

Annatel uses an **async BulkRequest** pattern:

1. `createLine` submits a BulkRequest and returns a `provider_job_id` immediately (status: `SYNCING`)
2. Annatel sends a `bulk_request.done` webhook when the line is ready
3. The webhook processor calls `reconcileJob()` to mark the job `COMPLETED` and the line `ACTIVE`
4. The reconciliation cron (`*/5 * * * *`) handles webhook misses as a fallback

To activate real provisioning:

1. Obtain from Annatel: `ANNATEL_API_KEY`, `ANNATEL_TENANT_ID`, `ANNATEL_WEBHOOK_SECRET`
2. Set in `.env.local`:
   ```
   TELECOM_PROVIDER=
   ANNATEL_API_KEY=<your-key>
   ANNATEL_TENANT_ID=<your-tenant-id>
   ANNATEL_WEBHOOK_SECRET=<your-secret>
   ```
3. Configure the Annatel webhook endpoint to `POST https://bitlink.co.il/api/webhooks/annatel`
4. Start Inngest Cloud (set `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`)

## Webhook Testing

### Annatel webhooks (local)

```bash
# Simulate a completed provisioning webhook
curl -X POST http://localhost:3000/api/webhooks/annatel \
  -H "Content-Type: application/json" \
  -H "x-annatel-event-id: test-event-001" \
  -d '{"type":"bulk_request.done","id":"<provider_job_id>","line_id":"<provider_line_id>","status":"done"}'
```

Replace `<provider_job_id>` with a real `provider_job_id` from `provisioning_jobs`. The mock signature verifier accepts all requests.

### Stripe webhooks (local)

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli), then:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the signing secret printed by the CLI into `STRIPE_WEBHOOK_SECRET`.

### Replay a stale provisioning job

```bash
# Force-reconcile a specific job against the provider
curl -X POST http://localhost:3000/api/admin/jobs/<job-id>/reconcile \
  -H "Cookie: <admin-session-cookie>"

# Retry a FAILED job
curl -X POST http://localhost:3000/api/admin/jobs/<job-id>/retry \
  -H "Cookie: <admin-session-cookie>"
```

## Scripts

```bash
npm run dev           # Start Next.js dev server (http://localhost:3000)
npm run build         # Production build
npm run start         # Start production server
npm run typecheck     # TypeScript check (tsc --noEmit)
npm run lint          # ESLint (src/)
npm run test          # Placeholder — see §Testing below
npm run inngest:dev   # Start Inngest Dev Server (requires dev server running first)
npm run db:push       # Apply pending Supabase migrations
npm run db:reset      # Reset local Supabase database (destructive)
npm run db:types      # Regenerate TypeScript types from DB schema
```

## Admin API Reference

All endpoints require an authenticated session with `profiles.role = 'admin'`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/lines` | List lines (filter: `?status=draft\|provisioning\|active`) |
| `POST` | `/api/admin/lines` | Create line + provisioning job |
| `GET` | `/api/admin/jobs/:id` | Get job status and full transition history |
| `POST` | `/api/admin/jobs/:id/retry` | Reset a FAILED job to PENDING and re-enqueue |
| `POST` | `/api/admin/jobs/:id/reconcile` | Poll provider for current job status |

### Create a line (example)

```bash
curl -X POST http://localhost:3000/api/admin/lines \
  -H "Content-Type: application/json" \
  -H "Cookie: <admin-session>" \
  -d '{
    "planName": "israel_basic",
    "iccId": "89972012345678901234",
    "isKosher": false,
    "language": "he_IL"
  }'
```

## Architecture

```
src/
  app/
    api/
      admin/lines/          POST: create line + job; GET: list lines
      admin/jobs/[id]/      GET: status; POST retry; POST reconcile
      stripe/               Checkout, customer portal, webhook handler
      webhooks/
        annatel/            Ingest raw provider webhooks (fast-path, store-first)
        inngest/            Inngest function handler
  inngest/
    functions/
      provision-line.ts           Durable create_line workflow
      process-annatel-webhook.ts  Webhook → provisioning job linkage
      reconcile-jobs.ts           Cron: poll stale SYNCING/SUBMITTED jobs
  lib/
    provisioning/
      orchestrator.ts             Execution engine (PENDING→SUBMITTED→SYNCING→COMPLETED)
      state-machines/             Job + line state machine validators
    telecom/
      provider.interface.ts       TelecomProvider contract
      annatel/                    Annatel HTTP client + provider + mappers
      mock/                       Synchronous mock for local dev
    db/
      jobs.ts                     provisioning_jobs repository
      lines.ts                    telecom_lines repository
    auth/
      admin-guard.ts              Shared admin auth guard
    events/bus.ts                 In-process event bus (sync side-effects)
    supabase/                     Supabase client helpers (server, admin, client)
    stripe/                       Stripe client helper
```

### Provisioning job lifecycle

```
PENDING → SUBMITTED → SYNCING → COMPLETED
                    ↘ FAILED (retryable via /retry endpoint)
```

- **Mock provider**: `PENDING → SUBMITTED → COMPLETED` in a single synchronous request
- **Real Annatel**: `PENDING → SUBMITTED → SYNCING` on first call; webhook or cron drives `SYNCING → COMPLETED`

### Retry architecture

Provider failures write `FAILED` and return cleanly — Inngest does **not** auto-retry provider errors. Retries are operator-initiated via `POST /api/admin/jobs/:id/retry` (exponential backoff: 30s, 60s, 120s, max 1h). Inngest retries are reserved for infrastructure failures (DB down, network timeout).

## Testing

No automated test suite is configured yet. Recommended setup:

```bash
npm install --save-dev vitest @vitest/coverage-v8
```

Priority areas to cover:
- State machine transitions (`src/lib/provisioning/state-machines/`)
- Orchestrator happy path, retry path, and reconcile path
- Provider mock vs. real dispatch (`provider.registry.ts`)
- Webhook dedup idempotency

## Routes

| Type | Path |
|---|---|
| Public | `/`, `/plans`, `/plans/[slug]`, `/refer`, `/support`, `/legal/[slug]` |
| Auth | `/login`, `/signup` |
| Account | `/account`, `/account/billing`, `/account/activation`, `/account/referrals` |
| Admin | `/admin`, `/admin/customers`, `/admin/orders`, `/admin/subscriptions`, `/admin/provisioning`, `/admin/plans`, `/admin/referrals`, `/admin/support`, `/admin/settings` |

## Deployment

1. Push to GitHub and connect to Vercel (or deploy to any Node.js host)
2. Set all required environment variables in the host dashboard
3. Configure Stripe webhook: `POST https://bitlink.co.il/api/stripe/webhook`
4. Configure Annatel webhook: `POST https://bitlink.co.il/api/webhooks/annatel`
5. Connect Inngest Cloud and set `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY`

See `PRODUCTION_TODO.md` for the full pre-launch checklist.
