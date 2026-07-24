// Custom multi-line orders — admin-priced subscriptions.
//
// Billing model: ONE Stripe subscription per customer; each BitLink line is one
// subscription ITEM with its own ad-hoc price (price_data). This gives combined
// billing (one invoice, one renewal date, Stripe-native proration when lines are
// added later) AND per-line control (pause/cancel a single item).

import type Stripe from 'stripe';
import { getPlan, plans, type PlanSlug } from '@/lib/plans';
import { absoluteUrl } from '@/lib/utils';

type CheckoutLineItem = NonNullable<Stripe.Checkout.SessionCreateParams['line_items']>[number];

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
  customPriceCents: number;
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
      customPriceCents: Number(row.customPriceCents ?? row.custom_price_cents ?? plan.priceCents),
    };
  });
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
    line_items: toRecurringLineItems(params.token, params.lines),
    billing_address_collection: 'auto',
    phone_number_collection: { enabled: true },
    // Card-first: don't let Link take over the form.
    wallet_options: { link: { display: 'never' } },
    client_reference_id: params.token,
    metadata: sharedMetadata,
    subscription_data: { metadata: sharedMetadata },
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
    token: string;
    lines: CustomOrderLine[];
    startingLineIndex?: number;
  },
): Promise<Stripe.SubscriptionItem[]> {
  const created: Stripe.SubscriptionItem[] = [];
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
  }
  return created;
}
