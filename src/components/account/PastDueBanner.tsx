import { AlertTriangle } from "lucide-react";
import { formatMoney } from "@/lib/utils";

/**
 * Shown to a customer whose renewal was declined and whose invoice is still
 * open.
 *
 * The portal could already fix this before we built anything — "Manage
 * billing" opens Stripe with payment-method update enabled. What it couldn't
 * do was tell anyone they needed to. A past-due customer saw an ordinary
 * billing page with a small "suspended" badge and no reason to click. This is
 * the missing urgency, and it links straight to the hosted invoice so paying
 * is one step rather than a hunt through the portal.
 *
 * Deliberately does not name the hold date. The day-7 email does that once
 * the ladder has actually reached that rung; a banner that threatens from day
 * one turns a routine declined card into a scare, and most declines clear on
 * Stripe's next retry.
 */
export function PastDueBanner({
  amountDueCents,
  payUrl,
  currency = "usd",
}: {
  amountDueCents: number;
  payUrl: string;
  currency?: string;
}) {
  return (
    <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-soft sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Payment didn&apos;t go through
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-red-950">
            {formatMoney(amountDueCents, currency.toUpperCase())} is outstanding
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-red-900">
            Your bank declined the last charge for your plan. Your line is still working — paying now keeps it
            that way. If the card itself is the problem, update it under Manage billing and we&apos;ll retry
            straight away.
          </p>
        </div>
        <a
          href={payUrl}
          className="shrink-0 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          Pay now
        </a>
      </div>
    </section>
  );
}
