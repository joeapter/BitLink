// Custom multi-line orders — admin-priced subscriptions.
//
// Billing model: ONE Stripe subscription per customer; each BitLink line is one
// subscription ITEM with its own ad-hoc price (price_data). This gives combined
// billing (one invoice, one renewal date, Stripe-native proration when lines are
// added later) AND per-line control (pause/cancel a single item).

import type Stripe from 'stripe';
import { getPlan, plans, type PlanSlug } from '@/lib/plans';
import { topups, type TopUpId } from '@/lib/topups';
import { absoluteUrl } from '@/lib/utils';

type CheckoutLineItem = NonNullable<Stripe.Checkout.SessionCreateParams['line_items']>[number];

export type CustomOrderTopup = {
  topupId: TopUpId | string;
  customPriceCents: number;
};

export type CustomOrderLine = {
  planSlug: PlanSlug;
  isEsim: boolean;
  isPortIn: boolean;
  portNumber: string | null;
  wantsIntlNumber: boolean;
  intlCountry: 'us' | 'canada' | 'uk' | null;
  intlSource: 'new' | 'port' | null;
  intlPortNumber: string | null;
  // Number the customer picked from international_dids inventory at checkout
  // time (intlSource === 'new' only) — see IntlNumberPicker + the checkout
  // route's reservation step.
  intlChosenNumber: string | null;
  // ICCID of the physical SIM to activate the line on (physical/kosher lines
  // only). Present when an admin enters it in the custom-order builder; eSIM
  // and customer-facing flows leave it unset and provisioning auto-picks an
  // eSIM from inventory.
  iccId?: string | null;
  // Physical SIM shipping (physical/kosher lines only). method is always
  // server-derived from city, never trusted as a separate stored value.
  delivery?: {
    method: 'courier' | 'israel_post';
    city: string;
    addressLine1: string;
    addressLine2: string | null;
    requestedDate: string | null;
  } | null;
  customPriceCents: number;
  // One-time charge alongside the recurring price — the negotiated
  // equivalent of STRIPE_PRICE_ACTIVATION_FEE on the standard checkout.
  // Custom orders never charged one before this existed; 0 preserves that
  // for every line that doesn't set it explicitly.
  activationFeeCents: number;
  // Recurring monthly carrier topups bundled onto this line (e.g. +120 Min
  // USA/CA), each at its own admin-set price — independent of the topup's
  // catalog price so an admin can discount it for a specific deal. Granted to
  // Annatel once the line goes active (see custom-order-topup-grant.ts) and
  // re-applied monthly by the existing processMonthlyTopupGrants sweep, same
  // as any other paid topup grant.
  topups: CustomOrderTopup[];
};

export function normalizeCustomOrderLines(value: unknown): CustomOrderLine[] {
  if (!Array.isArray(value)) return [];
  return value.map((raw) => {
    const row = (raw ?? {}) as Record<string, unknown>;
    const planSlug = String(row.planSlug ?? row.plan_slug ?? 'student-5g') as PlanSlug;
    const plan = plans.find((p) => p.slug === planSlug) ?? getPlan('student-5g');
    const wantsIntlNumber = Boolean(row.wantsIntlNumber ?? row.wants_intl_number ?? false);
    const intlSource = (row.intlSource ?? row.intl_source ?? 'new') as 'new' | 'port';
    return {
      planSlug: plan.slug,
      isEsim: plan.isKosher ? false : Boolean(row.isEsim ?? row.is_esim ?? true),
      isPortIn: Boolean(row.isPortIn ?? row.is_port_in ?? false),
      portNumber: (row.portNumber ?? row.port_number ?? null) as string | null,
      wantsIntlNumber,
      intlCountry: wantsIntlNumber ? ((row.intlCountry ?? row.intl_country ?? 'us') as 'us' | 'canada' | 'uk') : null,
      intlSource: wantsIntlNumber ? intlSource : null,
      intlPortNumber: wantsIntlNumber && intlSource === 'port'
        ? ((row.intlPortNumber ?? row.intl_port_number ?? null) as string | null)
        : null,
      intlChosenNumber: wantsIntlNumber && intlSource === 'new'
        ? ((row.intlChosenNumber ?? row.intl_chosen_number ?? null) as string | null)
        : null,
      // Only meaningful for physical lines; eSIM auto-picks from inventory.
      iccId: plan.isKosher || !Boolean(row.isEsim ?? row.is_esim ?? true)
        ? ((row.iccId ?? row.icc_id ?? null) as string | null)
        : null,
      delivery: (row.delivery ?? null) as CustomOrderLine['delivery'],
      customPriceCents: Number(row.customPriceCents ?? row.custom_price_cents ?? plan.priceCents),
      activationFeeCents: Math.max(0, Number(row.activationFeeCents ?? row.activation_fee_cents ?? 0)),
      topups: normalizeCustomOrderTopups(row.topups),
    };
  });
}

