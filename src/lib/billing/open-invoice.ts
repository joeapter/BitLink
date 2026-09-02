// The customer's outstanding invoice, if they have one.
//
// Read from Stripe rather than from our own tables on purpose: `subscribers`
// records that a payment failed, but only Stripe knows whether the debt is
// still outstanding right now. A customer who paid two minutes ago through the
// hosted invoice page has an up-to-date answer here and a stale one in our DB
// until the webhook lands — and showing someone a "you owe us" banner straight
// after they've paid is worse than showing nothing.
//
// The hosted invoice URL is fetched fresh every time for the same reason it is
// in the dunning sweep: Stripe's link carries a session token that rotates, so
// a stored copy goes stale.

import { getStripe } from '@/lib/stripe/server';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'open-invoice' });

export interface OpenInvoice {
  amountDueCents: number;
  currency: string;
  payUrl: string;
}

export async function getOpenInvoice(stripeCustomerId: string | null | undefined): Promise<OpenInvoice | null> {
  if (!stripeCustomerId) return null;
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    const invoices = await stripe.invoices.list({ customer: stripeCustomerId, status: 'open', limit: 1 });
    const invoice = invoices.data[0];
    if (!invoice?.hosted_invoice_url || !invoice.amount_due) return null;
    return {
      amountDueCents: invoice.amount_due,
      currency: invoice.currency ?? 'usd',
      payUrl: invoice.hosted_invoice_url,
    };
  } catch (err) {
    // Never let a Stripe hiccup break the account page — the banner is an
    // enhancement, not the page's reason for existing.
    log.error(
      { stripeCustomerId, error: err instanceof Error ? err.message : String(err) },
      'Failed to load open invoice',
    );
    return null;
  }
}
