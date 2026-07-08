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
  getSubscribersByStripeSubscription,
  updateSubscriber,
} from '@/lib/db/subscribers';
import { upsertSubscription, updateSubscriptionFromStripe } from '@/lib/db/subscriptions';
import { createProvisioningJob } from '@/lib/provisioning/orchestrator';
import { getLine } from '@/lib/db/lines';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';
import { withProviderContext } from '@/lib/telecom/provider-context';
import { getAnnatelPlanName } from '@/lib/plans';
import { getStripeClient } from '@/lib/stripe/client';
import { normalizeCustomOrderLines } from '@/lib/stripe/custom-orders';
import { provisionSubscriptionLines } from '@/lib/custom-orders/provision-lines';
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
  | { subscriberIds: string[]; jobIds: string[]; lineIds: string[] }
  | { updated: true; subscriberId: string }
  | { updated: true; subscriberIds: string[] }
  | { cancelled: true; subscriberId: string }
  | { cancelled: true; subscriberIds: string[] }
  | { suspended: true; subscriberId: string };

type SubscriptionItemWithExpandedProduct = Stripe.SubscriptionItem & {
  price: Stripe.Price & {
    product: string | (Stripe.Product & { deleted?: false }) | { deleted: true; id: string };
  };
};

function subscriptionItemLineIndex(item: SubscriptionItemWithExpandedProduct): number | null {
  const itemIndex = item.metadata?.custom_order_line_index;
  if (itemIndex !== undefined) {
    const parsed = Number(itemIndex);
    return Number.isInteger(parsed) ? parsed : null;
  }

  const product = item.price.product;
  if (typeof product !== 'string' && !('deleted' in product)) {
    const productIndex = product.metadata?.custom_order_line_index;
    if (productIndex !== undefined) {
      const parsed = Number(productIndex);
      return Number.isInteger(parsed) ? parsed : null;
    }
  }

  return null;
}

