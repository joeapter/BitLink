import { getStripe } from '@/lib/stripe/server';

export type MonthlyRevenue = {
  recurringCents: number;
  oneTimeCents: number;
  totalCents: number;
};

// Pulled live from Stripe rather than the local DB — Stripe is the actual
// ledger of what was charged and when; the app's own tables track product/
// provisioning state, not a full itemized billing history. Recurring vs.
// one-time is split by each invoice line's parent type: subscription_item_details
// (plan charges, recurring topups/add-ons) counts as recurring; invoice_item_details
// (activation fees, one-time topup purchases via chargeOneTimeInvoice in
// lib/topups/grant-topup.ts) counts as one-time.
export async function getMonthlyRevenue(): Promise<MonthlyRevenue | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const now = new Date();
  const monthStartUnix = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) / 1000);

  let recurringCents = 0;
  let oneTimeCents = 0;
  let startingAfter: string | undefined;

  for (;;) {
    const invoices = await stripe.invoices.list({
      status: 'paid',
      created: { gte: monthStartUnix },
      limit: 100,
      starting_after: startingAfter,
    });

    for (const invoice of invoices.data) {
      for (const line of invoice.lines.data) {
        const amount = line.amount ?? 0;
        if (line.parent?.type === 'subscription_item_details') {
          recurringCents += amount;
        } else {
          oneTimeCents += amount;
        }
      }
    }

    if (!invoices.has_more) break;
    startingAfter = invoices.data[invoices.data.length - 1]?.id;
  }

  return { recurringCents, oneTimeCents, totalCents: recurringCents + oneTimeCents };
}
