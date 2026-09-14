import type Stripe from 'stripe';

// Where a customer's card actually lives, and how to charge it.
//
// Subscriptions created through Stripe Checkout attach the card to the
// *subscription* (subscription.default_payment_method) and commonly leave the
// customer with no default at all. Sampled against production 2026-09-14:
// 11 of 12 customers with an active line had no
// customer.invoice_settings.default_payment_method and no default_source —
// the card was only on the subscription.
//
// That matters because a one-time topup is billed with a standalone invoice on
// the customer, and Stripe pays a charge_automatically invoice from
// invoice.default_payment_method, then the customer's default, then
// default_source. A subscription's payment method is never consulted for an
// invoice that isn't that subscription's. So without resolving it explicitly,
// a self-serve topup fails for almost everyone — while their monthly billing
// keeps working, which is what makes it easy to miss.

export type ResolvedPaymentMethod = {
  id: string;
  /** Where it was found — useful when reporting why a charge failed. */
  source: 'subscription' | 'customer' | 'customer_source';
};

/**
 * The payment method that should be charged for an ad-hoc invoice, preferring
 * the subscription's card because that is the one the customer actually pays
 * their monthly bill with.
 */
export async function resolveChargeablePaymentMethod(
  stripe: Stripe,
  params: { stripeCustomerId: string; stripeSubscriptionId?: string | null },
): Promise<ResolvedPaymentMethod | null> {
  if (params.stripeSubscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(params.stripeSubscriptionId);
      const pm = subscription.default_payment_method;
      const id = typeof pm === 'string' ? pm : pm?.id;
      if (id) return { id, source: 'subscription' };
    } catch {
      // A missing or cancelled subscription shouldn't stop us checking the
      // customer below.
    }
  }

  try {
    const customer = await stripe.customers.retrieve(params.stripeCustomerId);
    if (customer.deleted) return null;

    const invoicePm = customer.invoice_settings?.default_payment_method;
    const invoicePmId = typeof invoicePm === 'string' ? invoicePm : invoicePm?.id;
    if (invoicePmId) return { id: invoicePmId, source: 'customer' };

    const source = customer.default_source;
    const sourceId = typeof source === 'string' ? source : source?.id;
    if (sourceId) return { id: sourceId, source: 'customer_source' };
  } catch {
    return null;
  }

  return null;
}

export type PaymentMethodSummary = {
  /** Ready to display, e.g. "Visa ···· 4242" or "Link · joe@example.com". */
  label: string;
  brand: string | null;
  last4: string | null;
};

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Human-readable details for a resolved payment method, for display only.
 *
 * Not card-specific on purpose. The first production customer checked pays
 * with Stripe Link, which has no brand or last4 at all — a card-only
 * implementation reported "no card on file" to someone who very much had one.
 * Anything chargeable must describe itself as something.
 */
export async function describePaymentMethod(
  stripe: Stripe,
  paymentMethodId: string,
): Promise<PaymentMethodSummary | null> {
  try {
    // Legacy `card_`/`src_` ids are sources, not PaymentMethods, and 404 here.
    if (!paymentMethodId.startsWith('pm_')) {
      return { label: 'Card on file', brand: null, last4: null };
    }

    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (pm.type === 'card' && pm.card?.brand && pm.card?.last4) {
      return {
        label: `${titleCase(pm.card.brand)} ···· ${pm.card.last4}`,
        brand: pm.card.brand,
        last4: pm.card.last4,
      };
    }

    // Link wraps a card Stripe won't always expose; show the account it pays
    // from, which is what the customer recognises.
    if (pm.type === 'link') {
      const email = pm.link?.email;
      return { label: email ? `Link · ${email}` : 'Link', brand: 'link', last4: null };
    }

    if (pm.type === 'paypal') return { label: 'PayPal', brand: 'paypal', last4: null };

    return { label: titleCase(pm.type.replace(/_/g, ' ')), brand: pm.type, last4: null };
  } catch {
    return null;
  }
}