async function handleCustomOrderCheckoutCompleted(
  admin: SupabaseClient,
  session: Stripe.Checkout.Session,
  stripeEventRecordId: string,
): Promise<HandlerResult> {
  const token = session.metadata?.custom_order_token ?? null;
  const stripeSubscriptionId =
    typeof session.subscription === 'string' ? session.subscription : null;
  const stripeCustomerId =
    typeof session.customer === 'string' ? session.customer : null;

  if (!token || !stripeSubscriptionId || !stripeCustomerId) {
    return { skipped: true, reason: 'custom_order_missing_metadata' };
  }

  const { data: order, error: orderError } = await admin
    .from('custom_line_orders')
    .select('id, token, customer_id, lines, status')
    .eq('token', token)
    .maybeSingle();

  if (orderError || !order) {
    log.warn({ token, sessionId: session.id }, 'Custom order not found for checkout');
    return { skipped: true, reason: 'custom_order_not_found' };
  }

  const customerRecordId = (order.customer_id ?? session.metadata?.customer_record_id ?? null) as string | null;
  const { data: customer } = customerRecordId
    ? await admin
        .from('customers')
        .select('id, user_id, full_name, email, phone')
        .eq('id', customerRecordId)
        .maybeSingle()
    : { data: null };

  if (customerRecordId) {
    await Promise.all([
      admin
        .from('customers')
        .update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() })
        .eq('id', customerRecordId),
      admin.from('stripe_customers').upsert(
        {
          customer_id: customerRecordId,
          stripe_customer_id: stripeCustomerId,
          stripe_email: (customer?.email ?? session.customer_details?.email ?? null) as string | null,
          livemode: session.livemode ?? false,
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'stripe_customer_id', ignoreDuplicates: false },
      ),
    ]);
  }

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
    expand: ['items.data.price.product'],
  });
  await upsertSubscription(admin, customerRecordId, subscription);

  const lines = normalizeCustomOrderLines(order.lines);
  const items = subscription.items.data as SubscriptionItemWithExpandedProduct[];
  const itemByIndex = new Map<number, SubscriptionItemWithExpandedProduct>();
  for (const item of items) {
    const index = subscriptionItemLineIndex(item);
    if (index !== null) itemByIndex.set(index, item);
  }

  const inputs = lines.map((line, index) => {
    const item = itemByIndex.get(index) ?? items[index];
    if (!item) {
      throw new Error(`Missing Stripe subscription item for custom order line ${index + 1}`);
    }
    return {
      line,
      index,
      subscriptionItem: item,
      stripeSubscriptionId,
      stripeCustomerId,
      customerRecordId,
      customerEmail: (customer?.email ?? session.customer_details?.email ?? null) as string | null,
      userId: (customer?.user_id ?? null) as string | null,
      originatingStripeEventId: stripeEventRecordId,
      customOrderToken: token,
      source: 'stripe_custom_order' as const,
    };
  });

  const result = await provisionSubscriptionLines(admin, inputs);

  await admin
    .from('custom_line_orders')
    .update({
      status: 'provisioning',
      stripe_checkout_session_id: session.id,
      stripe_subscription_id: stripeSubscriptionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id);

  const { data: existingOrder } = await admin
    .from('orders')
    .select('id')
    .eq('stripe_checkout_session_id', session.id)
    .maybeSingle();

  if (!existingOrder) {
    await admin.from('orders').insert({
      customer_id: customerRecordId,
      stripe_checkout_session_id: session.id,
      payment_status: 'paid',
      order_status: 'processing',
      provisioning_status: 'payment_confirmed',
    });
  }

  if (customerRecordId && lines[0]) {
    await inngest.send({
      name: 'checkout/completed',
      data: { customerRecordId, planSlug: lines[0].planSlug, isEsim: lines[0].isEsim },
    }).catch((err) => log.warn({ error: String(err) }, 'Failed to dispatch checkout/completed'));
  }

  log.info(
    { token, stripeSubscriptionId, jobs: result.jobIds.length, lines: result.lineIds.length },
    'Custom multi-line order paid and queued for provisioning',
  );

  return result;
}

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
  const isKosher = session.metadata?.is_kosher === '1';
  const isEsim = session.metadata?.is_esim === '1';
  const userId = session.metadata?.user_id || null;

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

  // Idempotent: create order record if not already present for this session
  const { data: existingOrder } = await admin
    .from('orders')
    .select('id')
    .eq('stripe_checkout_session_id', session.id)
    .maybeSingle();

  if (!existingOrder) {
    await admin.from('orders').insert({
      customer_id: customerRecordId,
      stripe_checkout_session_id: session.id,
      payment_status: 'paid',
      order_status: 'processing',
      provisioning_status: 'payment_confirmed',
    });
  }

  // Idempotent: reuse telecom line if already created (retry scenario)
  const externalId = `stripe_sub_${stripeSubscriptionId}`;
  let lineId: string;

  const wantsIntlNumber = session.metadata?.wants_intl_number === '1';
  const intlPortNumber = session.metadata?.intl_port_number || null;
  const intlNumberCountry = session.metadata?.intl_number_country || 'us';
  const intlNumberSource = session.metadata?.intl_number_source || 'port';

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
        is_kosher: isKosher,
        metadata: {
          source: 'stripe_checkout',
          stripe_subscription_id: stripeSubscriptionId,
          stripe_customer_id: stripeCustomerId,
          correlation_id: correlationId,
          plan_slug: planSlug,
          is_esim: isEsim,
          user_id: userId,
          // Stamp intl port-in intent immediately so it's visible in admin
          ...(wantsIntlNumber && intlPortNumber ? {
            intl_port_in: {
              number: intlPortNumber,
              country: intlNumberCountry,
              source: intlNumberSource,
              status: 'pending',
              annatel_bur_id: null,
              error: null,
              attempted_at: null,
              created_at: new Date().toISOString(),
            },
          } : {}),
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
    const customerEmail = session.customer_details?.email ?? session.metadata?.customer_email ?? null;
    const identityNumber =
      session.metadata?.identity_number ??
      process.env.ANNATEL_DEFAULT_IDENTITY_NUMBER?.trim() ??
      '341280188';

    const job = await createProvisioningJob({
      lineId,
      type: 'create_line',
      payload: {
        externalId,
        planName: getAnnatelPlanName(planSlug),
        isKosher,
        ...(customerEmail ? { email: customerEmail } : {}),
        ...(identityNumber ? { identityNumber } : {}),
        language: 'he_IL',
        ...(session.metadata?.is_port_in === '1' && session.metadata?.port_in_number ? {
          portInParams: {
            number: session.metadata.port_in_number,
            identityNumber: session.metadata.port_in_id_number ?? '',
            authenticationType: 'sms_code',
          },
        } : {}),
        metadata: {
          stripe_subscription_id: stripeSubscriptionId,
          stripe_customer_id: stripeCustomerId,
          correlation_id: correlationId,
          source: 'stripe_checkout',
          is_esim: isEsim,
          user_id: userId,
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
    { subscriberId: subscriber.id, lineId, jobId, correlationId, planSlug, isKosher, isEsim, userId },
    'Subscriber created, telecom line drafted, provisioning job queued',
  );

  // NEW intl number (no port): record the request on the line so it can't be
  // silently billed without fulfillment. No automated provisioning path exists
  // yet — admin fulfills manually until Annatel exposes one.
  if (wantsIntlNumber && !intlPortNumber) {
    try {
      const { data: currentLine } = await admin.from('telecom_lines').select('metadata').eq('id', lineId).single();
      const currentMeta = (currentLine?.metadata ?? {}) as Record<string, unknown>;
      await admin.from('telecom_lines').update({
        metadata: {
          ...currentMeta,
          intl_number: {
            country: intlNumberCountry,
            source: 'new',
            status: 'awaiting_fulfillment',
            requested_at: new Date().toISOString(),
          },
        } as never,
        updated_at: new Date().toISOString(),
      }).eq('id', lineId);
      log.info({ lineId, intlNumberCountry }, 'New intl number request recorded — awaiting manual fulfillment');
    } catch (err) {
      log.error({ lineId, error: err instanceof Error ? err.message : String(err) }, 'Failed to record intl number request');
    }
  }

  // Attempt intl port-in via Annatel if requested — record intent + result immediately
  if (wantsIntlNumber && intlPortNumber) {
    const attemptedAt = new Date().toISOString();
    try {
      const provider = getTelecomProvider();
      // We need the provider line ID — it won't exist yet at this point since the job is async.
      // Store the intent now; the actual submission must happen after the Israeli line is active.
      // Update: record as 'awaiting_line' so admin knows we're waiting for the Israeli SIM first.
      const { data: currentLine } = await admin.from('telecom_lines').select('metadata').eq('id', lineId).single();
      const currentMeta = (currentLine?.metadata ?? {}) as Record<string, unknown>;
      const existingPortIn = (currentMeta.intl_port_in ?? {}) as Record<string, unknown>;
      await admin.from('telecom_lines').update({
        metadata: {
          ...currentMeta,
          intl_port_in: {
            ...existingPortIn,
            number: intlPortNumber,
            country: intlNumberCountry,
            source: intlNumberSource,
            status: 'awaiting_israeli_line',
            annatel_bur_id: null,
            error: null,
            attempted_at: attemptedAt,
            created_at: existingPortIn.created_at ?? attemptedAt,
          },
        } as never,
      }).eq('id', lineId);
      void provider; // provider will be used when Israeli line is active
      log.info({ lineId, intlPortNumber, intlNumberCountry }, 'Intl port-in intent recorded — awaiting Israeli line activation');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      log.error({ lineId, intlPortNumber, error: errMsg }, 'Failed to record intl port-in intent');
    }
  }

  // Fire post-checkout notification (account creation + welcome email)
  if (customerRecordId) {
    await inngest.send({
      name: 'checkout/completed',
      data: { customerRecordId, planSlug, isEsim },
    }).catch((err) => log.warn({ error: String(err) }, 'Failed to dispatch checkout/completed'));
  }

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

  const subscribers = await getSubscribersByStripeSubscription(admin, subscription.id);
  if (!subscribers.length) {
    if (eventType === 'customer.subscription.created') {
      log.info(
        { stripeSubscriptionId: subscription.id },
        'subscription.created without prior checkout — no subscriber created; handle manually if needed',
      );
    }
    return { skipped: true, reason: 'no_subscriber' };
  }

  const newStatus = stripeStatusToSubscriberStatus(subscription.status);
  const activatedAt = new Date().toISOString();
  for (const subscriber of subscribers) {
    const updates: Parameters<typeof updateSubscriber>[2] = { status: newStatus };
    if (newStatus === 'active' && !subscriber.activatedAt) {
      updates.activatedAt = activatedAt;
    }
    await updateSubscriber(admin, subscriber.id, updates);
  }

  return { updated: true, subscriberIds: subscribers.map((subscriber) => subscriber.id) };
}

/**
 * customer.subscription.deleted
 * Cancels the subscriber and terminates the Annatel line so the DID
 * is released back to the tenant's number bank.
 */
async function handleSubscriptionDeleted(
  admin: SupabaseClient,
  subscription: Stripe.Subscription,
): Promise<HandlerResult> {
  await updateSubscriptionFromStripe(admin, subscription);

  const subscribers = await getSubscribersByStripeSubscription(admin, subscription.id);
  if (!subscribers.length) return { skipped: true, reason: 'no_subscriber' };

  // Terminate the Annatel line so the DID returns to the number bank.
  // Only attempt if the line was actually provisioned (has a telecomLineId).
  for (const subscriber of subscribers) {
    if (!subscriber.telecomLineId) continue;
    const line = await getLine(admin, subscriber.telecomLineId);
    if (line?.provider_line_id && line.status !== 'terminated') {
      try {
        const provider = getTelecomProvider();
        const ctx = {
          correlationId: subscriber.correlationId ?? crypto.randomUUID(),
          telecomLineId: subscriber.telecomLineId,
        };
        await withProviderContext(ctx, () =>
          provider.terminateLine(line.provider_line_id!),
        );
        await admin
          .from('telecom_lines')
          .update({ status: 'terminated', updated_at: new Date().toISOString() })
          .eq('id', subscriber.telecomLineId);
        log.info(
          { subscriberId: subscriber.id, telecomLineId: subscriber.telecomLineId, providerLineId: line.provider_line_id },
          'Line terminated — DID released to number bank',
        );
      } catch (err) {
        // Log but don't block the cancellation — line can be manually terminated
        log.error(
          { subscriberId: subscriber.id, telecomLineId: subscriber.telecomLineId, error: err instanceof Error ? err.message : String(err) },
          'Failed to terminate line on subscription deletion — manual cleanup may be needed',
        );
      }
    }

    await updateSubscriber(admin, subscriber.id, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    });
  }

  log.info({ subscriberIds: subscribers.map((subscriber) => subscriber.id), stripeSubscriptionId: subscription.id }, 'Subscribers cancelled');
  return { cancelled: true, subscriberIds: subscribers.map((subscriber) => subscriber.id) };
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

  const subscribers = await getSubscribersByStripeSubscription(admin, stripeSubscriptionId);
  if (!subscribers.length) return { skipped: true, reason: 'no_subscriber' };

  for (const subscriber of subscribers) {
    await updateSubscriber(admin, subscriber.id, { status: 'suspended' });
  }

  log.warn(
    { subscriberIds: subscribers.map((subscriber) => subscriber.id), stripeSubscriptionId },
    'Payment failed — subscribers suspended',
  );
  return { suspended: true, subscriberId: subscribers[0].id };
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
          if ((stripeEvent.data.object as Stripe.Checkout.Session).metadata?.custom_order_token) {
            return handleCustomOrderCheckoutCompleted(
              admin,
              stripeEvent.data.object as Stripe.Checkout.Session,
              recordId,
            );
          }
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
    if (handlerResult && 'jobIds' in handlerResult && handlerResult.jobIds.length) {
      await step.run('dispatch-provisioning-jobs', async () => {
        await inngest.send(
          handlerResult.jobIds.map((jobId) => ({
            name: 'provisioning/line.create' as const,
            data: { jobId },
          })),
        );
        log.info(
          { jobIds: handlerResult.jobIds },
          'Provisioning jobs dispatched to Inngest',
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
