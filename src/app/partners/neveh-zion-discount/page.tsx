import type { Metadata } from "next";
import { ArrowRight, Sparkles } from "lucide-react";
import { ServiceLandingPage } from "@/components/marketing/ServiceLandingPage";
import { ButtonLink } from "@/components/ui/Button";
import { partnerPages } from "@/lib/partner-pages";
import { getPlan } from "@/lib/plans";
import { getPromo } from "@/lib/promos";
import { formatMoney } from "@/lib/utils";
import { createNoIndexMetadata } from "@/lib/seo";

// Unlisted discount page for Neveh Zion parents — not in the sitemap, not
// linked from the regular partner page, not indexed. Handed out directly
// (WhatsApp, email) by Joe. Same org attribution as /partners/neveh-zion
// (middleware sets bl_org from partner-org-codes.ts), plus the "neveh-discount"
// promo code baked into the checkout link, which is what actually waives the
// activation fee and discounts the add-on server-side (src/lib/promos.ts).

export const metadata: Metadata = createNoIndexMetadata(
  "A Discount for Neveh Zion Families",
  "Activation fee waived and a discounted US/Canada/UK add-on line for Neveh Zion parents.",
);

const PROMO_CODE = "neveh-discount";
const STUDENT_PLAN_SLUG = "student-5g";
const REGULAR_INTL_ADDON_CENTS = 999;

export default function NevehZionDiscountPage() {
  const promo = getPromo(PROMO_CODE);
  const studentPlan = getPlan(STUDENT_PLAN_SLUG);
  const nevehZion = partnerPages["neveh-zion"];
  const checkoutHref = `/checkout?plan=${STUDENT_PLAN_SLUG}&promo=${PROMO_CODE}`;

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#eef5f8_100%)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-soft-cyan/20 blur-3xl" />
        <div className="relative mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-trust-green/30 bg-trust-green/10 px-4 py-1.5 text-sm font-semibold text-trust-green">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Activation fee waived for Neveh Zion families
          </div>
          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
            A phone, set up before he flies — activation fee on us.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-slate">
            This link is just for Neveh Zion parents. Choose the Student plan below and the {formatMoney(1499)} one-time
            activation fee is automatically waived at checkout — nothing to enter, no code to remember.
          </p>

          <div className="mt-10 rounded-2xl border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
            <p className="text-sm font-semibold text-link-blue">{studentPlan.tone}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-ink">{studentPlan.name}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-slate">{studentPlan.description}</p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-ink">{formatMoney(studentPlan.priceCents, studentPlan.currency)}</span>
              <span className="text-sm font-medium text-muted-slate">/mo</span>
            </div>
            <ButtonLink href={checkoutHref} size="lg" className="mt-6">
              Choose Student plan
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>

            {promo?.intlAddonPriceCents != null && (
              <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-ink/10 bg-[#f8fbfc] p-4">
                <div>
                  <p className="text-sm font-semibold text-ink">US, Canadian, or UK add-on line</p>
                  <p className="text-xs text-muted-slate">Add it during checkout — the discount applies automatically.</p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-sm text-muted-slate line-through opacity-60">
                    {formatMoney(REGULAR_INTL_ADDON_CENTS)}/mo
                  </span>
                  <span className="text-lg font-semibold text-link-blue">
                    {formatMoney(promo.intlAddonPriceCents)}/mo
                  </span>
                </div>
              </div>
            )}
          </div>

          <p className="mt-6 text-sm text-muted-slate">
            Looking for a different plan? See the{" "}
            <a href={`/checkout?promo=${PROMO_CODE}`} className="font-semibold text-link-blue">
              full checkout
            </a>{" "}
            — the activation fee is waived no matter which plan you pick.
          </p>
        </div>
      </section>

      {nevehZion ? <ServiceLandingPage content={nevehZion.content} /> : null}
    </div>
  );
}
