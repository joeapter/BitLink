// Repository for stripe_events — the store-first idempotent Stripe event log.
// Mirrors the design of webhook_events (Annatel).

import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

export interface StripeEventRecord {
  id: string;
  stripeEventId: string;
  eventType: string;
  apiVersion: string | null;
  livemode: boolean;
  receivedAt: string;
  rawPayload: Record<string, unknown>;
  status: string;
  error: string | null;
  attemptCount: number;
  processedAt: string | null;
  createdAt: string;
}

function rowToRecord(row: Record<string, unknown>): StripeEventRecord {
  return {
    id: row.id as string,
    stripeEventId: row.stripe_event_id as string,
    eventType: row.event_type as string,
    apiVersion: (row.api_version ?? null) as string | null,
    livemode: row.livemode as boolean,
    receivedAt: row.received_at as string,
    rawPayload: row.raw_payload as Record<string, unknown>,
    status: row.status as string,
    error: (row.error ?? null) as string | null,
    attemptCount: (row.attempt_count ?? 0) as number,
    processedAt: (row.processed_at ?? null) as string | null,
    createdAt: row.created_at as string,
  };
}

/**
 * Idempotent upsert on stripe_event_id.
 * Returns the record and whether it was newly inserted.
 * Duplicates are detected via ignoreDuplicates — no TOCTOU race.
 */
export async function storeStripeEvent(
  admin: SupabaseClient,
  event: Stripe.Event,
): Promise<{ record: StripeEventRecord; isNew: boolean }> {
  const { data: inserted, error } = await admin
    .from('stripe_events')
    .upsert(
      {
        stripe_event_id: event.id,
        event_type: event.type,
        api_version: event.api_version ?? null,
        livemode: event.livemode,
        raw_payload: event as unknown as Record<string, unknown>,
        status: 'received',
      },
      { onConflict: 'stripe_event_id', ignoreDuplicates: true },
    )
    .select('*');

  if (error) throw new Error(`Failed to store Stripe event: ${error.message}`);

  if (!inserted || inserted.length === 0) {
    const { data: existing, error: fetchErr } = await admin
      .from('stripe_events')
      .select('*')
      .eq('stripe_event_id', event.id)
      .single();
    if (fetchErr || !existing) throw new Error(`Failed to fetch existing Stripe event: ${fetchErr?.message}`);
    return { record: rowToRecord(existing as unknown as Record<string, unknown>), isNew: false };
  }

  return { record: rowToRecord(inserted[0] as unknown as Record<string, unknown>), isNew: true };
}

export async function getStripeEventByStripeId(
  admin: SupabaseClient,
  stripeEventId: string,
): Promise<StripeEventRecord | null> {
  const { data, error } = await admin
    .from('stripe_events')
    .select('*')
    .eq('stripe_event_id', stripeEventId)
    .single();
  if (error || !data) return null;
  return rowToRecord(data as unknown as Record<string, unknown>);
}

export async function updateStripeEventStatus(
  admin: SupabaseClient,
  id: string,
  updates: {
    status: 'processing' | 'processed' | 'failed' | 'skipped';
    error?: string;
  },
): Promise<void> {
  const patch: Record<string, unknown> = { status: updates.status };
  if (updates.status === 'processed' || updates.status === 'skipped') {
    patch.processed_at = new Date().toISOString();
  }
  if (updates.error) patch.error = updates.error;

  const { error } = await admin
    .from('stripe_events')
    .update(patch as never)
    .eq('id', id);
  if (error) throw new Error(`Failed to update Stripe event status: ${error.message}`);
}

/** Recent failures for admin triage — events stuck in processing or marked failed. */
export async function getFailedStripeEvents(
  admin: SupabaseClient,
  limit = 50,
): Promise<StripeEventRecord[]> {
  const { data, error } = await admin
    .from('stripe_events')
    .select('*')
    .in('status', ['failed', 'processing'])
    .order('received_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to fetch failed Stripe events: ${error.message}`);
  return (data ?? []).map((row) => rowToRecord(row as unknown as Record<string, unknown>));
}
