import { ShieldCheck, Sparkles } from "lucide-react";
import type { BitLinkPlan } from "@/lib/plans";
import { formatMoney } from "@/lib/utils";

export function CheckoutSummary({ plan }: { plan: BitLinkPlan }) {
  return (
    <aside className="rounded-[2rem] border border-ink/10 bg-ink p-6 text-white shadow-liquid">
      <p className="text-sm font-semibold text-soft-cyan">Monthly plan</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-normal">{plan.name}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-200">{plan.description}</p>

      <div className="mt-8 rounded-[1.5rem] border border-white/12 bg-white/10 p-5">
        <div className="flex items-end justify-between gap-4">
          <span className="text-sm text-slate-300">Due monthly</span>
          <span className="text-4xl font-semibold">
            {formatMoney(plan.priceCents, plan.currency)}
            <span className="text-base font-medium text-slate-300">/mo</span>
          </span>
        </div>
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
      </div>
    </aside>
  );
}
