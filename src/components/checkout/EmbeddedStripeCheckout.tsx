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
  bare = false,
}: {
  clientSecret: string;
  onBack?: () => void;
  // When true, renders just the Stripe embed with no card/border/back-link —
  // the caller supplies its own surrounding layout (see CheckoutForm.tsx,
  // which merges this into a single two-panel card with its own back button).
  bare?: boolean;
}) {
  if (!stripePromise) return null;

  const embed = (
    <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );

  if (bare) return embed;

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
      {/* Stripe's embedded form renders narrower than this column on wide
          screens — constrain + center so it reads as one intentional card
          instead of floating in extra whitespace. Visual-only: the provider/
          clientSecret wiring below is unchanged. */}
      <div className="mx-auto w-full max-w-[480px] overflow-hidden rounded-2xl border border-ink/10 shadow-soft">
        {embed}
      </div>
    </div>
  );
}
