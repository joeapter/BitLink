"use client";

import { useTransition } from "react";
import { PhoneIncoming, Plus, CheckCircle2, XCircle, PlayCircle } from "lucide-react";
import type { IntlPortInRequest } from "@/lib/custom-orders/intl-port-in-requests";
import {
  createIntlPortInRequestAction,
  advanceIntlPortInRequestAction,
  completeIntlPortInRequestAction,
} from "@/lib/admin/line-actions";

interface Props {
  lineId: string;
  requests: IntlPortInRequest[];
}

const STATUS_STYLE: Record<IntlPortInRequest["status"], string> = {
  pending: "bg-slate-100 text-slate-700",
  in_progress: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
};

// Tracks a US/UK/Canada port-in for an ALREADY ACTIVE line. There is no
// Annatel API for this — it's always a manual process (an LOA, account
// number, and transfer PIN coordinated with the losing carrier abroad, same
// as /keep-your-number already tells customers to expect, 3-5 business
// days). This card is the tracking record plus the final "it landed, attach
// it" step — the email to Annatel still has to happen by hand.
export function IntlPortInCard({ lineId, requests }: Props) {
  const [pending, startTransition] = useTransition();
  const active = requests.filter((r) => r.status !== "completed" && r.status !== "cancelled");

  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <PhoneIncoming className="h-4 w-4 text-link-blue" />
        Port in a US/UK/Canada number
      </h2>
      <p className="mt-1 text-xs text-muted-slate">
        Always manual — this only tracks the request. You still need to email Annatel with the account
        number and transfer PIN from the losing carrier, same as any international port.
      </p>

      <div className="mt-4 grid gap-2">
        {requests.length ? (
          requests.map((r) => (
            <div key={r.id} className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-semibold text-ink">{r.number}</p>
                  <p className="text-xs text-muted-slate">
                    {r.country.toUpperCase()} · fee {r.oneTimeFeeBillingMode === "free" ? "waived" : "$49.99"} · add-on{" "}
                    {r.monthlyBillingMode === "free" ? "free" : "$9.99/mo"}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>
                  {r.status.replace("_", " ")}
                </span>
              </div>

              {(r.status === "pending" || r.status === "in_progress") && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.status === "pending" && (
                    <form action={(fd) => startTransition(() => { void advanceIntlPortInRequestAction(fd); })}>
                      <input type="hidden" name="lineId" value={lineId} />
                      <input type="hidden" name="requestId" value={r.id} />
                      <input type="hidden" name="status" value="in_progress" />
                      <button
                        type="submit"
                        disabled={pending}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-40"
                      >
                        <PlayCircle className="h-3.5 w-3.5" /> Mark in progress
                      </button>
                    </form>
                  )}
                  <form
                    action={(fd) => startTransition(() => { void completeIntlPortInRequestAction(fd); })}
                    onSubmit={(e) => {
                      if (!window.confirm(`Attach ${r.number} to this line now? Only do this once Annatel has confirmed the number has actually landed.`)) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="lineId" value={lineId} />
                    <input type="hidden" name="requestId" value={r.id} />
                    <button
                      type="submit"
                      disabled={pending}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-40"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> It landed — attach &amp; bill
                    </button>
                  </form>
                  <form action={(fd) => startTransition(() => { void advanceIntlPortInRequestAction(fd); })}>
                    <input type="hidden" name="lineId" value={lineId} />
                    <input type="hidden" name="requestId" value={r.id} />
                    <input type="hidden" name="status" value="cancelled" />
                    <button
                      type="submit"
                      disabled={pending}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-40"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Cancel
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-slate">No port-in requests yet.</p>
        )}
      </div>

      {active.length === 0 && (
        <form
          action={(fd) => startTransition(() => { void createIntlPortInRequestAction(fd); })}
          className="mt-4 grid gap-2 sm:grid-cols-2"
        >
          <input type="hidden" name="lineId" value={lineId} />
          <select name="country" className="h-10 rounded-xl border border-ink/10 bg-slate-50 px-3 text-sm outline-none focus:border-link-blue">
            <option value="us">US</option>
            <option value="canada">Canada</option>
            <option value="uk">UK</option>
          </select>
          <input name="number" required placeholder="Number to port, e.g. +13475551234" className="h-10 rounded-xl border border-ink/10 bg-slate-50 px-3 text-sm outline-none focus:border-link-blue" />
          <label className="grid gap-1 text-xs font-semibold text-ink">
            <span>One-time port fee</span>
            <select name="oneTimeFeeBillingMode" defaultValue="paid" className="h-10 rounded-xl border border-ink/10 bg-slate-50 px-3 text-sm outline-none focus:border-link-blue">
              <option value="paid">Charge $49.99</option>
              <option value="free">Waive</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-ink">
            <span>Monthly add-on</span>
            <select name="monthlyBillingMode" defaultValue="paid" className="h-10 rounded-xl border border-ink/10 bg-slate-50 px-3 text-sm outline-none focus:border-link-blue">
              <option value="paid">Charge $9.99/mo</option>
              <option value="free">Free</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={pending}
            className="flex w-fit items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-40 sm:col-span-2"
          >
            <Plus className="h-4 w-4" />
            Track new port-in request
          </button>
        </form>
      )}
    </section>
  );
}
