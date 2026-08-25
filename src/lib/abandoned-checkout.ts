// Abandoned-checkout recovery for customers who reached payment and stopped.
//
// A cron (every 2h, see inngest/functions/abandoned-checkout-recovery.ts)
// lists still-open Stripe Checkout sessions 2+ hours old, filters to plain
// public-site signups on a recovery-eligible plan, and for each one not
// already recorded:
//   1. Inserts an `abandoned_checkouts` row (unique on session id — this is
//      the dedup guard against double-processing on cron overlap).
//   2. Emails a recovery link to /recover/[token] with the activation fee
//      waived for 24h — on the plans that actually charge one. Student 5G and
//      Max 5G already waive it for everybody, so their email states that as a
//      plan feature rather than inventing a concession.
//
// The recovery landing page lets the customer change anything (plan, SIM
// type, etc.) before paying — this only decides who gets emailed and
// carries the fee waiver, not what they end up buying.

import crypto from 'crypto';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/send';
import { buildAbandonedCheckoutRecoveryEmail } from '@/lib/email/templates';
import { plans, isActivationFeeWaivedForPlan } from '@/lib/plans';
import { absoluteUrl } from '@/lib/utils';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'abandoned-checkout' });

// Kosher plans are deliberately excluded for now: Kosher+ already carries the
// 3-month intro price, so what a recovery offer should be there is a pricing
// decision that hasn't been made yet.
const RECOVERY_ELIGIBLE_PLANS: readonly string[] = ['basic', 'student-5g', 'max-5g'];
const MIN_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours
// Wide enough to never miss a session between cron runs (every 2h), narrow
// enough to not keep re-scanning sessions from days ago.
const LOOKBACK_MS = 6 * 60 * 60 * 1000; // 6 hours
const OFFER_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

function buildToken(): string {
  return crypto.randomUUID().replaceAll('-', '');
}

function isEligibleSession(session: Stripe.Checkout.Session): boolean {
  return (
    session.mode === 'subscription' &&
    session.status === 'open' &&
    session.metadata?.source === 'bitlink_web' &&
    RECOVERY_ELIGIBLE_PLANS.includes(session.metadata?.plan_slug ?? '') &&
    Boolean(session.metadata?.customer_record_id)
  );
}

export async function processAbandonedCheckoutRecovery(): Promise<{
  scanned: number;
  eligible: number;
  emailed: number;
  skipped: number;
}> {
  const stripe = getStripe();
  const admin = createSupabaseAdminClient();
  if (!stripe || !admin) {
    log.warn('Stripe or Supabase admin client unavailable — skipping run');
    return { scanned: 0, eligible: 0, emailed: 0, skipped: 0 };
  }

  const now = Date.now();
  const createdLte = Math.floor((now - MIN_AGE_MS) / 1000);
  const createdGte = Math.floor((now - LOOKBACK_MS) / 1000);

  const sessions = await stripe.checkout.sessions.list({
    status: 'open',
    created: { gte: createdGte, lte: createdLte },
    limit: 100,
  });

  const eligible = sessions.data.filter(isEligibleSession);
  let emailed = 0;
  let skipped = 0;

  for (const session of eligible) {
    const customerRecordId = session.metadata!.customer_record_id!;
    const planSlug = session.metadata!.plan_slug!;
    const isEsim = session.metadata?.is_esim === '1';
    const token = buildToken();
    const expiresAt = new Date(now + OFFER_WINDOW_MS).toISOString();

    const { data: inserted, error: insertError } = await admin
      .from('abandoned_checkouts')
      .insert({
        token,
        customer_id: customerRecordId,
        stripe_checkout_session_id: session.id,
        plan_slug: planSlug,
        is_esim: isEsim,
        expires_at: expiresAt,
      })
      .select('id')
      .maybeSingle();

    if (insertError || !inserted) {
      // Unique violation on stripe_checkout_session_id = already processed
      // by an earlier/overlapping run. Anything else, log and move on.
      if (insertError && insertError.code !== '23505') {
        log.error({ error: insertError.message, sessionId: session.id }, 'Failed to record abandoned checkout');
      }
      skipped += 1;
      continue;
    }

    const { data: customer } = await admin
      .from('customers')
      .select('full_name, email')
      .eq('id', customerRecordId)
      .maybeSingle();

    if (!customer?.email) {
      log.warn({ customerId: customerRecordId, sessionId: session.id }, 'No customer email — cannot send recovery email');
      continue;
    }

    const planName = plans.find((p) => p.slug === planSlug)?.name ?? planSlug;
    const recoverUrl = absoluteUrl(`/recover/${token}`);
    // Student 5G and Max 5G never charge the fee, so there's nothing to waive
    // for them — the subject and body say so as a plan feature instead of
    // dangling an offer that wouldn't change their total.
    const feeAlreadyWaived = isActivationFeeWaivedForPlan(planSlug);

    const sent = await sendEmail({
      to: customer.email,
      subject: feeAlreadyWaived
        ? `Your Israeli number is waiting — no activation fee on ${planName}`
        : "Your Israeli number is waiting — activation fee's on us for 24 hours",
      html: buildAbandonedCheckoutRecoveryEmail({
        fullName: customer.full_name ?? '',
        planName,
        recoverUrl,
        feeAlreadyWaived,
      }),
    });

    if (sent) {
      emailed += 1;
      await admin
        .from('abandoned_checkouts')
        .update({ email_sent_at: new Date().toISOString() })
        .eq('token', token);
    }
  }

  log.info(
    { scanned: sessions.data.length, eligible: eligible.length, emailed, skipped },
    'Abandoned checkout recovery run complete',
  );

  return { scanned: sessions.data.length, eligible: eligible.length, emailed, skipped };
}
