// The failed-payment ladder: notice → warning → hold.
//
// Stripe runs its own Smart Retries alongside this and keeps trying the card
// for weeks. This ladder is deliberately *shorter* than Stripe's retry window,
// which means the normal case is that we pause a line while Stripe is still
// attempting to collect — and then collect successfully a day or two later.
// That is exactly why recovery has to be automatic (see clearDunningState,
// called from the subscription.updated webhook): without it, a customer who
// pays on day 12 stays dark forever.
//
// Timing is measured from subscribers.payment_failed_at, stamped on the FIRST
// decline. Not from Stripe's attempt count, and not from the last retry —
// Stripe's spacing is irregular (1–3 days apart in practice), so anything
// anchored to "last attempt" makes the dates we promise customers drift.
//
// The rungs:
//   day 1   notice     — your payment didn't go through, here's the link
//   day 7   warning    — names the hold date
//   day 10  hold       — carrier suspension, number reserved
//
// Day 1 rather than day 0 on purpose: nearly every decline we've seen is
// "insufficient funds", and Stripe's next retry often clears it within a day.
// Emailing on the first decline would mean telling people about a problem that
// fixes itself, which is how customers learn to ignore billing mail.
//
// INVARIANT: nothing is ever suspended without a warning email having been
// sent at least SUSPEND_AFTER_WARNING_DAYS earlier. The day count alone is not
// sufficient — a backfilled or clock-skewed payment_failed_at could otherwise
// jump a customer straight to a hold they were never warned about.

import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/server';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';
import { sendEmail } from '@/lib/email/send';
import {
  buildPastDueEmail,
  buildPastDueFinalWarningEmail,
  buildLineSuspendedEmail,
} from '@/lib/email/templates';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'dunning' });

export const NOTIFY_AFTER_DAYS = 1;
export const WARN_AFTER_DAYS = 7;
export const SUSPEND_AFTER_DAYS = 10;
/** A warning must precede a hold by at least this long, whatever the day count says. */
export const SUSPEND_AFTER_WARNING_DAYS = 3;

const DAY_MS = 86_400_000;

type SubscriberRow = {
  id: string;
  customer_id: string;
  telecom_line_id: string | null;
  stripe_subscription_id: string | null;
  payment_failed_at: string | null;
  dunning_notified_at: string | null;
  dunning_warned_at: string | null;
  dunning_suspended_at: string | null;
  customers: { full_name: string | null; email: string | null } | null;
};

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / DAY_MS;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * The customer's open invoice, if there is one. We re-fetch this on every send
 * rather than storing the URL: Stripe's hosted invoice links carry a session
 * token that rotates, and a link minted for the day-1 email would be a week
 * stale by the day-7 one. Returns null when nothing is outstanding — which is
 * itself meaningful, since it means the debt was settled and this subscriber
 * shouldn't be laddered at all.
 */
async function openInvoiceFor(
  stripe: Stripe,
  stripeSubscriptionId: string,
): Promise<{ payUrl: string; amountLabel: string } | null> {
  const invoices = await stripe.invoices.list({
    subscription: stripeSubscriptionId,
    status: 'open',
    limit: 1,
  });
  const invoice = invoices.data[0];
  if (!invoice?.hosted_invoice_url) return null;
  return {
    payUrl: invoice.hosted_invoice_url,
    amountLabel: `$${((invoice.amount_due ?? 0) / 100).toFixed(2)}`,
  };
}

/**
 * Clears the whole ladder. Called when a payment succeeds, so a customer who
 * recovers and fails again months later starts fresh rather than resuming
 * mid-ladder and being suspended almost immediately.
 *
 * Also lifts the carrier suspension if this ladder applied one. Deliberately
 * narrow: it only reactivates when dunning_suspended_at is set, so it can
 * never un-suspend a line that a human paused for some other reason.
 */