function normalizeCustomOrderTopups(value: unknown): CustomOrderTopup[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw) => {
      const row = (raw ?? {}) as Record<string, unknown>;
      const topupId = String(row.topupId ?? row.topup_id ?? '');
      if (!topups.some((t) => t.id === topupId)) return null;
      const customPriceCents = Number(row.customPriceCents ?? row.custom_price_cents ?? 0);
      if (!Number.isFinite(customPriceCents) || customPriceCents < 0) return null;
      return { topupId, customPriceCents };
    })
    .filter((t): t is CustomOrderTopup => t !== null);
}

function topupProductMetadata(token: string, lineIndex: number, topup: CustomOrderTopup): Record<string, string> {
  return {
    custom_order_token: token,
    custom_order_line_index: String(lineIndex),
    is_topup: '1',
    topup_id: String(topup.topupId),
    source: 'bitlink_admin_custom',
  };
}

function toTopupLineItems(token: string, lines: CustomOrderLine[]): CheckoutLineItem[] {
  return lines.flatMap((line, lineIndex) =>
    line.topups.map((topup) => {
      const catalogTopup = topups.find((t) => t.id === topup.topupId);
      return {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: topup.customPriceCents,
          recurring: { interval: 'month' },
          product_data: {
            name: catalogTopup?.name ?? String(topup.topupId),
            metadata: topupProductMetadata(token, lineIndex, topup),
          },
        },
      } satisfies CheckoutLineItem;
    }),
  );
}

// One-time items, mixed directly into a subscription-mode Checkout Session's
// line_items. Stripe charges these once at checkout and never adds them to
// the resulting subscription — the presence/absence of `recurring` on the
// price is what distinguishes them from the plan and topup items above, not
// a separate mode or session.
function toActivationFeeLineItems(token: string, lines: CustomOrderLine[]): CheckoutLineItem[] {
  return lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.activationFeeCents > 0)
    .map(({ line, index }) => ({
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: line.activationFeeCents,
        product_data: {
          name: `Activation fee — ${customOrderLineName(line)}`,
          metadata: { custom_order_token: token, custom_order_line_index: String(index), is_activation_fee: '1' },
        },
      },
    } satisfies CheckoutLineItem));
}

export function customOrderLineName(line: CustomOrderLine): string {
  const plan = plans.find((p) => p.slug === line.planSlug);
  const base = plan?.name ?? line.planSlug;
  const parts = [base];
  if (line.isPortIn) parts.push('port-in');
  if (line.wantsIntlNumber) {
    const country = (line.intlCountry ?? 'us').toUpperCase();
    parts.push(line.intlSource === 'port' ? `${country} number port` : `${country} number`);
  }
  return parts.join(' · ');
}

function lineProductMetadata(token: string, line: CustomOrderLine, index: number): Record<string, string> {
  return {
    custom_order_token: token,
    custom_order_line_index: String(index),
    plan_slug: line.planSlug,
    is_esim: line.isEsim ? '1' : '0',
    is_port_in: line.isPortIn ? '1' : '0',
    port_number: line.portNumber ?? '',
    wants_intl_number: line.wantsIntlNumber ? '1' : '0',
    intl_country: line.intlCountry ?? '',
    intl_source: line.intlSource ?? '',
    intl_port_number: line.intlPortNumber ?? '',
    intl_chosen_number: line.intlChosenNumber ?? '',
    source: 'bitlink_admin_custom',
  };
}

function toRecurringLineItems(token: string, lines: CustomOrderLine[]): CheckoutLineItem[] {
  return lines.map((line, index) => ({
    quantity: 1,
    price_data: {
      currency: 'usd',
      unit_amount: line.customPriceCents,
      recurring: { interval: 'month' },
      product_data: {
        name: customOrderLineName(line),
        metadata: lineProductMetadata(token, line, index),
      },
    },
  }));
}

