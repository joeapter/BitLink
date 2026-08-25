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
}) {
  // A deferred foreign-number port has nothing due today — neither the monthly
  // add-on nor the one-time fee is charged at checkout.
  const showIntlAddonNow = hasIntlNumber && !intlPortDeferred && !intlNumberIncluded;
  return (
    <aside className="rounded-4xl border border-ink/10 bg-ink p-6 text-white shadow-liquid">
      <p className="text-sm font-semibold text-soft-cyan">Monthly plan</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-normal">{plan.name}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-200">{plan.description}</p>

      <div className="mt-8 rounded-3xl border border-white/12 bg-white/10 p-5">
        <div className="flex items-end justify-between gap-4">
          <span className="text-sm text-slate-300">Due monthly</span>
          {introPriceCents != null ? (
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
        {showIntlAddonNow && (
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
