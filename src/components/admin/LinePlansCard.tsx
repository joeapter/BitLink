"use client";

import { useTransition } from "react";
import type { LinePlanInfo } from "@/types/telecom";
import { replaceLinePlanAction } from "@/lib/admin/line-actions";
import { BarChart3, ArrowRightLeft } from "lucide-react";
import { plans } from "@/lib/plans";

interface Props {
  lineId: string;
  providerLineId: string;
  plans: LinePlanInfo[];
}

export function LinePlansCard({ lineId, providerLineId, plans: linePlans }: Props) {
  const [pending, startTransition] = useTransition();

  const allPlanNames = plans.map((p) => p.slug);

  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <BarChart3 className="h-4 w-4 text-link-blue" />
        Active plans
      </h2>

      <div className="mt-4 grid gap-3">
        {linePlans.length ? (
          linePlans.map((plan) => (
            <div key={plan.id} className="rounded-xl border border-ink/8 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink">{plan.planName}</p>
                  <p className="text-xs text-muted-slate">
                    Since {plan.startAt.toLocaleDateString()}
                    {plan.endAt && ` → ${plan.endAt.toLocaleDateString()}`}
                  </p>
                </div>
                {plan.isMain && (
                  <span className="rounded-full bg-link-blue/10 px-2 py-0.5 text-xs font-semibold text-link-blue">
                    Main
                  </span>
                )}
              </div>

              {/* Plan replace form */}
              <form
                action={(fd) => startTransition(() => { void replaceLinePlanAction(fd); })}
                className="mt-3 flex gap-2"
              >
                <input type="hidden" name="lineId" value={lineId} />
                <input type="hidden" name="providerLineId" value={providerLineId} />
                <input type="hidden" name="linePlanId" value={plan.id} />
                <select
                  name="newPlanName"
                  className="flex-1 rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-link-blue"
                >
                  {allPlanNames.map((name) => (
                    <option key={name} value={name} selected={name === plan.planName}>
                      {name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex items-center gap-1.5 rounded-xl bg-link-blue px-3 py-2 text-xs font-semibold text-white hover:bg-link-blue/90 disabled:opacity-50"
                >
                  <ArrowRightLeft className="h-3 w-3" />
                  Replace
                </button>
              </form>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-slate">No plans found for this line.</p>
        )}
      </div>
    </section>
  );
}
