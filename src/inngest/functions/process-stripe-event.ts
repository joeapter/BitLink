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
import { listIntlPortInRequests, createIntlPortInRequest } from '@/lib/custom-orders/intl-port-in-requests';
import { startTrial, convertTrialToPlan } from '@/lib/trial-offer';
import { clearDunningState } from '@/lib/billing/dunning';
import { sendEmail } from '@/lib/email/send';
import { logger } from '@/lib/logger';

const log = logger.child({ fn: 'process-stripe-event' });

// ── Self-port detection (trial → paid conversion) ────────────────────────────

// Numbers reach us in assorted shapes (+972555195352, 0555195352,
// 972555195352). The last 9 digits identify an Israeli mobile unambiguously.
function isSameIsraeliNumber(a?: string | null, b?: string | null): boolean {
  const tail = (value?: string | null) => (value ?? '').replace(/\D/g, '').slice(-9);
  const left = tail(a);
  return left.length === 9 && left === tail(b);
}

// Is the customer asking to "port" a number that is already on one of their own
// BitLink lines? That is a conversion, not a port — see the guard at the call
// site for why the carrier can never satisfy it.
async function findOwnLineForPortRequest(
  admin: SupabaseClient,
  params: { customerRecordId: string | null; isPortIn: boolean; portInNumber: string | null },
): Promise<{ id: string; metadata: Record<string, unknown> } | null> {
  if (!params.isPortIn || !params.portInNumber || !params.customerRecordId) return null;

  const { data: lines } = await admin
    .from('telecom_lines')
    .select('id, metadata')
    .eq('customer_id', params.customerRecordId)
    .in('status', ['active', 'paused']);

  for (const line of lines ?? []) {
    const metadata = (line.metadata ?? {}) as Record<string, unknown>;
    if (isSameIsraeliNumber(metadata.phone_number as string | undefined, params.portInNumber)) {
      return { id: line.id as string, metadata };
    }
  }
  return null;
}

