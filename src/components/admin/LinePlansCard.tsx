"use client";

import { useActionState } from "react";
import type { LinePlanInfo } from "@/types/telecom";
import { changeLinePlanAdminAction, type AdminPlanChangeState } from "@/lib/admin/line-actions";
import { BarChart3, ArrowRightLeft, Loader2 } from "lucide-react";
import { getAnnatelPlanName, plans } from "@/lib/plans";
import { topups } from "@/lib/topups";
import { formatMoney } from "@/lib/utils";

interface Props {
  lineId: string;
  plans: LinePlanInfo[];
  isKosher: boolean;
  currentPlanSlug: string | null;
}

export function LinePlansCard({ lineId, plans: linePlans, isKosher, currentPlanSlug }: Props) {
  const [state, formAction, pending] = useActionState<AdminPlanChangeState, FormData>(changeLinePlanAdminAction, null);
  const availablePlans = plans.filter((plan) => plan.isKosher === isKosher);

  // Annatel plan names → friendly labels: main plans via the slug mapping,
  // supplementary plans via the topups catalog.
  function friendlyName(annatelName: string): string {
    const topup = topups.find((t) => t.annatelPlanName === annatelName);
    if (topup) return `${topup.name} (topup)`;
    const main = plans.find((p) => getAnnatelPlanName(p.slug) === annatelName);
    return main?.name ?? annatelName;
  }

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
                  <p className="font-semibold text-ink">{friendlyName(plan.planName)}</p>
                  <p className="text-xs text-muted-slate">
                    Since {plan.startAt.toLocaleDateString()}
                    {plan.endAt && ` → ${plan.endAt.toLocaleDateString()}`}
                  </p>
                </div>
                {plan.isMain ? (
                  <span className="rounded-full bg-link-blue/10 px-2 py-0.5 text-xs font-semibold text-link-blue">
                    Main
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    Topup
                  </span>
                )}
              </div>

              {plan.isMain ? (
                <form action={formAction} className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                  <input type="hidden" name="lineId" value={lineId} />
                  <input type="hidden" name="linePlanId" value={plan.id} />
                  <label className="grid gap-1.5 text-xs font-semibold text-ink">
                    <span>BitLink plan</span>
                    <select
                      name="newPlanSlug"
                      defaultValue={currentPlanSlug ?? availablePlans[0]?.slug}
                      className="h-10 rounded-xl border border-ink/10 bg-white px-3 text-xs font-semibold text-ink outline-none focus:border-link-blue"
                    >
                      {availablePlans.map((item) => (
                        <option key={item.slug} value={item.slug}>
                          {item.name} - {formatMoney(item.priceCents, item.currency)}/mo
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold text-ink">
                    <span>Billing</span>
                    <select
                      name="billingMode"
                      defaultValue="paid"
                      className="h-10 rounded-xl border border-ink/10 bg-white px-3 text-xs font-semibold text-ink outline-none focus:border-link-blue"
                    >
                      <option value="paid">Update Stripe billing</option>
                      <option value="carrier_only">Carrier only / free upgrade</option>
                    </select>
                  </label>
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-link-blue px-3 text-xs font-semibold text-white hover:bg-link-blue/90 disabled:opacity-50"
                  >
                    {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />}
                    {pending ? "Changing" : "Change"}
                  </button>
                </form>
              ) : null}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-slate">No plans found for this line.</p>
        )}
      </div>
      {state?.error ? <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{state.error}</p> : null}
      {state?.success ? <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{state.success}</p> : null}
    </section>
  );
}
