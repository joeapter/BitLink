// Durable Inngest function that processes Annatel webhook events.
//
// Flow:
//   1. Fetch the raw webhook_event record written by the ingestion route
//   2. Skip if signature was invalid
//   3. Parse the raw bytes through the provider's parseWebhookEvent()
//   4. Write a normalized telecom_event row
//   5. Mark the webhook_event as processed
//
// Inngest guarantees at-least-once delivery with automatic retries up to 5×.
// Each `step.run` is individually retried, so partial progress is preserved.
// The concurrency key on idempotencyKey means duplicate events don't race.

import { inngest } from '@/inngest/client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';
import { reconcileJob } from '@/lib/provisioning/orchestrator';
import { logger } from '@/lib/logger';

const log = logger.child({ fn: 'process-annatel-webhook' });

function deriveAggregateType(eventType: string): string {
  if (eventType.includes('bulk_request') || eventType.includes('line')) return 'line';
  if (eventType.includes('port')) return 'portability';
  if (eventType.includes('sim')) return 'sim';
  if (eventType.includes('number')) return 'phone_number';
  return 'unknown';
}

export const processAnnatelWebhook = inngest.createFunction(
  {
    id: 'process-annatel-webhook',
    retries: 5,
    concurrency: {
      limit: 1,
      key: 'event.data.idempotencyKey',
    },
  },
  { event: 'webhook/annatel.received' },
  async ({ event, step }) => {
    const { idempotencyKey } = event.data as { idempotencyKey: string };

    const admin = createSupabaseAdminClient();
    if (!admin) throw new Error('Supabase admin client unavailable — check SUPABASE_SERVICE_ROLE_KEY');

    // Step 1: fetch the raw event record
    const webhookEvent = await step.run('fetch-raw-event', async () => {
      const { data, error } = await admin
        .from('webhook_events')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .single();
      if (error || !data) {
        throw new Error(`Webhook event not found for key: ${idempotencyKey}`);
      }
      return data;
    });

    // Step 2: skip invalid signatures
    if (!webhookEvent.signature_valid) {
      await admin
        .from('webhook_events')
        .update({ status: 'skipped', processed_at: new Date().toISOString() })
        .eq('id', webhookEvent.id);
      log.warn({ id: webhookEvent.id }, 'Webhook skipped — invalid signature');
      return { skipped: true, reason: 'invalid_signature' };
    }

    // Step 3: parse the raw bytes
    const parsed = await step.run('parse-event', async () => {
      const provider = getTelecomProvider();
      const raw = Buffer.from(webhookEvent.raw_payload as string, 'base64');
      return provider.parseWebhookEvent(raw);
    });

    // Step 4: mark as processing + write normalized event
    await step.run('store-telecom-event', async () => {
      await admin
        .from('webhook_events')
        .update({
          parsed_payload: parsed.payload as never,
          event_type: parsed.type,
          status: 'processing',
          attempt_count: ((webhookEvent.attempt_count as number) ?? 0) + 1,
        })
        .eq('id', webhookEvent.id);

      await admin.from('telecom_events').insert({
        event_type: parsed.type,
        aggregate_type: deriveAggregateType(parsed.type),
        payload: parsed.payload as never,
        source: 'webhook',
        source_event_id: webhookEvent.id as string,
      });
    });

    // Step 5: link to provisioning job for bulk_request events (primary real-time completion path)
    await step.run('link-provisioning-job', async () => {
      if (!parsed.type.includes('bulk_request')) {
        return { skipped: true, reason: 'not_bulk_request' };
      }
      const providerJobId = (parsed.payload as Record<string, unknown>).id as string | undefined;
      if (!providerJobId) return { skipped: true, reason: 'no_provider_job_id' };

      const { data: job } = await admin
        .from('provisioning_jobs')
        .select('id, status')
        .eq('provider_job_id', providerJobId)
        .maybeSingle();

      if (!job) return { skipped: true, reason: 'no_matching_job' };
      if (job.status !== 'syncing') return { skipped: true, reason: `not_syncing:${job.status}` };

      return reconcileJob(job.id as string);
    });

    // Step 7: mark processed
    await step.run('mark-processed', async () => {
      await admin
        .from('webhook_events')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('id', webhookEvent.id);
    });

    log.info({ id: webhookEvent.id, type: parsed.type }, 'Webhook processed');
    return { processed: true, type: parsed.type };
  },
);