// Embedded checkout session for a brand-new combined subscription. The order
// token ties the paid subscription back to the custom_line_orders row so the
// webhook can provision every line.
export function createCustomOrderSession(
  stripe: Stripe,
  params: {
    token: string;
    stripeCustomerId: string;
    customerRecordId: string | null;
    lines: CustomOrderLine[];
    uiMode?: 'hosted' | 'embedded';
    successUrl?: string;
    cancelUrl?: string;
    // When set, the subscription starts in Stripe's "trialing" status for
    // this many days: card is saved and verified but not charged, lines
    // provision and ship immediately off the same webhook as a normal paid
    // order (see handleCustomOrderCheckoutCompleted — it only needs a real
    // Subscription object, trialing or not), and Stripe auto-charges the
    // saved card the moment the trial ends. No separate "convert later" step
    // needed, unlike the single-plan student/olim trial in trial-offer.ts.
    trialDays?: number | null;
  },
): Promise<Stripe.Response<Stripe.Checkout.Session>> {
  const sharedMetadata = {
    custom_order_token: params.token,
    customer_record_id: params.customerRecordId ?? '',
    source: 'bitlink_admin_custom',
  };

  const shared: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    customer: params.stripeCustomerId,
    line_items: [
      ...toRecurringLineItems(params.token, params.lines),
      ...toTopupLineItems(params.token, params.lines),
      ...toActivationFeeLineItems(params.token, params.lines),
    ],
    billing_address_collection: 'auto',
    phone_number_collection: { enabled: true },
    // Card-first: don't let Link take over the form.
    wallet_options: { link: { display: 'never' } },
    client_reference_id: params.token,
    metadata: sharedMetadata,
    subscription_data: {
      metadata: sharedMetadata,
      ...(params.trialDays ? { trial_period_days: params.trialDays } : {}),
    },
  };

  if (params.uiMode === 'embedded') {
    return stripe.checkout.sessions.create({
      ...shared,
      ui_mode: 'embedded_page',
      return_url: params.successUrl ?? absoluteUrl(`/checkout/success?session_id={CHECKOUT_SESSION_ID}`),
    });
  }

  return stripe.checkout.sessions.create({
    ...shared,
    success_url: params.successUrl ?? absoluteUrl(`/checkout/success?session_id={CHECKOUT_SESSION_ID}`),
    cancel_url: params.cancelUrl ?? absoluteUrl(`/pay/${params.token}`),
  });
}

// Add lines to a customer's EXISTING subscription — Stripe prorates the first
// partial period automatically and bills the added items on the shared renewal
// date according to the subscription's invoice settings. Returns the new
// subscription items (ordered to match `lines`) so callers can map item → line.
export async function addLinesToExistingSubscription(
  stripe: Stripe,
  params: {
    subscriptionId: string;
    stripeCustomerId: string;
    token: string;
    lines: CustomOrderLine[];
    startingLineIndex?: number;
  },
): Promise<Stripe.SubscriptionItem[]> {
  const created: Stripe.SubscriptionItem[] = [];
  let pendingActivationFees = false;

  for (const [offset, line] of params.lines.entries()) {
    const index = (params.startingLineIndex ?? 0) + offset;
    // Subscription-item price_data needs a Product id (no inline product_data),
    // so create a per-line product to preserve the invoice description.
    const product = await stripe.products.create({
      name: customOrderLineName(line),
      metadata: lineProductMetadata(params.token, line, index),
    });
    const item = await stripe.subscriptionItems.create({
      subscription: params.subscriptionId,
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: line.customPriceCents,
        recurring: { interval: 'month' },
        product: product.id,
      },
      proration_behavior: 'create_prorations',
      metadata: {
        custom_order_token: params.token,
        custom_order_line_index: String(index),
        source: 'bitlink_custom_line',
      },
    });
    created.push(item);

    // Unlike the fresh-checkout path, there is no Checkout Session to attach
    // a one-time line item to — an invoice item pending against the customer
    // is the equivalent here. It rides into the SAME invoice as this line's
    // proration below rather than waiting for next month's renewal.
    if (line.activationFeeCents > 0) {
      pendingActivationFees = true;
      await stripe.invoiceItems.create({
        customer: params.stripeCustomerId,
        amount: line.activationFeeCents,
        currency: 'usd',
        description: `Activation fee — ${customOrderLineName(line)}`,
        metadata: {
          custom_order_token: params.token,
          custom_order_line_index: String(index),
          is_activation_fee: '1',
        },
      });
    }
  }

  // create_prorations leaves the new items' charges pending until the next
  // invoice is generated — normally the following renewal. Forcing an
  // on-demand invoice now is what actually makes this "billed immediately"
  // rather than a silent wait until next cycle, and it's the only way the
  // one-time activation fee items above get charged at all (nothing else
  // ever generates an invoice for them). Stripe sweeps every pending item
  // for this customer into it, proration included, in one charge.
  if (pendingActivationFees || created.length > 0) {
    const invoice = await stripe.invoices.create({
      customer: params.stripeCustomerId,
      subscription: params.subscriptionId,
      auto_advance: true,
    });
    if (invoice.id) {
      // finalizeInvoice alone does NOT collect payment — confirmed the hard
      // way against a real invoice, which sat at $0.00 paid / status "open"
      // with next_payment_attempt an hour out despite auto_advance: true.
      // Explicitly paying is what actually charges the card now rather than
      // leaving it to Stripe's own automatic-collection schedule.
      await stripe.invoices.finalizeInvoice(invoice.id);
      await stripe.invoices.pay(invoice.id);
    }
  }

  return created;
}
