import { ShieldCheck, Sparkles, Phone, Clock } from "lucide-react";
import type { BitLinkPlan } from "@/lib/plans";
import { formatMoney } from "@/lib/utils";

const ACTIVATION_FEE_CENTS = 1499;
const INTL_NUMBER_ADDON_CENTS = 999;
const INTL_PORT_IN_FEE_CENTS = 4999;

export function CheckoutSummary({
  plan,
  isPortIn = false,
  feeWaived = false,
  launchWaiver = false,
  hasIntlNumber = false,
  intlIsPortIn = false,
  intlPortDeferred = false,
  intlAddonPriceCentsOverride = null,
  intlNumberIncluded = false,
  introPriceCents = null,
  introMonths = 0,
  bundleLabel = null,
  intlCountryLabel = null,
}: {
  plan: BitLinkPlan;
  isPortIn?: boolean;
  feeWaived?: boolean;
  // The waiver is our limited-time launch offer (vs. a staff/promo waiver) —
  // show the urgency caption.
  launchWaiver?: boolean;
  hasIntlNumber?: boolean;
  intlIsPortIn?: boolean;
  // Foreign-number port billing deferred to when we run the port — its charges
  // are not due today.
  intlPortDeferred?: boolean;
  intlAddonPriceCentsOverride?: number | null;
  /** Plan bundles the international number — show it as included, not billed. */
  intlNumberIncluded?: boolean;
  /** Monthly price for the first `introMonths` months, when a promo applies. */
  introPriceCents?: number | null;
  introMonths?: number;
  /**
   * Present the plan and the international number as a single bundle line
   * under this name, instead of a plan price plus a discounted add-on.
   */
  bundleLabel?: string | null;
  /**
   * Display name of the country the customer actually chose ("US", "UK",
   * "Canadian"). The bundle title follows the live selection rather than the
   * country the offer link happened to preselect.
   */
  intlCountryLabel?: string | null;
}) {
  // A deferred foreign-number port has nothing due today — neither the monthly
  // add-on nor the one-time fee is charged at checkout.
  const showIntlAddonNow = hasIntlNumber && !intlPortDeferred && !intlNumberIncluded;

  // Only collapse into one figure when the add-on is actually being billed
  // monthly at a fixed price today. A port-in (deferred or not) carries its own
  // timing and one-time fee, and an intro-priced plan already has two figures
  // to explain — in those cases the itemised view is the honest one.
  const bundled =
    bundleLabel != null &&
    showIntlAddonNow &&
    !intlIsPortIn &&
    intlAddonPriceCentsOverride != null &&
    introPriceCents == null;

  // Derived, never written down, so the bundle total cannot drift away from
  // the prices it is made of.
  const bundleTotalCents = plan.priceCents + (intlAddonPriceCentsOverride ?? 0);
  const bundleRegularCents = plan.priceCents + INTL_NUMBER_ADDON_CENTS;
  const bundleTitle = intlCountryLabel
    ? `${plan.name} + ${intlCountryLabel} number`
    : bundleLabel;

  return (
    <aside className="rounded-4xl border border-ink/10 bg-ink p-6 text-white shadow-liquid">
      <p className="text-sm font-semibold text-soft-cyan">{bundled ? "Bundle" : "Monthly plan"}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-normal">
        {bundled ? bundleTitle : plan.name}
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-200">
        {bundled
          ? `The ${plan.name} plan and your ${intlCountryLabel ?? "international"} number on one line, billed as a single monthly price.`
          : plan.description}
      </p>

      <div className="mt-8 rounded-3xl border border-white/12 bg-white/10 p-5">
        <div className="flex items-end justify-between gap-4">
          <span className="text-sm text-slate-300">Due monthly</span>
          {bundled ? (
            <span className="text-right">
              <span className="block text-4xl font-semibold">
                {formatMoney(bundleTotalCents, plan.currency)}
                <span className="text-base font-medium text-slate-300">/mo</span>
              </span>
              <span className="mt-1 block text-xs text-slate-300">
                <span className="text-slate-400 line-through opacity-60">
                  {formatMoney(bundleRegularCents, plan.currency)}
                </span>{" "}
                bought separately
              </span>
            </span>
          ) : introPriceCents != null ? (
            <span className="text-right">
              <span className="block text-4xl font-semibold">
                {formatMoney(introPriceCents, plan.currency)}
                <span className="text-base font-medium text-slate-300">/mo</span>
              </span>
              <span className="mt-1 block text-xs text-slate-300">
                for {introMonths} months, then {formatMoney(plan.priceCents, plan.currency)}/mo
              </span>
            </span>
          ) : (
            <span className="text-4xl font-semibold">
              {formatMoney(plan.priceCents, plan.currency)}
              <span className="text-base font-medium text-slate-300">/mo</span>
            </span>
          )}
        </div>
        <div className="mt-3 border-t border-white/10 pt-3 flex items-center justify-between gap-4">
          <span className="text-sm text-slate-300">One-time activation fee</span>
          {feeWaived ? (
            <span className="flex items-center gap-2 text-lg font-semibold">
              <span className="text-slate-400 line-through opacity-60">
                {formatMoney(ACTIVATION_FEE_CENTS, plan.currency)}
              </span>
              <span className="text-trust-green text-sm">FREE</span>
            </span>
          ) : (
            <span className="text-lg font-semibold">
              {formatMoney(ACTIVATION_FEE_CENTS, plan.currency)}
            </span>
          )}
        </div>
        {feeWaived && launchWaiver && (
          <p className="mt-1 text-right text-xs font-medium text-soft-cyan">Limited-time discount</p>
        )}
        {bundled && (
          <div className="mt-3 border-t border-white/10 pt-3 flex items-center justify-between gap-4">
            <span className="text-sm text-slate-300">
              {intlCountryLabel ?? "International"} number
            </span>
            <span className="text-sm font-semibold text-trust-green">Included</span>
          </div>
        )}
        {showIntlAddonNow && !bundled && (
          <div className="mt-3 border-t border-white/10 pt-3 flex items-center justify-between gap-4">
            <span className="text-sm text-slate-300">US/Canada/UK number add-on</span>
            {intlAddonPriceCentsOverride != null ? (
              <span className="flex items-center gap-2">
                <span className="text-sm text-slate-400 line-through opacity-60">
                  {formatMoney(INTL_NUMBER_ADDON_CENTS, plan.currency)}
                </span>
                <span className="text-lg font-semibold">
                  +{formatMoney(intlAddonPriceCentsOverride, plan.currency)}
                  <span className="text-base font-medium text-slate-300">/mo</span>
                </span>
              </span>
            ) : (
              <span className="text-lg font-semibold">
                +{formatMoney(INTL_NUMBER_ADDON_CENTS, plan.currency)}
                <span className="text-base font-medium text-slate-300">/mo</span>
              </span>
            )}
          </div>
        )}
        {hasIntlNumber && intlNumberIncluded && (
          <div className="mt-3 border-t border-white/10 pt-3 flex items-center justify-between gap-4">
            <span className="text-sm text-slate-300">US/Canada/UK number</span>
            <span className="flex items-center gap-2">
              <span className="text-sm text-slate-400 line-through opacity-60">
                {formatMoney(INTL_NUMBER_ADDON_CENTS, plan.currency)}
              </span>
              <span className="text-sm font-semibold text-trust-green">Included</span>
            </span>
          </div>
        )}
        {hasIntlNumber && intlIsPortIn && !intlPortDeferred && (
          <div className="mt-3 border-t border-white/10 pt-3 flex items-center justify-between gap-4">
            <span className="text-sm text-slate-300">Number port-in fee (one-time)</span>
            <span className="text-lg font-semibold">
              {formatMoney(INTL_PORT_IN_FEE_CENTS, plan.currency)}
            </span>
          </div>
        )}
        {hasIntlNumber && intlIsPortIn && intlPortDeferred && (
          <div className="mt-3 border-t border-white/10 pt-3">
            <p className="text-sm font-semibold text-soft-cyan">US/Canada/UK number — set up later</p>
            <p className="mt-1 text-xs text-slate-300">
              Nothing charged today. When you&rsquo;re ready to port, we add the number
              (+{formatMoney(INTL_NUMBER_ADDON_CENTS, plan.currency)}/mo) and a one-time{" "}
              {formatMoney(INTL_PORT_IN_FEE_CENTS, plan.currency)} port fee.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-3 text-sm text-slate-200">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-soft-cyan" aria-hidden="true" />
          <span>Secure checkout protects your payment details.</span>
        </div>
        <div className="flex gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-trust-green" aria-hidden="true" />
          <span>BitLink prepares your connection after payment is confirmed.</span>
        </div>
        {isPortIn && (
          <div className="flex gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
            <span>Your current number stays active throughout the porting process.</span>
          </div>
        )}
        {hasIntlNumber && !intlIsPortIn && (
          <div className="flex gap-3">
            <Phone className="mt-0.5 h-5 w-5 shrink-0 text-soft-cyan" aria-hidden="true" />
            <span>Your US/Canada/UK number is set up alongside your Israeli line.</span>
          </div>
        )}
        {hasIntlNumber && intlIsPortIn && !intlPortDeferred && (
          <div className="flex gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
            <span>International number ports are processed manually and typically take 3–5 business days.</span>
          </div>
        )}
        {hasIntlNumber && intlIsPortIn && intlPortDeferred && (
          <div className="flex gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-soft-cyan" aria-hidden="true" />
            <span>We&rsquo;ll port your US/Canada/UK number whenever you&rsquo;re ready — just tell us. You won&rsquo;t lose it early.</span>
          </div>
        )}
      </div>
    </aside>
  );
}
