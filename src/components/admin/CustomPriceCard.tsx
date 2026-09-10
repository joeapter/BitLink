"use client";

import { useActionState, useState } from "react";
import { Tag, Undo2 } from "lucide-react";
import {
  setCustomLinePriceAction,
  type CustomPriceState,
  refundPartialAmountAction,
  type PartialRefundState,
} from "@/lib/admin/line-actions";
import { formatMoney } from "@/lib/utils";

// A retention lever, not a plan change — the carrier plan and product
// features are untouched, only what Stripe bills. See custom-price.ts for
// why this is deliberately separate from the plan-change flow. Not meant for
// publicly quoted prices; this is for the "he'll cancel otherwise" case.
export function CustomPriceCard({
  lineId,
  currentPriceCents,
}: {
  lineId: string;
  currentPriceCents: number | null;
}) {
  const [state, formAction, pending] = useActionState<CustomPriceState, FormData>(
    setCustomLinePriceAction,
    null,
  );
  const [refundState, refundAction, refundPending] = useActionState<PartialRefundState, FormData>(
    refundPartialAmountAction,
    null,
  );
  const [applyImmediately, setApplyImmediately] = useState(false);

  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <Tag className="h-5 w-5 text-link-blue" aria-hidden="true" />
        Custom price
      </h2>
      <p className="mt-1 text-xs text-muted-slate">
        Overrides what this line is billed, monthly — the plan and carrier service stay exactly as they are. For
        keeping a customer who'd otherwise cancel, not for advertised pricing.
        {currentPriceCents != null ? (
          <> Currently billed at <b className="text-ink">{formatMoney(currentPriceCents)}/mo</b>.</>
        ) : null}
      </p>

      <form action={formAction} className="mt-4 grid gap-3">
        <input type="hidden" name="lineId" value={lineId} />
        <input type="hidden" name="applyImmediately" value={applyImmediately ? "true" : "false"} />

        <label className="grid gap-1.5 text-xs font-semibold text-ink">
          <span>New monthly price (USD)</span>
          <input
            type="number"
            name="newPriceDollars"
            min="0"
            step="0.01"
            required
            placeholder="9.99"
            className="h-10 rounded-xl border border-ink/10 bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-link-blue"
          />
        </label>

        <label className="grid gap-1.5 text-xs font-semibold text-ink">
          <span>Reason (kept in the audit log)</span>
          <input
            type="text"
            name="reason"
            required
            placeholder="Retention — OTP-only use, asked for cheaper plan"
            className="h-10 rounded-xl border border-ink/10 bg-white px-3 text-sm text-ink outline-none focus:border-link-blue"
          />
        </label>

        <label className="flex items-center gap-2 text-xs font-medium text-muted-slate">
          <input
            type="checkbox"
            checked={applyImmediately}
            onChange={(e) => setApplyImmediately(e.target.checked)}
            className="h-4 w-4 rounded border-ink/20"
          />
          Apply now, with a prorated credit for the rest of this cycle — otherwise it takes effect at next renewal
          and this month's bill is untouched.
        </label>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-link-blue px-3 py-2.5 text-xs font-semibold text-white hover:bg-link-blue/90 disabled:opacity-50"
        >
          {pending ? "Applying…" : "Set custom price"}
        </button>
      </form>

      {state?.error ? <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{state.error}</p> : null}
      {state?.success ? <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{state.success}</p> : null}

      <div className="mt-5 border-t border-ink/10 pt-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Undo2 className="h-4 w-4 text-link-blue" aria-hidden="true" />
          Partial refund
        </h3>
        <p className="mt-1 text-xs text-muted-slate">
          Credits back part of what was already charged, on the last paid invoice — the subscription and the line
          stay exactly as they are. For crediting the difference after agreeing a lower price with someone who
          already paid at the old one.
        </p>

        <form action={refundAction} className="mt-3 grid gap-3">
          <input type="hidden" name="lineId" value={lineId} />
          <label className="grid gap-1.5 text-xs font-semibold text-ink">
            <span>Amount to refund (USD)</span>
            <input
              type="number"
              name="refundDollars"
              min="0.01"
              step="0.01"
              required
              placeholder="11.70"
              className="h-10 rounded-xl border border-ink/10 bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-link-blue"
            />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-ink">
            <span>Reason (kept in the audit log)</span>
            <input
              type="text"
              name="reason"
              required
              placeholder="Credit for the gap between $14.99 and the agreed $8.29 rate"
              className="h-10 rounded-xl border border-ink/10 bg-white px-3 text-sm text-ink outline-none focus:border-link-blue"
            />
          </label>
          <button
            type="submit"
            disabled={refundPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink/15 px-3 py-2.5 text-xs font-semibold text-ink transition hover:bg-slate-50 disabled:opacity-50"
          >
            {refundPending ? "Refunding…" : "Issue partial refund"}
          </button>
        </form>

        {refundState?.error ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{refundState.error}</p> : null}
        {refundState?.success ? <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{refundState.success}</p> : null}
      </div>
    </section>
  );
}
