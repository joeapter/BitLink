"use client";

import { useActionState } from "react";
import { Gift, Loader2, PlusCircle, XCircle } from "lucide-react";
import {
  grantTopupAdminAction,
  cancelTopupGrantAdminAction,
  type AdminGrantTopupState,
} from "@/lib/admin/line-actions";
import { getTopUpsForPlan } from "@/lib/topups";

type ActiveGrant = {
  id: string;
  label: string;
  frequency: "once" | "monthly";
  billingMode: "free" | "paid";
  createdAt: string;
};

function CancelGrantForm({ grantId, lineId }: { grantId: string; lineId: string }) {
  const [state, formAction, pending] = useActionState<AdminGrantTopupState, FormData>(
    cancelTopupGrantAdminAction,
    null,
  );
  return (
    <form action={formAction}>
      <input type="hidden" name="grantId" value={grantId} />
      <input type="hidden" name="lineId" value={lineId} />
      <button
        type="submit"
        disabled={pending || Boolean(state?.success)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 transition hover:text-rose-800 disabled:opacity-50"
      >
        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
        {state?.success ? "Cancelled" : pending ? "Cancelling…" : "Cancel"}
      </button>
    </form>
  );
}

export function AddTopupCard({
  lineId,
  isKosher,
  activeGrants,
}: {
  lineId: string;
  isKosher: boolean;
  activeGrants: ActiveGrant[];
}) {
  const [state, formAction, pending] = useActionState<AdminGrantTopupState, FormData>(
    grantTopupAdminAction,
    null,
  );
  const options = getTopUpsForPlan(isKosher);

  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <Gift className="h-4 w-4 text-link-blue" />
        Topups
      </h2>

      {activeGrants.length ? (
        <div className="mt-4 grid gap-2">
          {activeGrants.map((grant) => (
            <div key={grant.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
              <div>
                <p className="font-semibold text-ink">{grant.label}</p>
                <p className="text-xs text-muted-slate">
                  {grant.frequency === "monthly" ? "Every month" : "One-time"} ·{" "}
                  {grant.billingMode === "free" ? "Free" : "Paid"}
                </p>
              </div>
              {grant.frequency === "monthly" ? <CancelGrantForm grantId={grant.id} lineId={lineId} /> : null}
            </div>
          ))}
        </div>
      ) : null}

      <form action={formAction} className="mt-4 grid gap-3">
        <input type="hidden" name="lineId" value={lineId} />
        <label className="grid gap-1.5 text-xs font-semibold text-ink">
          <span>Topup</span>
          <select
            name="topupId"
            defaultValue={options[0]?.id}
            className="h-10 rounded-xl border border-ink/10 bg-white px-3 text-xs font-semibold text-ink outline-none focus:border-link-blue"
          >
            {options.map((topup) => (
              <option key={topup.id} value={topup.id}>
                {topup.name} — ${(topup.priceCents / 100).toFixed(2)}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-semibold text-ink">
            <span>Frequency</span>
            <select
              name="frequency"
              defaultValue="once"
              className="h-10 rounded-xl border border-ink/10 bg-white px-3 text-xs font-semibold text-ink outline-none focus:border-link-blue"
            >
              <option value="once">One-time</option>
              <option value="monthly">Every month</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-ink">
            <span>Billing</span>
            <select
              name="billingMode"
              defaultValue="paid"
              className="h-10 rounded-xl border border-ink/10 bg-white px-3 text-xs font-semibold text-ink outline-none focus:border-link-blue"
            >
              <option value="paid">Charge subscription</option>
              <option value="free">Give for free</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink/90 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />}
          {pending ? "Adding…" : "Add topup"}
        </button>
      </form>

      {state?.error ? <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{state.error}</p> : null}
      {state?.success ? <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{state.success}</p> : null}
    </section>
  );
}
