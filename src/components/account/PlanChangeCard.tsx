"use client";

import { useMemo, useState, useActionState } from "react";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { changeAccountLinePlanAction, type AccountPlanChangeState } from "@/lib/account/plan-change-actions";
import { formatMoney } from "@/lib/utils";
import { plans, type PlanSlug } from "@/lib/plans";

export function PlanChangeCard({
  lineId,
  status,
  currentPlanSlug,
  isKosher,
}: {
  lineId: string;
  status: string;
  currentPlanSlug: string | null;
  isKosher: boolean;
}) {
  const availablePlans = useMemo(
    () => plans.filter((plan) => plan.isKosher === isKosher && plan.slug !== currentPlanSlug),
    [currentPlanSlug, isKosher],
  );
  const [open, setOpen] = useState(false);
  const [selectedPlanSlug, setSelectedPlanSlug] = useState<PlanSlug>((availablePlans[0]?.slug ?? "student-5g") as PlanSlug);
  const [state, formAction, pending] = useActionState<AccountPlanChangeState, FormData>(changeAccountLinePlanAction, null);
  const selectedPlan = plans.find((plan) => plan.slug === selectedPlanSlug) ?? availablePlans[0];

  if (status !== "active" || !availablePlans.length) return null;

  return (
    <div className="mt-3 rounded-xl border border-ink/10 bg-white p-4">
      {state?.success ? (
        <p className="text-sm font-semibold text-emerald-700">{state.success}</p>
      ) : !open ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-muted-slate" aria-hidden="true" />
            <p className="text-sm text-muted-slate">
              Need more data or minutes? <span className="font-semibold text-ink">Change this line&apos;s plan</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-slate-50"
          >
            Change plan
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm font-semibold text-ink">Change this line&apos;s plan</p>
          <p className="mt-1 text-xs leading-5 text-muted-slate">
            Stripe updates this line item with normal proration on your next invoice.
          </p>
          <form action={formAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <input type="hidden" name="lineId" value={lineId} />
            <label className="grid gap-2 text-sm font-medium text-ink">
              <span>New plan</span>
              <select
                name="newPlanSlug"
                value={selectedPlanSlug}
                onChange={(event) => setSelectedPlanSlug(event.target.value as PlanSlug)}
                className="h-11 rounded-2xl border border-ink/10 bg-white px-3 text-sm text-ink outline-none transition focus:border-link-blue focus:ring-4 focus:ring-link-blue/15"
              >
                {availablePlans.map((plan) => (
                  <option key={plan.slug} value={plan.slug}>
                    {plan.name} - {formatMoney(plan.priceCents, plan.currency)}/mo
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-4 text-xs font-semibold text-white transition hover:bg-ink/90 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />}
              {pending ? "Changing..." : "Confirm"}
            </button>
          </form>
          {selectedPlan ? (
            <p className="mt-2 text-xs text-muted-slate">
              New monthly rate: <span className="font-semibold text-ink">{formatMoney(selectedPlan.priceCents, selectedPlan.currency)}/mo</span>
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 text-xs font-semibold text-muted-slate transition hover:text-ink"
          >
            Never mind
          </button>
          {state?.error ? <p className="mt-3 text-xs font-semibold text-rose-700">{state.error}</p> : null}
        </div>
      )}
    </div>
  );
}
