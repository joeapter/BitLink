// POST /api/stripe/create-checkout-session
//
// Creates a Stripe subscription checkout session for a BitLink plan.
//
// Flow:
//   1. Validate request body
//   2. Look up plan + stripe_price_id from Supabase plans table (set by seed:stripe)
//   3. Find or create customer record (customers table, keyed by email)
//   4. Find or create Stripe customer (stripe_customers table → customers.stripe_customer_id → create new)
//   5. Create Stripe checkout session (subscription mode) with full metadata
//   6. Return { url } — client redirects to Stripe Hosted Checkout
//
// Metadata passed to Stripe (available in checkout.session.completed webhook):
//   plan_slug, customer_record_id, user_id, is_kosher, is_esim, source
//
// Idempotency:
//   Customer records are keyed by email (upsert pattern).
//   Stripe customers are reused via stripe_customers table lookup.
//   The checkout session itself is one-time and not idempotent — a new session
//   is always created. The webhook handler is idempotent on stripe_subscription_id.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getStripe, createCheckoutSession } from '@/lib/stripe/server';
import { isValidIsraeliMobile } from '@/lib/utils';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const log = logger.child({ route: 'stripe/create-checkout-session' });

const bodySchema = z.object({
  planSlug: z.string().min(1),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  isKosher: z.boolean().default(false),
  isEsim: z.boolean().default(false),
  isPortIn: z.boolean().default(false),
  portInNumber: z.string().nullable().optional(),
  skipActivationFee: z.boolean().default(false),
  wantsIntlNumber: z.boolean().default(false),
  intlNumberCountry: z.enum(['us', 'canada', 'uk']).optional(),
  intlNumberSource: z.enum(['new', 'port']).optional(),
  intlPortNumber: z.string().nullable().optional(),
  userId: z.string().uuid().nullable().optional(),
  referralCode: z.string().nullable().optional(),
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
});

