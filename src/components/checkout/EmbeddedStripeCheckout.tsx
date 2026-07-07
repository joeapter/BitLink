"use client";

import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { ArrowLeft } from "lucide-react";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

// In-page Stripe checkout — payment happens without leaving bitlink.co.il.
// Requires NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY; callers fall back to the
// hosted redirect when the API returns a url instead of a clientSecret.
export function EmbeddedStripeCheckout({
  clientSecret,
  onBack,
}: {
  clientSecret: string;
  onBack?: () => void;
}) {
  if (!stripePromise) return null;

  return (
    <div>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted-slate transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to order details
        </button>
      ) : null}
      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-soft">
        <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </div>
  );
}
