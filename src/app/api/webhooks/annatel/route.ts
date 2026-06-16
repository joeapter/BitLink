// Annatel webhook ingestion endpoint.
//
// CRITICAL rules:
//   1. Read raw bytes FIRST — before any parsing
//   2. Store to webhook_events table IMMEDIATELY
//   3. Return 200 AS FAST AS POSSIBLE — Annatel retries on non-200
//   4. Never reject duplicate events — return 200, skip reprocessing
//   5. Dispatch async processing via Inngest AFTER storage
//
// If storage fails (step 2), return 500 so Annatel will retry.
// Every other failure path returns 200 to stop retry storms.

import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';
import { inngest } from '@/inngest/client';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const log = logger.child({ route: 'webhooks/annatel' });

export async function POST(request: NextRequest): Promise<Response> {
  const rawPayload = Buffer.from(await request.arrayBuffer());
  const headers = Object.fromEntries(request.headers.entries());
  const receivedAt = new Date().toISOString();

  // Idempotency key: prefer Annatel's event ID, fall back to payload hash.
  const payloadHash = createHash('sha256').update(rawPayload).digest('hex');
  const idempotencyKey = (headers['x-annatel-event-id'] as string | undefined) ?? payloadHash;

  const admin = createSupabaseAdminClient();
  if (!admin) {
    log.error('Supabase admin client unavailable — SUPABASE_SERVICE_ROLE_KEY missing');
    return new Response('configuration error', { status: 500 });
  }

  // Annatel doesn't sign payloads — instead we registered a custom x-bitlink-secret
  // header on the webhook endpoint. Verify that header matches our stored secret.
  const incomingSecret = headers['x-bitlink-secret'] ?? '';
  const expectedSecret = process.env.ANNATEL_WEBHOOK_SECRET ?? '';
  const signatureValid = !expectedSecret || incomingSecret === expectedSecret;

  // Atomic upsert — ON CONFLICT DO NOTHING eliminates the TOCTOU race on the unique
  // idempotency_key index. Returns empty array for duplicates, one row for new inserts.
  const { data: inserted, error: upsertError } = await admin
    .from('webhook_events')
    .upsert(
      {
        provider_id: 'annatel',
        provider_event_id: (headers['x-annatel-event-id'] as string | undefined) ?? null,
        received_at: receivedAt,
        headers: headers as never,
        raw_payload: rawPayload.toString('base64'),
        signature_valid: signatureValid,
        idempotency_key: idempotencyKey,
        status: 'received',
      },
      { onConflict: 'idempotency_key', ignoreDuplicates: true },
    )
    .select('id');

  if (upsertError) {
    log.error({ error: upsertError.message, idempotencyKey }, 'Failed to store webhook event');
    return new Response('storage error', { status: 500 });
  }

  if (!inserted || inserted.length === 0) {
    log.info({ idempotencyKey }, 'Duplicate webhook — already received');
    return new Response('ok', { status: 200 });
  }

  // Fire-and-forget async processing via Inngest.
  try {
    await inngest.send({
      name: 'webhook/annatel.received',
      data: { idempotencyKey },
    });
  } catch (err) {
    // Inngest failure is non-fatal here — the event is stored and can be replayed manually.
    log.warn(
      { idempotencyKey, error: err instanceof Error ? err.message : String(err) },
      'Failed to enqueue webhook for processing',
    );
  }

  log.info({ idempotencyKey, signatureValid }, 'Webhook received');
  return new Response('ok', { status: 200 });
}
