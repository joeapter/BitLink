import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe/server';
import { getPlan } from '@/lib/plans';
import { TRIAL_AUTO_CONTINUE_PLAN } from '@/lib/trial-offer';

export type MonthlyRevenue = {
  recurringCents: number;
  oneTimeCents: number;
  totalCents: number;
};

export type ExpectedRevenue = {
  /** Renewals still due to bill before this calendar month ends. */
  renewalCents: number;
  renewalCount: number;
  /** Lines those renewals cover — family subscriptions bill several at once. */
  renewalLineCount: number;
  /** Renewals Stripe wouldn't price — counted as $0, so the total is understated. */
  unpricedCount: number;
  /** Trials whose auto-continue date lands before month end. */
  trialCents: number;
  trialCount: number;
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

// In API 2026-04-22.dahlia the billing period moved from the subscription root
// onto its items, so read the item first and fall back for older objects.
function nextBillingUnix(sub: Stripe.Subscription): number | null {
  const withPeriod = sub as Stripe.Subscription & { current_period_end?: number };
  const item = sub.items?.data?.[0] as (Stripe.SubscriptionItem & { current_period_end?: number }) | undefined;
  return item?.current_period_end ?? withPeriod.current_period_end ?? null;
}

// What a subscription's next invoice will actually charge. Used for subs that
// itemsAmountCents can't price, because preview applies discounts (promo
// codes), tiers and tax — summing list prices would overstate those.
async function previewAmountCents(stripe: Stripe, subscriptionId: string): Promise<number | null> {
  try {
    const preview = await stripe.invoices.createPreview(
      { subscription: subscriptionId },
      { maxNetworkRetries: 4 },
    );
    return preview.amount_due ?? preview.total ?? null;
  } catch {
    return null;
  }
}

// Stripe rate-limits invoice previews far below its general limit: firing
// all ~40 at once had 18 come back 429, each silently counted as $0, so the
// forecast swung between loads. Run a few at a time instead.
const PREVIEW_CONCURRENCY = 4;

// A subscription with no discounts and only flat per-unit prices bills exactly
// the sum of its items — verified against previews for every live sub. Pricing
// those locally keeps the forecast steady: it needs no per-sub Stripe call, so
// nothing can be rate-limited away between page loads. Returns null when the
// sub has anything Stripe has to work out (discounts, tiers, metering).
function itemsAmountCents(sub: Stripe.Subscription): number | null {
  if (sub.discounts?.length) return null;
  let cents = 0;
  for (const item of sub.items.data) {
    const price = item.price;
    if (item.discounts?.length) return null;
    if (price.billing_scheme !== 'per_unit' || price.unit_amount === null) return null;
    if (price.recurring?.usage_type === 'metered') return null;
    cents += price.unit_amount * (item.quantity ?? 1);
  }
  return cents;
}

async function priceAll(stripe: Stripe, subs: Stripe.Subscription[]): Promise<(number | null)[]> {
  const results = subs.map(itemsAmountCents);
  const pending = results.flatMap((cents, i) => (cents === null ? [i] : []));
  let next = 0;
  async function worker() {
    while (next < pending.length) {
      const i = pending[next++];
      results[i] = await previewAmountCents(stripe, subs[i].id);
    }
  }
  await Promise.all(Array.from({ length: PREVIEW_CONCURRENCY }, worker));
  return results;
}

// Forward-looking companion to getMonthlyRevenue: what is still expected to be
// charged before this calendar month ends.
//
// Counted:  active subscriptions whose next billing date falls in the remainder
//           of the month, plus active trials whose auto-continue date does.
// Excluded: anything already cancelled, and anything flagged
//           cancel_at_period_end — those are billing for the last time and the
//           charge either already landed or is not coming.
//
// This is a forecast, not a ledger. A mid-month cancellation or a failed card
// changes it, which is expected — it answers "where is the month heading", not
// "what have we banked".
export async function getExpectedRevenue(admin: SupabaseClient | null): Promise<ExpectedRevenue | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const now = new Date();
  const nowUnix = Math.floor(now.getTime() / 1000);
  const monthEndUnix = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) / 1000);

  // ── Renewals still due this month ────────────────────────────────────────
  const due: Stripe.Subscription[] = [];
  let startingAfter: string | undefined;

  // status 'all' rather than 'active' so Stripe-side trials (a repriced sub
  // given a free stretch before its first charge) are counted — their
  // current_period_end is the trial end, which is when they first bill.
  for (;;) {
    const subs = await stripe.subscriptions.list({ status: 'all', limit: 100, starting_after: startingAfter });
    for (const sub of subs.data) {
      if (sub.status !== 'active' && sub.status !== 'trialing') continue;
      if (sub.cancel_at_period_end) continue;
      const next = nextBillingUnix(sub);
      if (next === null || next < nowUnix || next >= monthEndUnix) continue;
      due.push(sub);
    }
    if (!subs.has_more) break;
    startingAfter = subs.data[subs.data.length - 1]?.id;
  }

  const amounts = await priceAll(stripe, due);
  const renewalCents = amounts.reduce((sum: number, cents) => sum + (cents ?? 0), 0);
  const unpricedCount = amounts.filter((cents) => cents === null).length;

  // One subscription can bill for several lines (family accounts), so the
  // renewal count alone reads as an undercount next to the line total.
  let renewalLineCount = due.length;
  if (admin && due.length > 0) {
    const { count } = await admin
      .from('subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .in('stripe_subscription_id', due.map((sub) => sub.id));
    if (count !== null) renewalLineCount = count;
  }

  // ── Trials auto-continuing onto a paid plan this month ───────────────────
  let trialCents = 0;
  let trialCount = 0;

  if (admin) {
    const { data: trials } = await admin
      .from('trial_lines')
      .select('id')
      .eq('status', 'active')
      .gte('decision_due_at', now.toISOString())
      .lt('decision_due_at', new Date(monthEndUnix * 1000).toISOString());

    trialCount = trials?.length ?? 0;
    trialCents = trialCount * getPlan(TRIAL_AUTO_CONTINUE_PLAN).priceCents;
  }

  return {
    renewalCents,
    renewalCount: due.length,
    renewalLineCount,
    unpricedCount,
    trialCents,
    trialCount,
    totalCents: renewalCents + trialCents,
  };
}
