// POST /api/trial/checkout
//
// Starts a free-trial signup: collects a card via a Stripe setup-mode session
// (saved, never charged) and finds/creates the customer record. Actual line
// provisioning happens once the setup session completes — see the
// checkout.session.completed handler in process-stripe-event.ts.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/server';
import { absoluteUrl } from '@/lib/utils';
import { isTrialOfferEnabled } from '@/lib/settings';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const log = logger.child({ route: 'trial/checkout' });

const bodySchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  // Affiliate / driver code carried in from ?ref= on the trial link. Stored raw
  // on the customer, exactly as the paid checkout does — no validation, so a
  // link works the moment it's handed out.
  referralCode: z.string().trim().max(64).optional(),
});

export async function POST(request: NextRequest): Promise<Response> {
  const enabled = await isTrialOfferEnabled();
  if (!enabled) {
    return NextResponse.json({ error: 'This offer is not currently available.' }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid signup details' }, { status: 400 });
  }
  const { fullName, email, phone } = parsed.data;
  const referralCode = parsed.data.referralCode?.toUpperCase() || null;

  const admin = createSupabaseAdminClient();
  const stripe = getStripe();
  if (!admin || !stripe) {
    log.error('Supabase admin client or Stripe unavailable');
    return NextResponse.json({ error: 'Signup temporarily unavailable' }, { status: 503 });
  }

  // Find or create customer record (mirrors create-checkout-session/route.ts).
  let customerRecordId: string;
  const { data: existing } = await admin
    .from('customers')
    .select('id, referred_by')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    await admin
      .from('customers')
      .update({
        full_name: fullName,
        phone,
        // Never overwrite an existing attribution — first referrer keeps the credit.
        ...(!existing.referred_by && referralCode ? { referred_by: referralCode } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    customerRecordId = existing.id as string;
  } else {
    const { data: created, error: createError } = await admin
      .from('customers')
      .insert({ full_name: fullName, email, phone, referred_by: referralCode })
      .select('id')
      .single();
    if (createError || !created) {
      log.error({ error: createError?.message, email }, 'Failed to create customer record for trial signup');
      return NextResponse.json({ error: 'Signup temporarily unavailable' }, { status: 503 });
    }
    customerRecordId = created.id as string;
  }

  // Find or create Stripe customer.
  let stripeCustomerId: string;
  const { data: scRow } = await admin
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('customer_id', customerRecordId)
    .maybeSingle();

  if (scRow?.stripe_customer_id) {
    stripeCustomerId = scRow.stripe_customer_id as string;
  } else {
    const stripeCustomer = await stripe.customers.create({
      email,
      name: fullName,
      phone: phone || undefined,
      metadata: { customer_record_id: customerRecordId, source: 'bitlink_trial' },
    });
    stripeCustomerId = stripeCustomer.id;
    await Promise.all([
      admin.from('customers').update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() }).eq('id', customerRecordId),
      admin.from('stripe_customers').upsert(
        { customer_id: customerRecordId, stripe_customer_id: stripeCustomerId, stripe_email: email, livemode: stripeCustomer.livemode, synced_at: new Date().toISOString() },
        { onConflict: 'stripe_customer_id', ignoreDuplicates: false },
      ),
    ]);
  }

  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      success_url: absoluteUrl('/trial/success'),
      cancel_url: absoluteUrl('/trial'),
      metadata: {
        source: 'bitlink_trial',
        customer_record_id: customerRecordId,
      },
    });
  } catch (err) {
    log.error({ error: err instanceof Error ? err.message : String(err), customerRecordId }, 'Failed to create trial setup session');
    return NextResponse.json({ error: 'Signup temporarily unavailable' }, { status: 503 });
  }

  return NextResponse.json({ url: session.url });
}
