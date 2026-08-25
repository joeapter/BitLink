// Refund the customer's last payment and cancel their subscription, from the
// admin line page.
//
// This exists because the welcome email promises a full refund within 3 days,
// no questions asked (src/lib/email/templates.ts), so it is a routine support
// flow rather than a rare event.
//
// The important design point is what this deliberately does NOT do: it never
// terminates the carrier line itself. Cancelling the Stripe subscription fires
// `customer.subscription.deleted`, and handleSubscriptionDeleted() already
// terminates the line AND releases the DID back to the tenant number bank.
// Terminating here as well would mean two implementations of cancellation that
// can drift, and the manual path is the one that forgets to release the number.
// So: refund, cancel, and let the webhook do the rest.
//
// Note on the Stripe API version pinned in src/lib/stripe/server.ts
// (2026-04-22.dahlia): `invoice.charge` and `invoice.payment_intent` no longer
// exist. An invoice's money is reached through `invoice.payments`, which has to
// be expanded — hence the expand calls below.

import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/server';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'refund-cancel' });

export interface LastPayment {
  invoiceId: string;
  invoiceNumber: string | null;
  /** What the customer actually paid, in the smallest currency unit. */
  amountCents: number;
  currency: string;
  paidAt: string | null;
  /** Already-refunded portion, so a second refund can't be issued blindly. */
  refundedCents: number;
  paymentIntentId: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  /** Invoice line descriptions — lets Joe confirm the activation fee is included. */
  lines: Array<{ description: string; amountCents: number }>;
  hostedInvoiceUrl: string | null;
}

export interface RefundContext {
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  /** Already cancelled at Stripe — the cancel half is a no-op. */
  isCancelled: boolean;
  lastPayment: LastPayment | null;
  /** Populated when we can't offer the action; rendered as the reason why. */
  blockedReason: string | null;
}

const EMPTY: RefundContext = {
  subscriptionId: null,
  subscriptionStatus: null,
  isCancelled: false,
  lastPayment: null,
  blockedReason: null,
};

// A line's subscription id is stamped in metadata at checkout, but custom
// orders and older rows are more reliably found through `subscribers` (the
// canonical table). Try both before giving up.
async function findSubscriptionId(
  admin: SupabaseClient,
  lineId: string,
): Promise<string | null> {
  const { data: line } = await admin
    .from('telecom_lines')
    .select('metadata')
    .eq('id', lineId)
    .maybeSingle();

  const meta = (line?.metadata ?? {}) as Record<string, unknown>;
  const fromMeta = meta.stripe_subscription_id;
  if (typeof fromMeta === 'string' && fromMeta) return fromMeta;

  const { data: subscriber } = await admin
    .from('subscribers')
    .select('stripe_subscription_id')
    .eq('telecom_line_id', lineId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return subscriber?.stripe_subscription_id ?? null;
}

// Pull the payment details off an invoice. Everything here is display-only —
// its job is to let Joe confirm the amount is the one he expects BEFORE
// refunding, which is the whole reason this card exists rather than a bare
// button.
async function describeInvoice(
  stripe: Stripe,
  invoice: Stripe.Invoice,
): Promise<LastPayment> {
  const payment = invoice.payments?.data?.find(
    (p) => p.status === 'paid' || p.is_default,
  ) ?? invoice.payments?.data?.[0];

  const rawPi = payment?.payment.payment_intent;
  const paymentIntentId = typeof rawPi === 'string' ? rawPi : rawPi?.id ?? null;

  let cardBrand: string | null = null;
  let cardLast4: string | null = null;
  let refundedCents = 0;

  if (paymentIntentId) {
    try {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['latest_charge'],
      });
      const charge = pi.latest_charge as Stripe.Charge | null;
      if (charge) {
        refundedCents = charge.amount_refunded ?? 0;
        const card = charge.payment_method_details?.card;
        cardBrand = card?.brand ?? null;
        cardLast4 = card?.last4 ?? null;
      }
    } catch (err) {
      // Card details are a nicety; a failure here must not hide the amount.
      log.warn(
        { paymentIntentId, error: err instanceof Error ? err.message : String(err) },
        'Could not expand payment intent for refund context',
      );
    }
  }

  return {
    invoiceId: invoice.id ?? '',
    invoiceNumber: invoice.number,
    amountCents: invoice.amount_paid,
    currency: (invoice.currency ?? 'ils').toUpperCase(),
    paidAt: invoice.status_transitions?.paid_at
      ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
      : null,
    refundedCents,
    paymentIntentId,
    cardBrand,
    cardLast4,
    lines: (invoice.lines?.data ?? []).map((l) => ({
      description: l.description ?? 'Line item',
      amountCents: l.amount,
    })),
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
  };
}

