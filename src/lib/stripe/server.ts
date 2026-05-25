// Stripe server-side helpers.
//
// getStripe()             — nullable factory, used where Stripe absence is non-fatal
// createCheckoutSession() — creates a subscription checkout session with all BitLink metadata
//
// The singleton client for webhook handling lives in src/lib/stripe/client.ts.

import Stripe from 'stripe';
import { absoluteUrl } from '@/lib/utils';
import { getStripePriceId, type BitLinkPlan } from '@/lib/plans';

// Nullable factory — returns null if STRIPE_SECRET_KEY is absent (safe for pages/routes
// that check the return value before proceeding).
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2026-04-22.dahlia', typescript: true });
}

// ── Checkout session ──────────────────────────────────────────────────────────

export interface CreateCheckoutSessionParams {
  stripePriceId: string;
  stripeCustomerId: string;
  planSlug: string;
  isKosher: boolean;
  isEsim: boolean;
  customerRecordId: string | null;
  userId: string | null;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Creates a Stripe subscription checkout session for a BitLink plan.
 *
 * Metadata is written to both the session and subscription_data so it's
 * available in checkout.session.completed AND customer.subscription.* events.
 *
 * Metadata keys:
 *   plan_slug           — BitLink plan identifier
 *   customer_record_id  — Supabase customers.id
 *   user_id             — Supabase auth user id (empty string if unauthenticated)
 *   is_kosher           — '1' | '0'
 *   is_esim             — '1' | '0'
 *   source              — 'bitlink_web'
 */
export async function createCheckoutSession(
  stripe: Stripe,
  params: CreateCheckoutSessionParams,
): Promise<Stripe.Response<Stripe.Checkout.Session>> {
  const sharedMetadata = {
    plan_slug: params.planSlug,
    customer_record_id: params.customerRecordId ?? '',
    user_id: params.userId ?? '',
    is_kosher: params.isKosher ? '1' : '0',
    is_esim: params.isEsim ? '1' : '0',
    source: 'bitlink_web',
  };

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: params.stripeCustomerId,
    line_items: [{ price: params.stripePriceId, quantity: 1 }],
    success_url:
      params.successUrl ??
      absoluteUrl(`/checkout/success?session_id={CHECKOUT_SESSION_ID}`),
    cancel_url:
      params.cancelUrl ??
      absoluteUrl(`/checkout/cancel?plan=${params.planSlug}`),
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    phone_number_collection: { enabled: true },
    metadata: sharedMetadata,
    subscription_data: {
      metadata: sharedMetadata,
    },
  });
}

// ── Legacy helper — kept for backward compatibility ───────────────────────────
// Used by pre-Inngest checkout flow. Do not call from new code.

export async function createBitLinkCheckoutSession(input: {
  plan: BitLinkPlan;
  email: string;
  fullName: string;
  phone?: string;
  referralCode?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}) {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error('STRIPE_SECRET_KEY is not configured.');
  }

  const price = getStripePriceId(input.plan);
  if (!price) {
    throw new Error(`Missing ${input.plan.stripeEnvKey}. Add the Stripe recurring price ID before checkout.`);
  }

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: input.customerId,
    customer_email: input.customerId ? undefined : input.email,
    line_items: [{ price, quantity: 1 }],
    success_url: absoluteUrl(`/checkout/success?session_id={CHECKOUT_SESSION_ID}`),
    cancel_url: absoluteUrl(`/checkout/cancel?plan=${input.plan.slug}`),
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    phone_number_collection: { enabled: true },
    metadata: {
      plan_slug: input.plan.slug,
      full_name: input.fullName,
      phone: input.phone ?? '',
      referral_code: input.referralCode ?? '',
      source: 'bitlink_web',
      ...input.metadata,
    },
    subscription_data: {
      metadata: {
        plan_slug: input.plan.slug,
        source: 'bitlink_web',
      },
    },
  });
}
