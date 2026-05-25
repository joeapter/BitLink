// Stripe webhook ingestion — store-first pattern, mirrors Annatel webhook handler.
//
// Rules (same as Annatel):
//   1. Verify Stripe signature FIRST
//   2. Upsert to stripe_events IMMEDIATELY (idempotent on stripe_event_id)
//   3. Return 200 AS FAST AS POSSIBLE — Stripe retries on non-200
//   4. Never reject duplicates — return 200, skip reprocessing
//   5. Dispatch async processing via Inngest AFTER storage
//
// Storage failure → 500 so Stripe will retry.
// Every other failure → 200 to stop retry storms.
//
// Body handling: MUST use arrayBuffer() → Buffer, NOT request.text().
// Stripe's HMAC is computed over the exact raw bytes. request.text() runs a
// UTF-8 TextDecoder which can normalise certain byte sequences in the
// Next.js/Turbopack dev pipeline, causing the recomputed HMAC to diverge.
// Passing a Buffer bypasses that decode/encode round-trip entirely.

import type Stripe from 'stripe';
import { NextRequest } from 'next/server';
import { getStripeClient, getStripeWebhookSecret } from '@/lib/stripe/client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { storeStripeEvent } from '@/lib/db/stripe-events';
import { inngest } from '@/inngest/client';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // never Edge — body APIs differ

const log = logger.child({ route: 'webhooks/stripe' });

export async function POST(request: NextRequest): Promise<Response> {
  // ── Debug: signature presence ─────────────────────────────────
  const signature = request.headers.get('stripe-signature');
  log.debug(
    { hasSignature: Boolean(signature), signaturePrefix: signature?.slice(0, 20) },
    'Stripe webhook received',
  );
  if (!signature) {
    log.warn('Rejected: missing stripe-signature header');
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  let stripe: ReturnType<typeof getStripeClient>;
  let webhookSecret: string;
  try {
    stripe = getStripeClient();
    webhookSecret = getStripeWebhookSecret();
  } catch {
    log.error('Stripe not configured — check STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET');
    return new Response('Stripe not configured', { status: 503 });
  }

  // ── Debug: secret source ──────────────────────────────────────
  log.debug(
    {
      secretSource: process.env.STRIPE_WEBHOOK_SECRET ? 'env:STRIPE_WEBHOOK_SECRET' : 'missing',
      secretPrefix: webhookSecret.slice(0, 8),
    },
    'Webhook secret loaded',
  );

  // Read raw bytes — arrayBuffer → Buffer avoids TextDecoder normalisation.
  // NEVER use request.text() or request.json() before constructEvent.
  const rawBodyBuffer = Buffer.from(await request.arrayBuffer());

  // ── Debug: payload size ───────────────────────────────────────
  log.debug({ payloadBytes: rawBodyBuffer.length }, 'Raw body read');

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBodyBuffer, signature, webhookSecret);
    log.debug({ eventId: event.id, type: event.type }, 'Stripe signature verified');
  } catch (err) {
    log.warn(
      {
        error: err instanceof Error ? err.message : String(err),
        payloadBytes: rawBodyBuffer.length,
        signatureHeader: signature.slice(0, 60),
      },
      'Stripe signature verification failed',
    );
    return new Response('Invalid Stripe signature', { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    log.error('Supabase admin client unavailable — check SUPABASE_SERVICE_ROLE_KEY');
    return new Response('Configuration error', { status: 500 });
  }

  // Idempotent upsert — ON CONFLICT DO NOTHING on stripe_event_id unique index
  let stored: Awaited<ReturnType<typeof storeStripeEvent>>;
  try {
    stored = await storeStripeEvent(admin, event);
  } catch (err) {
    log.error(
      { eventId: event.id, error: err instanceof Error ? err.message : String(err) },
      'Failed to store Stripe event',
    );
    return new Response('Storage error', { status: 500 });
  }

  if (!stored.isNew) {
    log.info({ eventId: event.id, type: event.type }, 'Duplicate Stripe event — already received');
    return new Response('ok', { status: 200 });
  }

  // Fire-and-forget async processing — Inngest failure is non-fatal here.
  // The event is durably stored and can be replayed manually if needed.
  try {
    await inngest.send({
      name: 'stripe/event.received',
      data: { stripeEventId: event.id },
    });
  } catch (err) {
    log.warn(
      { eventId: event.id, error: err instanceof Error ? err.message : String(err) },
      'Failed to enqueue Stripe event for processing — stored, can be replayed',
    );
  }

  log.info({ eventId: event.id, type: event.type, livemode: event.livemode }, 'Stripe event received');
  return new Response('ok', { status: 200 });
}
