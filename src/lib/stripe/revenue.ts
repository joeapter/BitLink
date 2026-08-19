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

// What a subscription's next invoice will actually charge. Preview is used
// rather than summing item prices because it applies discounts (promo codes),
// proration and tax — summing list prices would overstate on any discounted line.
async function previewAmountCents(stripe: Stripe, subscriptionId: string): Promise<number | null> {
  try {
    const preview = await stripe.invoices.createPreview({ subscription: subscriptionId });
    return preview.amount_due ?? preview.total ?? null;
  } catch {
    return null;
  }
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

  for (;;) {
    const subs = await stripe.subscriptions.list({ status: 'active', limit: 100, starting_after: startingAfter });
    for (const sub of subs.data) {
      if (sub.cancel_at_period_end) continue;
      const next = nextBillingUnix(sub);
      if (next === null || next < nowUnix || next >= monthEndUnix) continue;
      due.push(sub);
    }
    if (!subs.has_more) break;
    startingAfter = subs.data[subs.data.length - 1]?.id;
  }

  const amounts = await Promise.all(due.map((sub) => previewAmountCents(stripe, sub.id)));
  const renewalCents = amounts.reduce((sum: number, cents) => sum + (cents ?? 0), 0);

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
    trialCents,
    trialCount,
    totalCents: renewalCents + trialCents,
  };
}
