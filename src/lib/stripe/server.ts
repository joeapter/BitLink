import Stripe from "stripe";
import { absoluteUrl } from "@/lib/utils";
import { getStripePriceId, type BitLinkPlan } from "@/lib/plans";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;

  return new Stripe(key, {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  });
}

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
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  const price = getStripePriceId(input.plan);
  if (!price) {
    throw new Error(`Missing ${input.plan.stripeEnvKey}. Add the Stripe recurring price ID before checkout.`);
  }

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer: input.customerId,
    customer_email: input.customerId ? undefined : input.email,
    line_items: [{ price, quantity: 1 }],
    success_url: absoluteUrl(`/checkout/success?session_id={CHECKOUT_SESSION_ID}`),
    cancel_url: absoluteUrl(`/checkout/cancel?plan=${input.plan.slug}`),
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    phone_number_collection: { enabled: true },
    metadata: {
      plan_slug: input.plan.slug,
      full_name: input.fullName,
      phone: input.phone ?? "",
      referral_code: input.referralCode ?? "",
      source: "bitlink_web",
      ...input.metadata,
    },
    subscription_data: {
      metadata: {
        plan_slug: input.plan.slug,
        source: "bitlink_web",
      },
    },
  });
}