export async function clearDunningState(
  admin: SupabaseClient,
  subscriberId: string,
): Promise<{ reactivated: boolean }> {
  const { data: sub } = await admin
    .from('subscribers')
    .select('id, telecom_line_id, dunning_suspended_at')
    .eq('id', subscriberId)
    .maybeSingle();

  let reactivated = false;

  if (sub?.dunning_suspended_at && sub.telecom_line_id) {
    const { data: line } = await admin
      .from('telecom_lines')
      .select('provider_line_id, status')
      .eq('id', sub.telecom_line_id as string)
      .maybeSingle();

    if (line?.provider_line_id && line.status !== 'terminated') {
      try {
        await getTelecomProvider().reactivateLine(line.provider_line_id as string);
        await admin
          .from('telecom_lines')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', sub.telecom_line_id as string);
        reactivated = true;
        log.info({ subscriberId, lineId: sub.telecom_line_id }, 'Line reactivated after payment recovered');
      } catch (err) {
        // Never let a carrier failure block the state reset — the money is in,
        // and leaving payment_failed_at set would re-suspend on the next sweep.
        // Surfaces in the admin past-due panel as a line that needs a look.
        log.error(
          { subscriberId, error: err instanceof Error ? err.message : String(err) },
          'Failed to reactivate line after payment recovered — needs manual attention',
        );
      }
    }
  }

  await admin
    .from('subscribers')
    .update({
      payment_failed_at: null,
      dunning_notified_at: null,
      dunning_warned_at: null,
      dunning_suspended_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriberId);

  return { reactivated };
}

export interface DunningResult {
  notified: number;
  warned: number;
  suspended: number;
  recovered: number;
  skipped: number;
}

export async function processDunning(admin: SupabaseClient): Promise<DunningResult> {
  const result: DunningResult = { notified: 0, warned: 0, suspended: 0, recovered: 0, skipped: 0 };
  const stripe = getStripe();
  if (!stripe) {
    log.warn('Stripe unavailable — dunning sweep skipped');
    return result;
  }

  const { data: rows } = await admin
    .from('subscribers')
    .select(
      'id, customer_id, telecom_line_id, stripe_subscription_id, payment_failed_at, ' +
        'dunning_notified_at, dunning_warned_at, dunning_suspended_at, customers(full_name, email)',
    )
    .not('payment_failed_at', 'is', null)
    .order('payment_failed_at', { ascending: true });

  for (const row of (rows ?? []) as unknown as SubscriberRow[]) {
    if (!row.payment_failed_at || !row.stripe_subscription_id) {
      result.skipped += 1;
      continue;
    }

    // Settled between the webhook and this sweep — clear the ladder rather
    // than emailing someone about a debt they've already paid. This is also
    // the safety net for a missed subscription.updated webhook.
    const invoice = await openInvoiceFor(stripe, row.stripe_subscription_id);
    if (!invoice) {
      await clearDunningState(admin, row.id);
      result.recovered += 1;
      continue;
    }

    const email = row.customers?.email;
    const fullName = row.customers?.full_name ?? '';
    if (!email) {
      result.skipped += 1;
      continue;
    }

    const age = daysSince(row.payment_failed_at);

    // ── Rung 3: hold ────────────────────────────────────────────────────
    if (
      !row.dunning_suspended_at &&
      age >= SUSPEND_AFTER_DAYS &&
      row.dunning_warned_at &&
      daysSince(row.dunning_warned_at) >= SUSPEND_AFTER_WARNING_DAYS
    ) {
      const { data: line } = await admin
        .from('telecom_lines')
        .select('provider_line_id, status')
        .eq('id', row.telecom_line_id ?? '')
        .maybeSingle();

      if (!line?.provider_line_id) {
        result.skipped += 1;
        continue;
      }

      try {
        // 'freeze', not 'billing'. Annatel confirmed (Jul 2026) that freeze
        // holds the line, the number AND the SIM — which is precisely what
        // buildLineSuspendedEmail promises the customer, and what makes
        // reactivateLine restore service without a reprovision. It's the same
        // suspension the customer-facing Pause feature and the trial expiry
        // path already use, so its reversibility is proven in production.
        await getTelecomProvider().suspendLine(line.provider_line_id as string, 'freeze');
      } catch (err) {
        // Leave the stamp unset so the next sweep retries rather than marking
        // this customer suspended when their line is in fact still running.
        log.error(
          { subscriberId: row.id, error: err instanceof Error ? err.message : String(err) },
          'Carrier suspension failed — will retry next sweep',
        );
        result.skipped += 1;
        continue;
      }

      const now = new Date().toISOString();
      await admin
        .from('telecom_lines')
        .update({ status: 'suspended', updated_at: now })
        .eq('id', row.telecom_line_id as string);
      await admin
        .from('subscribers')
        .update({ dunning_suspended_at: now, updated_at: now })
        .eq('id', row.id);

      await sendEmail({
        to: email,
        subject: 'Your BitLink line is on hold',
        html: buildLineSuspendedEmail({ fullName, amountLabel: invoice.amountLabel, payUrl: invoice.payUrl }),
      });

      log.warn({ subscriberId: row.id, days: Math.floor(age) }, 'Line suspended for non-payment');
      result.suspended += 1;
      continue;
    }

    // ── Rung 2: warning ─────────────────────────────────────────────────
    if (!row.dunning_warned_at && age >= WARN_AFTER_DAYS) {
      // Promise the later of "10 days from first failure" and "3 days from
      // now", so a customer entering the ladder late is never told about a
      // date that has already passed.
      const byAge = new Date(new Date(row.payment_failed_at).getTime() + SUSPEND_AFTER_DAYS * DAY_MS);
      const byWarning = new Date(Date.now() + SUSPEND_AFTER_WARNING_DAYS * DAY_MS);
      const holdDate = byAge > byWarning ? byAge : byWarning;

      const sent = await sendEmail({
        to: email,
        subject: 'Your BitLink line will be paused unless we can take payment',
        html: buildPastDueFinalWarningEmail({
          fullName,
          amountLabel: invoice.amountLabel,
          holdDateLabel: formatDate(holdDate),
          payUrl: invoice.payUrl,
        }),
      });

      if (sent) {
        await admin
          .from('subscribers')
          .update({ dunning_warned_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', row.id);
        result.warned += 1;
      }
      continue;
    }

    // ── Rung 1: notice ──────────────────────────────────────────────────
    if (!row.dunning_notified_at && age >= NOTIFY_AFTER_DAYS) {
      const sent = await sendEmail({
        to: email,
        subject: "Your BitLink payment didn't go through",
        html: buildPastDueEmail({
          fullName,
          amountLabel: invoice.amountLabel,
          dueDateLabel: formatDate(new Date(row.payment_failed_at)),
          payUrl: invoice.payUrl,
        }),
      });

      if (sent) {
        await admin
          .from('subscribers')
          .update({ dunning_notified_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', row.id);
        result.notified += 1;
      }
      continue;
    }

    result.skipped += 1;
  }

  return result;
}
