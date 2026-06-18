import { ShieldCheck, Sparkles, Phone } from "lucide-react";
import type { BitLinkPlan } from "@/lib/plans";
import { formatMoney } from "@/lib/utils";

const ACTIVATION_FEE_CENTS = 1499;
const INTL_NUMBER_ADDON_CENTS = 999;

export function CheckoutSummary({
  plan,
  isPortIn = false,
  feeWaived = false,
  hasIntlNumber = false,
}: {
  plan: BitLinkPlan;
  isPortIn?: boolean;
  feeWaived?: boolean;
  hasIntlNumber?: boolean;
}) {
  return (
    <aside className="rounded-4xl border border-ink/10 bg-ink p-6 text-white shadow-liquid">
      <p className="text-sm font-semibold text-soft-cyan">Monthly plan</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-normal">{plan.name}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-200">{plan.description}</p>

      <div className="mt-8 rounded-3xl border border-white/12 bg-white/10 p-5">
        <div className="flex items-end justify-between gap-4">
          <span className="text-sm text-slate-300">Due monthly</span>
          <span className="text-4xl font-semibold">
            {formatMoney(plan.priceCents, plan.currency)}
            <span className="text-base font-medium text-slate-300">/mo</span>
          </span>
        </div>
        <div className="mt-3 border-t border-white/10 pt-3 flex items-center justify-between gap-4">
          <span className="text-sm text-slate-300">One-time activation fee</span>
          {feeWaived ? (
            <span className="flex items-center gap-2 text-lg font-semibold">
              <span className="text-slate-400 line-through opacity-60">
                {formatMoney(ACTIVATION_FEE_CENTS, plan.currency)}
              </span>
              <span className="text-trust-green text-sm">Waived</span>
            </span>
          ) : (
            <span className="text-lg font-semibold">
              {formatMoney(ACTIVATION_FEE_CENTS, plan.currency)}
            </span>
          )}
        </div>
        {hasIntlNumber && (
          <div className="mt-3 border-t border-white/10 pt-3 flex items-center justify-between gap-4">
            <span className="text-sm text-slate-300">US/Canada/UK number add-on</span>
            <span className="text-lg font-semibold">
              +{formatMoney(INTL_NUMBER_ADDON_CENTS, plan.currency)}
              <span className="text-base font-medium text-slate-300">/mo</span>
            </span>
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
        {hasIntlNumber && (
          <div className="flex gap-3">
            <Phone className="mt-0.5 h-5 w-5 shrink-0 text-soft-cyan" aria-hidden="true" />
            <span>Your US/Canada/UK number is set up alongside your Israeli line.</span>
          </div>
        )}
      </div>
    </aside>
  );
}
