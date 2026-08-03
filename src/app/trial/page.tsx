import type { Metadata } from "next";
import Link from "next/link";
import { TrialSignupForm } from "@/components/checkout/TrialSignupForm";
import { isTrialOfferEnabled } from "@/lib/settings";
import { getPlan } from "@/lib/plans";
import { TRIAL_AUTO_CONTINUE_PLAN } from "@/lib/trial-offer";
import { formatMoney } from "@/lib/utils";
import { createNoIndexMetadata } from "@/lib/seo";

const autoContinuePlan = getPlan(TRIAL_AUTO_CONTINUE_PLAN);

export const metadata: Metadata = createNoIndexMetadata(
  "Free Trial — Israeli eSIM",
  "Start your real Israeli eSIM line free for a month, 11GB included.",
);
export const dynamic = "force-dynamic";

export default async function TrialPage() {
  const enabled = await isTrialOfferEnabled();

  if (!enabled) {
    return (
      <section className="liquid-bg bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative z-10 mx-auto max-w-xl rounded-4xl border border-ink/10 bg-white p-8 text-center shadow-soft">
          <h1 className="text-2xl font-semibold text-ink">This offer isn&apos;t open right now</h1>
          <p className="mt-3 text-sm leading-6 text-muted-slate">
            Check out our regular plans instead — no contract, from $14.99/month.
          </p>
          <Link
            href="/plans"
            className="mt-6 inline-block rounded-full bg-link-blue px-6 py-3 text-sm font-semibold text-white"
          >
            View plans
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="liquid-bg bg-slate-50 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="relative z-10 mx-auto max-w-3xl">
        <p className="text-sm font-semibold text-link-blue">Free trial</p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
          Your real Israeli eSIM line, free for a month
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-slate">
          A real 05 Israeli number and 11GB of data, live in minutes, no charge for your first month.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-slate">
          One thing to know upfront: at the end of the month you can pick any plan you want, or do nothing and
          we&apos;ll automatically continue your line on our {autoContinuePlan.name} plan (
          {formatMoney(autoContinuePlan.priceCents, autoContinuePlan.currency)}/month), charged to the card you give
          us today. We&apos;ll email you twice before that happens, with an easy one-click way to cancel instead if
          it&apos;s not for you.
        </p>
        <div className="mt-8">
          <TrialSignupForm />
        </div>
        <div className="mt-4 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
          This is a real Israeli line, not a travel eSIM — it only works once you&apos;re actually in Israel. You can
          install it before you fly, but it won&apos;t receive calls, texts, or data until you land.
        </div>
      </div>
    </section>
  );
}
