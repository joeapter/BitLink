"use client";

import { useState } from "react";
import { plans } from "@/lib/plans";
import { formatMoney, cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";

type Tab = "plans" | "kosher";

export function PlanComparison() {
  const [tab, setTab] = useState<Tab>("plans");
  const visiblePlans = plans.filter((p) => p.isKosher === (tab === "kosher"));

  return (
    <div className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-soft">
      {/* Tab bar */}
      <div className="border-b border-ink/8 px-5 pt-4">
        <div className="flex gap-1">
          {(["plans", "kosher"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-t px-4 py-2 text-sm font-semibold transition",
                tab === t
                  ? "border-b-2 border-link-blue text-link-blue"
                  : "text-slate-500 hover:text-ink",
              )}
            >
              {t === "plans" ? "Plans" : "Kosher Plans"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[680px] w-full border-collapse text-left">
          <thead className="bg-slate-50 text-sm text-slate-500">
            <tr>
              <th className="px-5 py-4 font-semibold">Plan</th>
              <th className="px-5 py-4 font-semibold">Monthly</th>
              <th className="px-5 py-4 font-semibold">Data</th>
              <th className="px-5 py-4 font-semibold">Calls &amp; texts</th>
              <th className="px-5 py-4 font-semibold">Activation</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8">
            {visiblePlans.map((plan) => (
              <tr key={plan.slug} className="text-sm text-slate-700">
                <td className="px-5 py-5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{plan.name}</span>
                    {plan.badge ? (
                      <span className="rounded-full bg-trust-green/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-emerald-700">
                        {plan.badge}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 max-w-xs text-xs leading-5 text-muted-slate">{plan.description}</div>
                </td>
                <td className="px-5 py-5 font-semibold text-ink">{formatMoney(plan.priceCents, plan.currency)}/mo</td>
                <td className="px-5 py-5">{plan.comparison.data}</td>
                <td className="px-5 py-5">{plan.comparison.calls} / {plan.comparison.texts}</td>
                <td className="px-5 py-5">{plan.comparison.activation}</td>
                <td className="px-5 py-5">
                  <div className="flex flex-col gap-2">
                    <ButtonLink href={`/checkout?plan=${plan.slug}`} size="sm" variant={plan.featured ? "primary" : "secondary"}>
                      Choose
                    </ButtonLink>
                    <a href={`/plans/${plan.slug}`} className="text-center text-xs font-semibold text-link-blue hover:underline">
                      More details
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
