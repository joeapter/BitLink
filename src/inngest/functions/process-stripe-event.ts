// Durable Inngest function for processing Stripe webhook events.
//
// Flow:
//   1. fetch-event:         load the stripe_events record by stripe_event_id
//   2. mark-processing:     set status = 'processing'
//   3. handle-event:        route to event-type handler (idempotent)
//   4. dispatch-provision:  if a provisioning job was created, fire provisioning/line.create
//   5. mark-processed:      set status = 'processed' (or 'skipped')
//
// All handlers are idempotent — they check for existing records before creating.
// Concurrency key on stripeEventId prevents duplicate parallel executions.
// Inngest retries (5×) handle transient failures; each step.run is memoized on success.
//
// Tracing: every subscriber created here has a correlationId that propagates through
// telecom_lines → provisioning_jobs → provider_sync_logs for end-to-end visibility.

import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { inngest } from '@/inngest/client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { updateStripeEventStatus } from '@/lib/db/stripe-events';
import {
  createSubscriber,
  getSubscriberByStripeSubscription,
  updateSubscriber,
} from '@/lib/db/subscribers';
import { upsertSubscription, updateSubscriptionFromStripe } from '@/lib/db/subscriptions';
import { createProvisioningJob } from '@/lib/provisioning/orchestrator';
import { logger } from '@/lib/logger';

const log = logger.child({ fn: 'process-stripe-event' });

// ── Stripe status → subscriber status map ────────────────────────────────────

function stripeStatusToSubscriberStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
    case 'unpaid':
      return 'suspended';
    case 'canceled':
      return 'cancelled';
    default:
      return 'pending';
  }
}

// ── Event handlers ────────────────────────────────────────────────────────────

type HandlerResult =
  | { skipped: true; reason: string }
  | { subscriberId: string; jobId: string; lineId: string }
  | { updated: true; subscriberId: string }
  | { cancelled: true; subscriberId: string }
  | { suspended: true; subscriberId: string };

/**
 * checkout.session.completed — primary creation path for subscriptions via Checkout.
 * Creates subscriber, drafts telecom line, creates provisioning job.
 * Fully idempotent: safe to retry on any step failure.
 */
async function handleCheckoutCompleted(
  admin: SupabaseClient,
  session: Stripe.Checkout.Session,
  stripeEventRecordId: string,
): Promise<HandlerResult> {
  const stripeSubscriptionId =
    typeof session.subscription === 'string' ? session.subscription : null;
  const stripeCustomerId =
    typeof session.customer === 'string' ? session.customer : null;
  const customerRecordId = session.metadata?.customer_record_id ?? null;
  const planSlug = session.metadata?.plan_slug ?? 'israel-plus';

  if (!stripeSubscriptionId || !stripeCustomerId) {
    log.warn({ sessionId: session.id }, 'Checkout session missing subscription or customer');
    return { skipped: true, reason: 'no_subscription_or_customer' };
  }

  // Idempotency: check if subscriber already exists for this Stripe subscription
  const existing = await getSubscriberByStripeSubscription(admin, stripeSubscriptionId);
  if (existing) {
    log.info({ stripeSubscriptionId, subscriberId: existing.id }, 'Subscriber already exists — skipping');
    return { skipped: true, reason: 'subscriber_already_exists' };
  }

  const correlationId = crypto.randomUUID();

  // Link Stripe customer to our customer record
  if (customerRecordId && stripeCustomerId) {
    await admin
      .from('customers')
      .update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() })
      .eq('id', customerRecordId);

    await admin
      .from('stripe_customers')
      .upsert(
        {
          customer_id: customerRecordId,
          stripe_customer_id: stripeCustomerId,
          stripe_email: session.customer_details?.email ?? null,
          livemode: session.livemode ?? false,
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'stripe_customer_id', ignoreDuplicates: false },
      );
  }

  // Upsert subscription record with what we know (period dates arrive via subscription.created)
  await admin
    .from('subscriptions')
    .upsert(
      {
        customer_id: customerRecordId,
        stripe_subscription_id: stripeSubscriptionId,
        status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'stripe_subscription_id', ignoreDuplicates: false },
    );

  // Idempotent: reuse telecom line if already created (retry scenario)
  const externalId = `stripe_sub_${stripeSubscriptionId}`;
  let lineId: string;

  const { data: existingLine } = await admin
    .from('telecom_lines')
    .select('id')
    .eq('external_id', externalId)
    .maybeSingle();

  if (existingLine?.id) {
    lineId = existingLine.id;
    log.info({ externalId, lineId }, 'Telecom line already exists — reusing');
  } else {
    const { data: newLine, error: lineError } = await admin
      .from('telecom_lines')
      .insert({
        external_id: externalId,
        customer_id: customerRecordId,
        status: 'draft',
        metadata: {
          source: 'stripe_checkout',
          stripe_subscription_id: stripeSubscriptionId,
          stripe_customer_id: stripeCustomerId,
          correlation_id: correlationId,
          plan_slug: planSlug,
        } as never,
      })
      .select('id')
      .single();
    if (lineError || !newLine) throw new Error(`Failed to create telecom line: ${lineError?.message}`);
    lineId = newLine.id;
  }

  // Idempotent: reuse provisioning job if already created (retry scenario)
  const jobIdempotencyKey = `create_line:${stripeSubscriptionId}`;
  let jobId: string;

  const { data: existingJob } = await admin
    .from('provisioning_jobs')
    .select('id')
    .eq('idempotency_key', jobIdempotencyKey)
    .maybeSingle();

  if (existingJob?.id) {
    jobId = existingJob.id;
    log.info({ jobIdempotencyKey, jobId }, 'Provisioning job already exists — reusing');
  } else {
    const job = await createProvisioningJob({
      lineId,
      type: 'create_line',
      payload: {
        externalId,
        planName: planSlug,
        isKosher: false,
        metadata: {
          stripe_subscription_id: stripeSubscriptionId,
          stripe_customer_id: stripeCustomerId,
          correlation_id: correlationId,
          source: 'stripe_checkout',
        },
      },
      idempotencyKey: jobIdempotencyKey,
      maxAttempts: 3,
    });
    jobId = job.id;
  }

  // Create subscriber and link to line + job
  const subscriber = await createSubscriber(admin, {
    customerId: customerRecordId,
    stripeSubscriptionId,
    stripeCustomerId,
    planSlug,
    originatingStripeEventId: stripeEventRecordId,
    correlationId,
    status: 'provisioning',
  });

  await updateSubscriber(admin, subscriber.id, {
    telecomLineId: lineId,
    provisioningJobId: jobId,
  });

  log.info(
    { subscriberId: subscriber.id, lineId, jobId, correlationId, planSlug },
    'Subscriber created, telecom line drafted, provisioning job queued',
  );

  return { subscriberId: subscriber.id, jobId, lineId };
}

