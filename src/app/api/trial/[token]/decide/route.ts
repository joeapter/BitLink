// POST /api/trial/[token]/decide
//
// Converts a trial into a real paid plan: creates a real Stripe subscription
// off-session on the card saved at trial signup (no new checkout needed),
// links it to the existing trial line, and marks the trial converted.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/server';
import { getPlan, isActivationFeeWaivedForPlan } from '@/lib/plans';
import { createSubscriber, updateSubscriber } from '@/lib/db/subscribers';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const log = logger.child({ route: 'trial/decide' });

const bodySchema = z.object({
  planSlug: z.enum(['basic', 'student-5g', 'max-5g']),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }): Promise<Response> {
  const { token } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Pick a valid plan.' }, { status: 400 });
  }
  const { planSlug } = parsed.data;

  const admin = createSupabaseAdminClient();
  const stripe = getStripe();
  if (!admin || !stripe) {
    return NextResponse.json({ error: 'Temporarily unavailable, please try again shortly.' }, { status: 503 });
  }

  const { data: trial } = await admin
    .from('trial_lines')
    .select('id, status, telecom_line_id, customer_id, stripe_customer_id')
    .eq('token', token)
    .maybeSingle();

  if (!trial) {
    return NextResponse.json({ error: 'Trial not found.' }, { status: 404 });
  }
  if (trial.status !== 'active') {
    return NextResponse.json({ error: 'This trial is no longer open for a decision.' }, { status: 409 });
  }
  if (!trial.telecom_line_id) {
    return NextResponse.json({ error: 'Your line is still being set up — try again in a moment.' }, { status: 409 });
  }

  const { data: planRow } = await admin
    .from('plans')
    .select('stripe_price_id')
    .eq('slug', planSlug)
    .eq('active', true)
    .maybeSingle();
  if (!planRow?.stripe_price_id) {
    return NextResponse.json({ error: 'That plan is not available right now.' }, { status: 503 });
  }

  const skipActivationFee = isActivationFeeWaivedForPlan(planSlug);
  const items: { price: string }[] = [{ price: planRow.stripe_price_id as string }];
  const activationFeePriceId = process.env.STRIPE_PRICE_ACTIVATION_FEE?.trim();
  if (!skipActivationFee && activationFeePriceId) {
    items.push({ price: activationFeePriceId });
  }

  let subscription: Awaited<ReturnType<typeof stripe.subscriptions.create>>;
  try {
    subscription = await stripe.subscriptions.create({
      customer: trial.stripe_customer_id as string,
      items,
      off_session: true,
      payment_behavior: 'error_if_incomplete',
      metadata: {
        plan_slug: planSlug,
        customer_record_id: trial.customer_id as string,
        source: 'bitlink_trial_conversion',
      },
    });
  } catch (err) {
    log.error(
      { error: err instanceof Error ? err.message : String(err), token, planSlug },
      'Off-session trial conversion charge failed',
    );
    return NextResponse.json(
      { error: 'Your card on file was declined. Message us on WhatsApp and we’ll help you sort it out.' },
      { status: 402 },
    );
  }

  const plan = getPlan(planSlug);
  const subscriber = await createSubscriber(admin, {
    customerId: trial.customer_id as string,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: trial.stripe_customer_id as string,
    planSlug,
    monthlyPriceCents: plan.priceCents,
    status: 'active',
  });
  await updateSubscriber(admin, subscriber.id, {
    telecomLineId: trial.telecom_line_id as string,
    activatedAt: new Date().toISOString(),
  });

  const now = new Date().toISOString();
  await admin
    .from('telecom_lines')
    .update({ external_id: `stripe_sub_${subscription.id}`, updated_at: now })
    .eq('id', trial.telecom_line_id);
  await admin.from('trial_lines').update({ status: 'converted', decided_at: now, updated_at: now }).eq('id', trial.id);

  log.info({ token, planSlug, subscriptionId: subscription.id }, 'Trial converted to paid plan');

  return NextResponse.json({ converted: true });
}