// Bind the freshly-paid subscription to a line the customer already has, close
// any trial on it, and skip provisioning entirely — the line is already live,
// so there is nothing for the carrier to create.
async function attachSubscriptionToExistingLine(
  admin: SupabaseClient,
  params: {
    line: { id: string; metadata: Record<string, unknown> };
    customerRecordId: string | null;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    stripeEventRecordId: string | null;
    correlationId: string;
    planSlug: string;
    externalId: string;
  },
) {
  const now = new Date().toISOString();

  const subscriber = await createSubscriber(admin, {
    customerId: params.customerRecordId,
    stripeSubscriptionId: params.stripeSubscriptionId,
    stripeCustomerId: params.stripeCustomerId,
    planSlug: params.planSlug,
    originatingStripeEventId: params.stripeEventRecordId,
    correlationId: params.correlationId,
    status: 'active',
  });
  await updateSubscriber(admin, subscriber.id, {
    telecomLineId: params.line.id,
    activatedAt: now,
  });

  await admin
    .from('telecom_lines')
    .update({
      external_id: params.externalId,
      metadata: { ...params.line.metadata, is_trial: false, plan_slug: params.planSlug },
      updated_at: now,
    })
    .eq('id', params.line.id);

  // Close any live trial so the day-30 sweep can't freeze a paying line.
  await admin
    .from('trial_lines')
    .update({ status: 'converted', decided_at: now, updated_at: now })
    .eq('telecom_line_id', params.line.id)
    .eq('status', 'active');

  // Orders are stamped 'payment_confirmed' at checkout and normally advanced to
  // 'active' by the provisioning orchestrator once the line goes live. This
  // path never provisions anything — the line was already up — so it has to
  // advance the order itself, or the order sits in the admin provisioning queue
  // forever. Same customer_id correlation the orchestrator uses.
  if (params.customerRecordId) {
    await admin
      .from('orders')
      .update({ provisioning_status: 'active', updated_at: now })
      .eq('customer_id', params.customerRecordId)
      .eq('provisioning_status', 'payment_confirmed');
  }

  log.info(
    { lineId: params.line.id, subscriberId: subscriber.id, planSlug: params.planSlug },
    'Self-port detected — attached subscription to existing line instead of provisioning a new one',
  );

  await sendEmail({
    to: 'joe@bitlink.co.il',
    subject: `Trial converted to ${params.planSlug} — existing line kept`,
    html: [
      `<p>A customer paid for <b>${params.planSlug}</b> and asked to keep a number already on their own BitLink line.</p>`,
      `<p>Rather than provisioning a second line (which the carrier rejects), the subscription was attached to the existing line and any trial was closed. No action needed — this is the intended path.</p>`,
      `<p><a href="https://www.bitlink.co.il/admin/lines/${params.line.id}">Open the line in admin</a></p>`,
    ].join(''),
  }).catch(() => {
    // alerting is best-effort; never let it fail the conversion
  });

  return { subscriberId: subscriber.id, jobId: null, lineId: params.line.id };
}

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
  // jobId is null when checkout attached the subscription to a line the
  // customer already had (self-port), so there is nothing to provision.
  | { subscriberId: string; jobId: string | null; lineId: string }
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
  const topupItemsByIndex = new Map<number, { topupId: string; subscriptionItem: Stripe.SubscriptionItem }[]>();
  for (const item of items) {
    const isTopup = item.metadata?.is_topup === '1' || (
      typeof item.price.product !== 'string' && !('deleted' in item.price.product) && item.price.product.metadata?.is_topup === '1'
    );
    const index = subscriptionItemLineIndex(item);
    if (index === null) continue;
    if (isTopup) {
      const topupId = item.metadata?.topup_id
        ?? (typeof item.price.product !== 'string' && !('deleted' in item.price.product) ? item.price.product.metadata?.topup_id : undefined);
      if (!topupId) continue;
      const existing = topupItemsByIndex.get(index) ?? [];
      existing.push({ topupId, subscriptionItem: item });
      topupItemsByIndex.set(index, existing);
    } else {
      itemByIndex.set(index, item);
    }
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
      topupItems: topupItemsByIndex.get(index),
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
 * Attaches a setup session's resulting payment method to the customer, sets
 * it as default, and — this is the part that was missing before 2026-09 —
 * actually confirms it worked rather than trusting that it did. Shared by
 * the normal trial signup and the manual card-recovery flow below; both
 * need the identical guarantee before doing anything that commits real
 * carrier resources or money to a customer.
 *
 * Returns true only if Stripe, re-read fresh, shows the payment method
 * attached to this exact customer.
 */
async function attachAndVerifyPaymentMethod(
  stripe: ReturnType<typeof getStripeClient>,
  stripeCustomerId: string,
  setupIntentId: string | undefined,
): Promise<boolean> {
  if (!setupIntentId) return false;
  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
  const paymentMethodId =
    typeof setupIntent.payment_method === 'string' ? setupIntent.payment_method : setupIntent.payment_method?.id;
  if (!paymentMethodId) return false;

  // Confirmed in production (2026-09), one trial in ~13: a setup-mode
  // Checkout Session completed with a real card on the SetupIntent, but the
  // PaymentMethod was never attached to the Customer — Stripe is documented
  // to do this automatically for a session created with `customer` set, and
  // it does reliably, but "reliably" isn't "always." attach() is idempotent
  // (a no-op if Stripe already attached it), so this changes nothing for
  // the normal case — it only matters the next time Stripe's own auto-attach
  // doesn't fire.
  await stripe.paymentMethods.attach(paymentMethodId, { customer: stripeCustomerId }).catch((err) => {
    log.warn(
      { stripeCustomerId, paymentMethodId, error: err instanceof Error ? err.message : String(err) },
      'Explicit payment method attach failed — Stripe had likely already attached it (attach is idempotent); only worth investigating if verification below also fails',
    );
  });
  await stripe.customers.update(stripeCustomerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  // Don't just hope the two calls above worked — re-read the payment method
  // from Stripe and check it actually shows this customer. customers.update()
  // doesn't error on an unattached PM; it silently accepts the ID without
  // making the card chargeable, which is exactly how a trial ran its full 30
  // days looking normal and only failed at the moment it tried to charge.
  const verifiedPm = await stripe.paymentMethods.retrieve(paymentMethodId);
  return verifiedPm.customer === stripeCustomerId;
}

/**
 * checkout.session.completed for a trial-offer setup session (mode: 'setup',
 * metadata.source = 'bitlink_trial'). No subscription/payment happened — this
 * just saved a card. Sets it as the customer's default payment method, then
 * starts the trial (drafts the line, queues provisioning) — but only once
 * attachAndVerifyPaymentMethod actually confirms there's something chargeable
 * on file. That confirmation used to not exist at all: startTrial() ran
 * unconditionally, which is how a trial was provisioned once for a customer
 * with no usable card — a real Annatel line, real cost, discovered only 30
 * days later when there was nothing to charge.
 */
async function handleTrialSetupCompleted(
  admin: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<HandlerResult> {
  const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null;
  const customerRecordId = session.metadata?.customer_record_id ?? null;

  if (!stripeCustomerId || !customerRecordId) {
    log.warn({ sessionId: session.id }, 'Trial setup session missing customer or customer_record_id');
    return { skipped: true, reason: 'no_customer' };
  }

  const { data: existingTrial } = await admin
    .from('trial_lines')
    .select('id, telecom_line_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();
  if (existingTrial) {
    log.info({ stripeCustomerId, trialId: existingTrial.id }, 'Trial already started for this customer — skipping');
    return { skipped: true, reason: 'trial_already_started' };
  }

  const stripe = getStripeClient();
  const setupIntentId = typeof session.setup_intent === 'string' ? session.setup_intent : session.setup_intent?.id;
  const paymentMethodConfirmed = await attachAndVerifyPaymentMethod(stripe, stripeCustomerId, setupIntentId);

  const { data: customer } = await admin
    .from('customers')
    .select('full_name, email, phone')
    .eq('id', customerRecordId)
    .maybeSingle();

  if (!paymentMethodConfirmed) {
    log.error(
      { stripeCustomerId, customerRecordId, sessionId: session.id },
      'Trial setup completed but no confirmed payment method — refusing to provision a line',
    );
    await sendEmail({
      to: 'joe@bitlink.co.il',
      subject: 'Trial signup blocked — no usable card',
      html: [
        `<p><b>${(customer?.full_name as string | undefined) ?? 'A customer'}</b> (${(customer?.email as string | undefined) ?? 'no email'}) completed the trial signup form, but Stripe does not show a usable payment method on their account after the setup step — so no line was provisioned.</p>`,
        `<p>This is the same failure mode fixed on ${new Date().toDateString()}: the card capture can succeed while the attach to the customer silently doesn't. It's now caught before any service is given away, rather than only surfacing 30 days later at the billing deadline.</p>`,
        `<p>Stripe customer: <code>${stripeCustomerId}</code></p>`,
        `<p>Nothing further happens automatically — reach out to the customer to try again, or investigate in Stripe directly.</p>`,
      ].join(''),
    }).catch(() => {
      // alerting is best-effort; never let it mask the real skip reason
    });
    return { skipped: true, reason: 'no_confirmed_payment_method' };
  }

  const { trialId, lineId, jobId } = await startTrial(admin, {
    customerRecordId,
    customerEmail: (customer?.email as string | undefined) ?? '',
    stripeCustomerId,
  });

  await inngest.send({
    name: 'trial/signup.completed',
    data: {
      customerRecordId,
      fullName: (customer?.full_name as string | undefined) ?? 'Unknown',
      email: (customer?.email as string | undefined) ?? '',
      phone: (customer?.phone as string | undefined) ?? '',
      lineId,
    },
  }).catch((err) => log.warn({ error: String(err) }, 'Failed to dispatch trial/signup.completed'));

  return { subscriberId: trialId, jobId, lineId };
}

/**
 * checkout.session.completed for a manually-generated card-recovery session
 * (mode: 'setup', metadata.source = 'bitlink_trial_recovery') — the flow a
 * customer lands on when their trial froze because the original card never
 * confirmed as attached (see attachAndVerifyPaymentMethod). This is the
 * automation that used to not exist: previously, recovering one of these
 * meant an admin manually attaching a card, charging the customer, and
 * reactivating the carrier line by hand once the customer said they'd added
 * one. Here, the moment they actually submit a working card, it all happens
 * on its own and Joe gets an email either way — fixed or still blocked.
 *
 * Not the general trial-signup path on purpose: startTrial() must never run
 * again for a customer who already has a trial_lines row, and this handler
 * only exists to finish converting one that already started.
 */
async function handleTrialRecoveryCompleted(
  admin: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<HandlerResult> {
  const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null;
  const customerRecordId = session.metadata?.customer_record_id ?? null;
  if (!stripeCustomerId || !customerRecordId) {
    log.warn({ sessionId: session.id }, 'Trial recovery session missing customer or customer_record_id');
    return { skipped: true, reason: 'no_customer' };
  }

  const { data: trial } = await admin
    .from('trial_lines')
    .select('id, telecom_line_id, customer_id, stripe_customer_id, status')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();
  if (!trial) {
    log.warn({ stripeCustomerId, sessionId: session.id }, 'Trial recovery session but no trial_lines row found');
    return { skipped: true, reason: 'no_trial_to_recover' };
  }

  const { data: customer } = await admin
    .from('customers')
    .select('full_name, email')
    .eq('id', customerRecordId)
    .maybeSingle();
  const customerLabel = `${(customer?.full_name as string | undefined) ?? 'A customer'} (${(customer?.email as string | undefined) ?? 'no email'})`;

  const stripe = getStripeClient();
  const setupIntentId = typeof session.setup_intent === 'string' ? session.setup_intent : session.setup_intent?.id;
  const paymentMethodConfirmed = await attachAndVerifyPaymentMethod(stripe, stripeCustomerId, setupIntentId);

  if (!paymentMethodConfirmed) {
    log.error({ stripeCustomerId, trialId: trial.id }, 'Trial recovery: card still not confirmed after retry');
    await sendEmail({
      to: 'joe@bitlink.co.il',
      subject: 'Recovery link submitted, but still no usable card',
      html: [
        `<p><b>${customerLabel}</b> used the recovery link, but Stripe still doesn't show a usable payment method afterward.</p>`,
        `<p>Their line is still on hold. This needs a look in Stripe directly rather than another automated attempt.</p>`,
        `<p>Stripe customer: <code>${stripeCustomerId}</code></p>`,
      ].join(''),
    }).catch(() => {});
    return { skipped: true, reason: 'no_confirmed_payment_method' };
  }

  const conversion = await convertTrialToPlan(
    admin,
    {
      id: trial.id as string,
      telecom_line_id: trial.telecom_line_id as string,
      customer_id: trial.customer_id as string,
      stripe_customer_id: stripeCustomerId,
    },
    'basic',
  );

  if (!conversion.success) {
    log.error({ stripeCustomerId, trialId: trial.id, error: conversion.error }, 'Trial recovery: card confirmed but the charge failed');
    await sendEmail({
      to: 'joe@bitlink.co.il',
      subject: 'Recovery card confirmed, but the charge failed',
      html: [
        `<p><b>${customerLabel}</b>'s card is now properly attached, but the actual charge failed: ${conversion.error}</p>`,
        `<p>Their line is still on hold — nothing was reactivated. Worth a look before trying again.</p>`,
      ].join(''),
    }).catch(() => {});
    return { skipped: true, reason: 'charge_failed' };
  }

  // convertTrialToPlan only handles Stripe + our own tables — it never
  // touches the carrier, since the normal (non-recovery) path it's built for
  // converts a line that's still ACTIVE at Annatel. This one was frozen by
  // freezeTrialLine when the original attempt failed, so reactivating it here
  // is this handler's job specifically, not something to add to the shared
  // function for every other caller that doesn't need it.
  const line = await getLine(admin, trial.telecom_line_id as string);
  let reactivated = false;
  if (line?.provider_line_id) {
    try {
      await getTelecomProvider().reactivateLine(line.provider_line_id);
      await admin
        .from('telecom_lines')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', trial.telecom_line_id as string);
      reactivated = true;
    } catch (err) {
      log.error(
        { stripeCustomerId, trialId: trial.id, error: err instanceof Error ? err.message : String(err) },
        'Trial recovery: charge succeeded but carrier reactivation failed',
      );
    }
  }

  await sendEmail({
    to: 'joe@bitlink.co.il',
    subject: reactivated ? 'Recovery complete — line back on' : 'Charged, but reactivation needs a manual check',
    html: [
      `<p><b>${customerLabel}</b> added a card via the recovery link. They've been charged for Basic ($14.99, no activation fee) and their trial is now marked converted.</p>`,
      reactivated
        ? `<p>Their line has been reactivated at the carrier — should be working again within a minute or two.</p>`
        : `<p><b>The line itself did not reactivate automatically</b> — worth checking it directly before assuming it's back on.</p>`,
      `<p><a href="https://www.bitlink.co.il/admin/lines/${trial.telecom_line_id}">Open the line in admin</a></p>`,
    ].join(''),
  }).catch(() => {});

  return { updated: true, subscriberId: trial.id as string };
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
  // When true, the foreign-number port fee + monthly add-on were NOT charged at
  // checkout — they're invoiced manually when the port actually runs.
  const intlPortDeferred = session.metadata?.intl_port_deferred === '1';
  const intlChosenNumber = session.metadata?.intl_chosen_number || null;

  // ── Guard: "porting" a number BitLink already holds ───────────────────────
  //
  // A trial customer who buys a plan often enters their own BitLink number as
  // the one to "keep". That is never a port: the carrier rejects it with
  // 422 dids.number "already exists in network_manager", because the number is
  // already on our own tenant. The real intent is to convert the existing line
  // onto the paid plan, not to provision a second one.
  //
  // Real incident 2026-08-16 (Joshua Naccache): the paid line failed overnight
  // while his trial line kept working, leaving him billed with no live line
  // and a trial clock still counting down on the line he was actually using.
  // Only the paying customer's OWN lines are matched here. If the number turns
  // out to belong to a different BitLink customer, we deliberately fall through
  // and let the carrier reject it — silently attaching someone else's line to
  // this subscription would be far worse than a failed job.
  const ownLineForPort = await findOwnLineForPortRequest(admin, {
    customerRecordId,
    isPortIn: session.metadata?.is_port_in === '1',
    portInNumber: session.metadata?.port_in_number ?? null,
  });

  if (ownLineForPort) {
    return attachSubscriptionToExistingLine(admin, {
      line: ownLineForPort,
      customerRecordId,
      stripeSubscriptionId,
      stripeCustomerId,
      stripeEventRecordId,
      correlationId,
      planSlug,
      externalId,
    });
  }

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
              deferred_billing: intlPortDeferred,
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

  // Physical SIM — record the shipping request once, idempotent per line
  // (retries reuse the same line via externalId above, so guard on that).
  const deliveryMethod = session.metadata?.delivery_method || null;
  if (!isEsim && deliveryMethod) {
    const { data: existingDelivery } = await admin
      .from('physical_sim_deliveries')
      .select('id')
      .eq('telecom_line_id', lineId)
      .maybeSingle();
    if (!existingDelivery) {
      await admin.from('physical_sim_deliveries').insert({
        telecom_line_id: lineId,
        method: deliveryMethod,
        city: session.metadata?.delivery_city || '',
        address_line1: session.metadata?.delivery_address_line1 || '',
        address_line2: session.metadata?.delivery_address_line2 || null,
        requested_date: session.metadata?.delivery_requested_date || null,
      });
      log.info({ lineId, deliveryMethod }, 'Physical SIM delivery recorded');
    }
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
            // Kosher phones can't receive SMS — must match whatever type the
            // customer actually verified with at checkout (see PortNumberVerification).
            authenticationType: isKosher ? 'ivr' : 'sms_code',
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
            number: intlChosenNumber,
            status: intlChosenNumber ? 'reserved' : 'awaiting_fulfillment',
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
            deferred_billing: intlPortDeferred,
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

    // Mirror the checkout port into the admin-tracked intl_port_in_requests
    // table so it appears on the line's port-in card with the "attach & bill"
    // button. Deferred ports bill on completion (paid/paid); "port now" ports
    // were already charged at checkout, so their completion must NOT
    // double-charge (free/free). Idempotent per line+number.
    try {
      const country = (['us', 'canada', 'uk'].includes(intlNumberCountry) ? intlNumberCountry : 'us') as 'us' | 'canada' | 'uk';
      const existingRequests = await listIntlPortInRequests(admin, lineId);
      const already = existingRequests.some((r) => r.number === intlPortNumber && r.status !== 'cancelled');
      if (!already) {
        const billingMode: 'paid' | 'free' = intlPortDeferred ? 'paid' : 'free';
        await createIntlPortInRequest({
          admin,
          lineId,
          country,
          number: intlPortNumber,
          oneTimeFeeBillingMode: billingMode,
          monthlyBillingMode: billingMode,
        });

        // Heads-up email so a deferred port (unpaid until it lands) isn't
        // forgotten. "Port now" ports are already paid — no reminder needed.
        if (intlPortDeferred) {
          const who = session.customer_details?.name || session.customer_details?.email || 'A customer';
          await sendEmail({
            to: 'joe@bitlink.co.il',
            subject: `📌 Deferred port queued — ${intlPortNumber} (${country.toUpperCase()})`,
            html: [
              `<p><b>${who}</b> checked out and chose to port their ${country.toUpperCase()} number <b>${intlPortNumber}</b> later — nothing was charged for it yet.</p>`,
              `<p>When they tell you they're ready and the number lands, open the line and hit <b>“It landed — attach &amp; bill”</b> to attach it and charge the $49.99 fee + $9.99/mo.</p>`,
              `<p><a href="https://www.bitlink.co.il/admin/lines/${lineId}">Open the line in admin</a></p>`,
            ].join(''),
          }).catch(() => {});
        }
        log.info({ lineId, intlPortNumber, intlPortDeferred }, 'Checkout port mirrored into intl_port_in_requests');
      }
    } catch (err) {
      log.error(
        { lineId, intlPortNumber, error: err instanceof Error ? err.message : String(err) },
        'Failed to mirror checkout port into requests table',
      );
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

    // Recovery. Stripe keeps retrying well past our day-10 hold, so the
    // ordinary case is that we pause a line and Stripe then collects a day or
    // two later — this is what turns the line back on. Without it, paying
    // customers stay dark indefinitely.
    //
    // This event carries the recovery rather than invoice.payment_succeeded
    // because past_due -> active fires subscription.updated, which the
    // endpoint is already subscribed to. Nothing to change in Stripe.
    if (newStatus === 'active') {
      await clearDunningState(admin, subscriber.id);
    }
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

    // Stamp the clock the dunning ladder runs on — but only on the FIRST
    // decline. Stripe retries the same invoice for weeks and fires this event
    // each time; overwriting here would reset the ladder on every retry and
    // the customer would never reach the day-7 rung. Written straight to the
    // table rather than through updateSubscriber, which has no notion of
    // these columns.
    await admin
      .from('subscribers')
      .update({ payment_failed_at: new Date().toISOString() })
      .eq('id', subscriber.id)
      .is('payment_failed_at', null);
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
        case 'checkout.session.completed': {
          const session = stripeEvent.data.object as Stripe.Checkout.Session;
          if (session.mode === 'setup' && session.metadata?.source === 'bitlink_trial') {
            return handleTrialSetupCompleted(admin, session);
          }
          if (session.mode === 'setup' && session.metadata?.source === 'bitlink_trial_recovery') {
            return handleTrialRecoveryCompleted(admin, session);
          }
          if (session.metadata?.custom_order_token) {
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
        }

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
