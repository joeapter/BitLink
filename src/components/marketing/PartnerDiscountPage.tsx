import { ArrowRight, Sparkles } from "lucide-react";
import { ServiceLandingPage } from "@/components/marketing/ServiceLandingPage";
import { ButtonLink } from "@/components/ui/Button";
import { partnerPages } from "@/lib/partner-pages";
import { getPlan, type PlanSlug } from "@/lib/plans";
import { getPromo } from "@/lib/promos";
import { formatMoney } from "@/lib/utils";

const REGULAR_INTL_ADDON_CENTS = 999;
const ACTIVATION_FEE_CENTS = 1499;

// Shared layout for an unlisted partner discount page: a prominent
// "activation fee waived" hero featuring one plan at a promo-discounted rate,
// with the partner's normal marketing content below. Each page is reached via
// a direct link only (noindex, not in the sitemap); the promo code baked into
// the checkout link is what actually applies the discount server-side
// (src/lib/promos.ts). Org attribution comes from the page's slug being
// mapped in partner-org-codes.ts so middleware sets the bl_org cookie.
export function PartnerDiscountPage({
  partnerSlug,
  planSlug,
  promoCode,
  headline,
}: {
  partnerSlug: string;
  planSlug: PlanSlug;
  promoCode: string;
  headline: string;
}) {
  const promo = getPromo(promoCode);
  const plan = getPlan(planSlug);
  const partner = partnerPages[partnerSlug];
  const orgName = partner?.orgName ?? "our partner";
  const checkoutHref = `/checkout?plan=${planSlug}&promo=${promoCode}`;

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#eef5f8_100%)] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-soft-cyan/20 blur-3xl" />
        <div className="relative mx-auto max-w-4xl">
          {/* Prominent activation-fee-waived banner — the headline offer. */}
          <div className="flex items-center gap-4 rounded-3xl border-2 border-trust-green bg-trust-green/10 px-6 py-5 shadow-sm sm:px-8 sm:py-6">
            <Sparkles className="h-9 w-9 shrink-0 text-trust-green sm:h-10 sm:w-10" aria-hidden="true" />
            <div>
              <p className="text-2xl font-bold text-trust-green sm:text-3xl">Activation fee waived</p>
              <p className="mt-1 text-sm text-ink/70 sm:text-base">
                Free for {orgName} families through this link — a {formatMoney(ACTIVATION_FEE_CENTS)} saving, applied
                automatically at checkout.
              </p>
            </div>
          </div>

          <h1 className="mt-8 text-balance text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
            {headline}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-slate">
            This link is just for {orgName} parents. Choose the {plan.name} plan below and the{" "}
            {formatMoney(ACTIVATION_FEE_CENTS)} one-time activation fee is waived at checkout — nothing to enter, no
            code to remember.
          </p>

          <div className="mt-10 rounded-2xl border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
            <p className="text-sm font-semibold text-link-blue">{plan.tone}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-ink">{plan.name}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-slate">{plan.description}</p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-ink">{formatMoney(plan.priceCents, plan.currency)}</span>
              <span className="text-sm font-medium text-muted-slate">/mo</span>
            </div>
            <ButtonLink href={checkoutHref} size="lg" className="mt-6">
              Choose {plan.name} plan
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
            <a href={`/checkout?promo=${promoCode}`} className="font-semibold text-link-blue">
              full checkout
            </a>{" "}
            — the activation fee is waived no matter which plan you pick.
          </p>
        </div>
      </section>

      {partner ? <ServiceLandingPage content={partner.content} /> : null}
    </div>
  );
}