/**
 * customer.subscription.created / customer.subscription.updated
 * Updates subscription record with full period data from Stripe.
 * If subscriber already exists, updates its status to match Stripe's subscription status.
 * For 'created' with no existing subscriber (API-created subscription), logs for manual triage.
 */
async function handleSubscriptionChange(
  admin: SupabaseClient,
  subscription: Stripe.Subscription,
  eventType: string,
): Promise<HandlerResult> {
  // Find customer record by Stripe customer ID
  const stripeCustomerId =
    typeof subscription.customer === 'string' ? subscription.customer : null;
  let customerRecordId: string | null = null;
  if (stripeCustomerId) {
    const { data: sc } = await admin
      .from('stripe_customers')
      .select('customer_id')
      .eq('stripe_customer_id', stripeCustomerId)
      .maybeSingle();
    customerRecordId = (sc?.customer_id as string | null) ?? null;
  }

  // Upsert full subscription record with period dates
  await upsertSubscription(admin, customerRecordId, subscription);

  const subscriber = await getSubscriberByStripeSubscription(admin, subscription.id);
  if (!subscriber) {
    if (eventType === 'customer.subscription.created') {
      log.info(
        { stripeSubscriptionId: subscription.id },
        'subscription.created without prior checkout — no subscriber created; handle manually if needed',
      );
    }
    return { skipped: true, reason: 'no_subscriber' };
  }

  const newStatus = stripeStatusToSubscriberStatus(subscription.status);
  const updates: Parameters<typeof updateSubscriber>[2] = { status: newStatus };
  if (newStatus === 'active' && !subscriber.activatedAt) {
    updates.activatedAt = new Date().toISOString();
  }
  await updateSubscriber(admin, subscriber.id, updates);

  return { updated: true, subscriberId: subscriber.id };
}

/**
 * customer.subscription.deleted
 * Cancels the subscriber. A terminate_line provisioning job would be
 * created here when real Annatel integration is ready.
 */
async function handleSubscriptionDeleted(
  admin: SupabaseClient,
  subscription: Stripe.Subscription,
): Promise<HandlerResult> {
  await updateSubscriptionFromStripe(admin, subscription);

  const subscriber = await getSubscriberByStripeSubscription(admin, subscription.id);
  if (!subscriber) return { skipped: true, reason: 'no_subscriber' };

  await updateSubscriber(admin, subscriber.id, {
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
  });

  log.info({ subscriberId: subscriber.id, stripeSubscriptionId: subscription.id }, 'Subscriber cancelled');
  return { cancelled: true, subscriberId: subscriber.id };
}