/**
 * Everything the admin page needs to show the refund card. Read-only — safe to
 * call on every page render.
 */
export async function getRefundContext(
  admin: SupabaseClient,
  lineId: string,
): Promise<RefundContext> {
  const stripe = getStripe();
  if (!stripe) return { ...EMPTY, blockedReason: 'Stripe is not configured.' };

  const subscriptionId = await findSubscriptionId(admin, lineId);
  if (!subscriptionId) {
    return { ...EMPTY, blockedReason: 'No Stripe subscription is linked to this line.' };
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const isCancelled = subscription.status === 'canceled';

    const invoices = await stripe.invoices.list({
      subscription: subscriptionId,
      limit: 5,
      expand: ['data.payments'],
    });
    const paid = invoices.data.find((i) => i.status === 'paid' && i.amount_paid > 0);

    return {
      subscriptionId,
      subscriptionStatus: subscription.status,
      isCancelled,
      lastPayment: paid ? await describeInvoice(stripe, paid) : null,
      blockedReason: paid ? null : 'No paid invoice found on this subscription yet.',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ lineId, subscriptionId, error: message }, 'Failed to load refund context');
    return { ...EMPTY, subscriptionId, blockedReason: `Could not reach Stripe: ${message}` };
  }
}

export interface RefundResult {
  refundedCents?: number;
  currency?: string;
  cancelled?: boolean;
  error?: string;
}

/**
 * Refund the last payment in full, then cancel the subscription.
 *
 * Ordered refund-first on purpose: if the refund fails we stop, and the
 * customer keeps a working line rather than losing service while still out of
 * pocket. A cancellation failure after a successful refund is reported loudly
 * but leaves the money already returned, which is the right way round.
 *
 * `expectedAmountCents` is what the admin actually saw on screen when they
 * clicked. If the real invoice has moved since the page rendered, we refuse
 * rather than refund a different amount than the one that was confirmed.
 */
export async function refundAndCancelLine(
  admin: SupabaseClient,
  lineId: string,
  expectedAmountCents: number,
): Promise<RefundResult> {
  const stripe = getStripe();
  if (!stripe) return { error: 'Stripe is not configured.' };

  const context = await getRefundContext(admin, lineId);
  if (!context.lastPayment || !context.subscriptionId) {
    return { error: context.blockedReason ?? 'Nothing to refund on this line.' };
  }

  const payment = context.lastPayment;

  if (payment.amountCents !== expectedAmountCents) {
    return {
      error:
        `The payment changed since this page loaded (showed ${expectedAmountCents}, ` +
        `Stripe now reports ${payment.amountCents}). Reload and check before refunding.`,
    };
  }
  if (payment.refundedCents >= payment.amountCents) {
    return { error: 'This payment has already been refunded in full.' };
  }
  if (!payment.paymentIntentId) {
    return { error: 'No payment intent on that invoice — refund it from the Stripe dashboard.' };
  }

  const outstandingCents = payment.amountCents - payment.refundedCents;

  try {
    await stripe.refunds.create({
      payment_intent: payment.paymentIntentId,
      amount: outstandingCents,
      reason: 'requested_by_customer',
      metadata: { bitlink_line_id: lineId, issued_from: 'admin_line_page' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ lineId, paymentIntentId: payment.paymentIntentId, error: message }, 'Refund failed');
    return { error: `Refund failed, nothing was cancelled: ${message}` };
  }

  log.info({ lineId, amountCents: outstandingCents }, 'Refund issued');

  if (context.isCancelled) {
    return { refundedCents: outstandingCents, currency: payment.currency, cancelled: false };
  }

  try {
    // Immediate cancellation, not at period end — the webhook terminates the
    // line and releases the DID as soon as this lands.
    await stripe.subscriptions.cancel(context.subscriptionId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ lineId, subscriptionId: context.subscriptionId, error: message }, 'Cancel failed after refund');
    return {
      refundedCents: outstandingCents,
      currency: payment.currency,
      error: `Refund went through, but cancelling the subscription failed: ${message}. Cancel it in Stripe.`,
    };
  }

  log.info({ lineId, subscriptionId: context.subscriptionId }, 'Subscription cancelled after refund');
  return { refundedCents: outstandingCents, currency: payment.currency, cancelled: true };
}