function generateReferralCode(): string {
  return `BL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid checkout parameters', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    planSlug, fullName, email, phone, isKosher, isEsim,
    isPortIn, portInNumber, skipActivationFee,
    wantsIntlNumber, intlNumberCountry, intlNumberSource, intlPortNumber,
    userId, referralCode, successUrl, cancelUrl,
  } = parsed.data;

  // Reject malformed Israeli port-in numbers BEFORE payment — Annatel requires
  // a valid mobile number and 422s the provisioning request otherwise, which
  // strands a paid order in a failed state.
  if (isPortIn && (!portInNumber || !isValidIsraeliMobile(portInNumber))) {
    return NextResponse.json(
      { error: 'That does not look like a valid Israeli mobile number. Use the format 05x-xxx-xxxx.' },
      { status: 400 },
    );
  }

  // Filled server-side — never exposed to the client.
  const portInIdNumber = isPortIn
    ? (process.env.PORT_IN_DEFAULT_ID?.trim() ?? '341280188')
    : null;

  const admin = createSupabaseAdminClient();
  if (!admin) {
    log.error('Supabase admin client unavailable');
    return NextResponse.json({ error: 'Checkout temporarily unavailable' }, { status: 503 });
  }

  const stripe = getStripe();
  if (!stripe) {
    log.error('Stripe client unavailable — check STRIPE_SECRET_KEY');
    return NextResponse.json({ error: 'Checkout temporarily unavailable' }, { status: 503 });
  }

  // ── 1. Look up plan + stripe_price_id from DB ────────────────────────────
  const { data: planRow, error: planError } = await admin
    .from('plans')
    .select('id, slug, name, stripe_price_id, monthly_price_cents')
    .eq('slug', planSlug)
    .eq('active', true)
    .maybeSingle();

  if (planError || !planRow) {
    log.warn({ planSlug, error: planError?.message }, 'Plan not found');
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  if (!planRow.stripe_price_id) {
    log.error({ planSlug }, 'Plan is missing stripe_price_id — run: npm run seed:stripe');
    return NextResponse.json(
      { error: 'This plan is not yet available for checkout. Please contact support.' },
      { status: 503 },
    );
  }

  log.info({ planSlug, planId: planRow.id, priceId: planRow.stripe_price_id }, 'Checkout initiated');

  // ── 2. Find or create customer record ────────────────────────────────────
  let customerRecordId: string;
  {
    const { data: existing } = await admin
      .from('customers')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      await admin
        .from('customers')
        .update({
          full_name: fullName,
          phone,
          ...(userId ? { user_id: userId } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      customerRecordId = existing.id;
      log.info({ customerId: customerRecordId, email }, 'Existing customer record updated');
    } else {
      const { data: created, error: createError } = await admin
        .from('customers')
        .insert({
          full_name: fullName,
          email,
          phone,
          user_id: userId ?? null,
          referral_code: generateReferralCode(),
          referred_by: referralCode ?? null,
        })
        .select('id')
        .single();

      if (createError || !created) {
        log.error({ error: createError?.message, email }, 'Failed to create customer record');
        return NextResponse.json({ error: 'Checkout temporarily unavailable' }, { status: 503 });
      }

      customerRecordId = created.id;
      log.info({ customerId: customerRecordId, email }, 'Customer record created');
    }
  }

  // ── 3. Find or create Stripe customer ────────────────────────────────────
  // Lookup order: stripe_customers table → customers.stripe_customer_id → create new
  let stripeCustomerId: string;
  try {
    const { data: scRow } = await admin
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('customer_id', customerRecordId)
      .maybeSingle();

    if (scRow?.stripe_customer_id) {
      stripeCustomerId = scRow.stripe_customer_id;
      log.info({ stripeCustomerId, customerId: customerRecordId }, 'Reusing Stripe customer from stripe_customers table');
    } else {
      // Check legacy customers.stripe_customer_id
      const { data: customerRow } = await admin
        .from('customers')
        .select('stripe_customer_id')
        .eq('id', customerRecordId)
        .maybeSingle();

      if (customerRow?.stripe_customer_id) {
        stripeCustomerId = customerRow.stripe_customer_id;

        // Backfill stripe_customers so future lookups are fast
        await admin.from('stripe_customers').upsert(
          {
            customer_id: customerRecordId,
            stripe_customer_id: stripeCustomerId,
            stripe_email: email,
            livemode: false,
            synced_at: new Date().toISOString(),
          },
          { onConflict: 'stripe_customer_id', ignoreDuplicates: true },
        );
        log.info({ stripeCustomerId, customerId: customerRecordId }, 'Reusing Stripe customer from customers table (backfilled stripe_customers)');
      } else {
        // Create a new Stripe customer
        const stripeCustomer = await stripe.customers.create({
          email,
          name: fullName,
          phone: phone || undefined,
          metadata: {
            customer_record_id: customerRecordId,
            user_id: userId ?? '',
            source: 'bitlink_checkout',
          },
        });

        stripeCustomerId = stripeCustomer.id;

        await Promise.all([
          admin
            .from('customers')
            .update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() })
            .eq('id', customerRecordId),
          admin.from('stripe_customers').upsert(
            {
              customer_id: customerRecordId,
              stripe_customer_id: stripeCustomerId,
              stripe_email: email,
              livemode: stripeCustomer.livemode,
              synced_at: new Date().toISOString(),
            },
            { onConflict: 'stripe_customer_id', ignoreDuplicates: false },
          ),
        ]);

        log.info(
          { stripeCustomerId, customerId: customerRecordId, livemode: stripeCustomer.livemode },
          'Stripe customer created',
        );
      }
    }
  } catch (err) {
    log.error(
      { error: err instanceof Error ? err.message : String(err), customerId: customerRecordId, email },
      'Failed to find or create Stripe customer',
    );
    return NextResponse.json({ error: 'Checkout temporarily unavailable' }, { status: 503 });
  }

  // ── 4. Create Stripe checkout session ────────────────────────────────────
  let session: Awaited<ReturnType<typeof createCheckoutSession>>;
  try {
    session = await createCheckoutSession(stripe, {
      stripePriceId: planRow.stripe_price_id,
      activationFeePriceId: skipActivationFee ? null : (process.env.STRIPE_PRICE_ACTIVATION_FEE?.trim() ?? null),
      intlNumberAddonPriceId: wantsIntlNumber ? (process.env.STRIPE_PRICE_US_CANADA_ADDON?.trim() ?? null) : null,
      intlPortInFeeId: (wantsIntlNumber && intlNumberSource === 'port') ? (process.env.STRIPE_PRICE_INTL_PORT_IN_FEE?.trim() ?? null) : null,
      stripeCustomerId,
      planSlug,
      isKosher,
      isEsim,
      isPortIn,
      portInNumber: portInNumber ?? null,
      portInIdNumber,
      wantsIntlNumber,
      intlNumberCountry: intlNumberCountry ?? null,
      intlNumberSource: intlNumberSource ?? null,
      intlPortNumber: intlPortNumber ?? null,
      customerRecordId,
      userId: userId ?? null,
      successUrl,
      cancelUrl,
    });
  } catch (err) {
    log.error(
      {
        error: err instanceof Error ? err.message : String(err),
        planSlug,
        stripeCustomerId,
        customerId: customerRecordId,
      },
      'Failed to create Stripe checkout session',
    );
    return NextResponse.json({ error: 'Checkout temporarily unavailable' }, { status: 503 });
  }

  log.info(
    {
      sessionId: session.id,
      planSlug,
      stripeCustomerId,
      customerId: customerRecordId,
      isKosher,
      isEsim,
      userId: userId ?? null,
    },
    'Checkout session created — redirecting to Stripe',
  );

  return NextResponse.json({ url: session.url });
}