/**
 * invoice.payment_failed
 * Suspends the subscriber so that support can triage.
 */
async function handlePaymentFailed(
  admin: SupabaseClient,
  invoice: Stripe.Invoice,
): Promise<HandlerResult> {
  // In API version 2026-04-22.dahlia, subscription info lives in invoice.parent
  const subRef = invoice.parent?.type === 'subscription_details'
    ? invoice.parent.subscription_details?.subscription
    : null;
  const stripeSubscriptionId = subRef
    ? typeof subRef === 'string' ? subRef : subRef.id
    : null;
  if (!stripeSubscriptionId) return { skipped: true, reason: 'no_subscription_on_invoice' };

  const subscriber = await getSubscriberByStripeSubscription(admin, stripeSubscriptionId);
  if (!subscriber) return { skipped: true, reason: 'no_subscriber' };

  await updateSubscriber(admin, subscriber.id, { status: 'suspended' });

  log.warn(
    { subscriberId: subscriber.id, stripeSubscriptionId },
    'Payment failed — subscriber suspended',
  );
  return { suspended: true, subscriberId: subscriber.id };
}

// ── Inngest function ──────────────────────────────────────────────────────────

export const processStripeEvent = inngest.createFunction(
  {
    id: 'process-stripe-event',
    retries: 5,
    concurrency: {
      limit: 1,
      key: 'event.data.stripeEventId',
    },
  },
  { event: 'stripe/event.received' },
  async ({ event, step }) => {
    const { stripeEventId } = event.data as { stripeEventId: string };

    const admin = createSupabaseAdminClient();
    if (!admin) throw new Error('Supabase admin client unavailable — check SUPABASE_SERVICE_ROLE_KEY');

    // Step 1: fetch the persisted event record
    const stripeEventRecord = await step.run('fetch-stripe-event', async () => {
      const { data, error } = await admin
        .from('stripe_events')
        .select('*')
        .eq('stripe_event_id', stripeEventId)
        .single();
      if (error || !data) throw new Error(`Stripe event not found: ${stripeEventId}`);
      return data;
    });

    const stripeEvent = stripeEventRecord.raw_payload as unknown as Stripe.Event;
    const recordId = stripeEventRecord.id as string;

    // Step 2: mark processing
    await step.run('mark-processing', async () => {
      await updateStripeEventStatus(admin, recordId, { status: 'processing' });
    });

    // Step 3: route to handler
    const handlerResult = await step.run('handle-event', async () => {
      switch (stripeEvent.type) {
        case 'checkout.session.completed':
          return handleCheckoutCompleted(
            admin,
            stripeEvent.data.object as Stripe.Checkout.Session,
            recordId,
          );

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          return handleSubscriptionChange(
            admin,
            stripeEvent.data.object as Stripe.Subscription,
            stripeEvent.type,
          );

        case 'customer.subscription.deleted':
          return handleSubscriptionDeleted(
            admin,
            stripeEvent.data.object as Stripe.Subscription,
          );

        case 'invoice.payment_failed':
          return handlePaymentFailed(
            admin,
            stripeEvent.data.object as Stripe.Invoice,
          );

        default:
          log.info({ stripeEventId, type: stripeEvent.type }, 'Unhandled Stripe event type');
          return { skipped: true as const, reason: `unhandled_type:${stripeEvent.type}` };
      }
    });

    // Step 4: dispatch provisioning job if checkout created one
    if (handlerResult && 'jobId' in handlerResult && handlerResult.jobId) {
      await step.run('dispatch-provisioning', async () => {
        await inngest.send({
          name: 'provisioning/line.create',
          data: { jobId: (handlerResult as { jobId: string }).jobId },
        });
        log.info(
          { jobId: (handlerResult as { jobId: string }).jobId },
          'Provisioning job dispatched to Inngest',
        );
      });
    }

    // Step 5: mark processed (or skipped for unhandled types)
    await step.run('mark-processed', async () => {
      const status = handlerResult && 'skipped' in handlerResult && handlerResult.skipped
        ? 'skipped'
        : 'processed';
      await updateStripeEventStatus(admin, recordId, { status });
    });

    log.info({ stripeEventId, type: stripeEvent.type }, 'Stripe event processed');
    return { processed: true, type: stripeEvent.type, result: handlerResult };
  },
);
