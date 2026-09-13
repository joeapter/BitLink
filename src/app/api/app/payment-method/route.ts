import type { NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getStripeClient } from '@/lib/stripe/client';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// The card the app shows on the top-up confirmation sheet.
//
// This deliberately mirrors how the charge actually resolves rather than
// picking "a" card off the customer. grantTopup() bills a one-time topup by
// creating an invoice on the *customer* with collection_method
// 'charge_automatically' (see chargeOneTimeInvoice), which Stripe pays with
// invoice_settings.default_payment_method and falls back to default_source.
// Showing anything else — the subscription's payment method, or the first card
// on file — would name a card that isn't the one billed.
//
// The Stripe customer is resolved per line, through the subscriber row for
// that telecom_line_id, because that is the id the charge itself uses. A
// customer with two lines can legitimately have them on different Stripe
// customers.

const log = logger.child({ route: 'api/app/payment-method' });

type CardSummary = { brand: string; last4: string; expMonth: number | null; expYear: number | null };

function cardFrom(source: Stripe.PaymentMethod | Stripe.CustomerSource | null): CardSummary | null {
  if (!source || typeof source === 'string') return null;

  if ('type' in source && source.type === 'card' && source.card) {
    // brand/last4 are optional in the Stripe types; without them there is
    // nothing worth showing, so fall through rather than render "undefined".
    if (!source.card.brand || !source.card.last4) return null;
    return {
      brand: source.card.brand,
      last4: source.card.last4,
      expMonth: source.card.exp_month ?? null,
      expYear: source.card.exp_year ?? null,
    };
  }
  // Legacy card sources still bill fine, so they must still be displayable.
  if ('object' in source && source.object === 'card') {
    const card = source as Stripe.Card;
    if (!card.brand || !card.last4) return null;
    return {
      brand: card.brand,
      last4: card.last4,
      expMonth: card.exp_month ?? null,
      expYear: card.exp_year ?? null,
    };
  }
  return null;
}

export async function GET(request: NextRequest): Promise<Response> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return Response.json({ error: 'Unavailable.' }, { status: 503 });
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return Response.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(token);
  if (authError || !user) {
    return Response.json({ error: 'Please sign in again.' }, { status: 401 });
  }

  const lineId = request.nextUrl.searchParams.get('lineId') ?? '';
  if (!lineId) {
    return Response.json({ error: 'Missing line.' }, { status: 400 });
  }

  // Same ownership rule as the purchase: resolved from the verified token, and
  // the line must belong to this login's customer record.
  const { data: customer } = await admin
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!customer) {
    return Response.json({ error: "We couldn't find your BitLink account." }, { status: 404 });
  }

  const { data: line } = await admin
    .from('telecom_lines')
    .select('id')
    .eq('id', lineId)
    .eq('customer_id', customer.id)
    .maybeSingle();
  if (!line) {
    return Response.json({ error: "We couldn't find that line on your account." }, { status: 404 });
  }

  const { data: subscriber } = await admin
    .from('subscribers')
    .select('stripe_customer_id')
    .eq('telecom_line_id', lineId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const stripeCustomerId = subscriber?.stripe_customer_id as string | null | undefined;
  if (!stripeCustomerId) {
    // No billing record yet — the app should say "no card on file" rather than
    // pretend, because a purchase would fail for exactly this reason.
    return Response.json({ card: null });
  }

  try {
    const stripe = getStripeClient();
    const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId, {
      expand: ['invoice_settings.default_payment_method', 'default_source'],
    });

    if (stripeCustomer.deleted) {
      return Response.json({ card: null });
    }

    const card =
      cardFrom(
        (stripeCustomer.invoice_settings?.default_payment_method as Stripe.PaymentMethod | null) ??
          null,
      ) ?? cardFrom((stripeCustomer.default_source as Stripe.CustomerSource | null) ?? null);

    return Response.json({ card });
  } catch (error) {
    log.warn(
      { userId: user.id, lineId, error: error instanceof Error ? error.message : String(error) },
      'Could not read payment method',
    );
    // Not fatal: the sheet simply shows no card rather than blocking a purchase
    // that might still succeed.
    return Response.json({ card: null });
  }
}
