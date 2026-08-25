"use client";

import { useActionState, useState } from "react";
import { Undo2, ExternalLink } from "lucide-react";
import { refundAndCancelLineAction, type RefundState } from "@/lib/admin/line-actions";
import type { RefundContext } from "@/lib/admin/refund-cancel";
import { formatMoney, formatDateTime } from "@/lib/utils";

// The point of this card is the numbers, not the button: it shows exactly what
// the customer paid, on which card, and what the invoice was made of, so the
// amount can be confirmed before anything is refunded. The button is gated
// behind typing the amount for the same reason.
export function RefundAndCancelCard({
  lineId,
  context,
}: {
  lineId: string;
  context: RefundContext;
}) {
  const [state, action, pending] = useActionState<RefundState, FormData>(
    refundAndCancelLineAction,
    null,
  );
  const [typed, setTyped] = useState("");

  const payment = context.lastPayment;

  if (!payment) {
    return (
      <section className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft sm:rounded-4xl sm:p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Undo2 className="h-5 w-5 text-link-blue" aria-hidden="true" />
          Refund &amp; cancel
        </h2>
        <p className="mt-2 text-xs text-muted-slate">
          {context.blockedReason ?? "No payment found for this line."}
        </p>
      </section>
    );
  }

  const outstandingCents = payment.amountCents - payment.refundedCents;
  const fullyRefunded = outstandingCents <= 0;
  const amountLabel = formatMoney(outstandingCents, payment.currency);
  // Typing the major-unit amount (e.g. "14.99") is the confirmation gate —
  // deliberately more friction than a confirm() because this moves money.
  // Compared by value, not by string, so a pasted "$29.98", a stray space, or a
  // comma decimal still arms the button — the gate is meant to make you read
  // the amount, not to make you fight the keyboard.
  const expectedTyped = (outstandingCents / 100).toFixed(2);
  const typedCents = Math.round(
    parseFloat(typed.replace(/[^0-9.,]/g, "").replace(",", ".")) * 100,
  );
  const armed = !fullyRefunded && typedCents === outstandingCents;

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft sm:rounded-4xl sm:p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <Undo2 className="h-5 w-5 text-link-blue" aria-hidden="true" />
        Refund &amp; cancel
      </h2>
      <p className="mt-1 text-xs text-muted-slate">
        Refunds the last payment in full and cancels the subscription. The line terminates itself
        afterwards and the number goes back to the pool.
      </p>

      {/* Last payment — what you're confirming */}
      <div className="mt-4 rounded-xl border border-ink/10 bg-slate-50 p-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-slate">
            Last payment
          </span>
          <span className="text-2xl font-semibold text-ink">
            {formatMoney(payment.amountCents, payment.currency)}
          </span>
        </div>

        <dl className="mt-3 grid gap-1.5 text-xs">
          {payment.paidAt ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-slate">Paid</dt>
              <dd className="text-ink">{formatDateTime(payment.paidAt)}</dd>
            </div>
          ) : null}
          {payment.invoiceNumber ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-slate">Invoice</dt>
              <dd className="font-mono text-ink">{payment.invoiceNumber}</dd>
            </div>
          ) : null}
          {payment.cardLast4 ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-slate">Card</dt>
              <dd className="text-ink">
                {payment.cardBrand ? `${payment.cardBrand} ` : ""}•••• {payment.cardLast4}
              </dd>
            </div>
          ) : null}
          {payment.refundedCents > 0 ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-slate">Already refunded</dt>
              <dd className="font-semibold text-amber-700">
                {formatMoney(payment.refundedCents, payment.currency)}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-muted-slate">Subscription</dt>
            <dd className="text-ink">{context.subscriptionStatus ?? "unknown"}</dd>
          </div>
        </dl>

        {payment.lines.length > 0 ? (
          <div className="mt-3 border-t border-ink/10 pt-2">
            <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-slate">
              What they were charged for
            </p>
            <ul className="mt-1 grid gap-0.5">
              {payment.lines.map((l, i) => (
                <li key={i} className="flex justify-between gap-3 text-xs text-ink">
                  <span className="truncate">{l.description}</span>
                  <span className="shrink-0 font-mono">
                    {formatMoney(l.amountCents, payment.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {payment.hostedInvoiceUrl ? (
          <a
            href={payment.hostedInvoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-link-blue hover:underline"
          >
            View invoice in Stripe
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        ) : null}
      </div>

      {fullyRefunded ? (
        <p className="mt-3 text-xs font-semibold text-emerald-700">
          This payment has already been refunded in full.
        </p>
      ) : (
        <form action={action} className="mt-4 grid gap-2">
          <input type="hidden" name="lineId" value={lineId} />
          <input type="hidden" name="expectedAmountCents" value={payment.amountCents} />

          <label className="text-xs text-muted-slate" htmlFor={`refund-confirm-${lineId}`}>
            Type <span className="font-mono font-semibold text-ink">{expectedTyped}</span> in the box
            below to unlock the refund button
          </label>
          {/* No placeholder here on purpose: showing the expected amount inside
              the empty box makes it look already filled in. */}
          <input
            id={`refund-confirm-${lineId}`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            inputMode="decimal"
            autoComplete="off"
            aria-describedby={`refund-hint-${lineId}`}
            className="rounded-xl border border-ink/15 px-3 py-2 font-mono text-sm text-ink outline-none focus:border-link-blue"
          />
          <p id={`refund-hint-${lineId}`} className="text-xs">
            {armed ? (
              <span className="font-semibold text-emerald-700">
                Amount matches — the refund button is unlocked.
              </span>
            ) : typed.trim().length > 0 ? (
              <span className="font-semibold text-amber-700">
                Doesn&apos;t match {expectedTyped} yet.
              </span>
            ) : (
              <span className="text-muted-slate">
                The button stays greyed out until the box matches.
              </span>
            )}
          </p>

          <button
            type="submit"
            disabled={!armed || pending}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-800 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
            {pending ? "Refunding…" : `Refund ${amountLabel} & cancel`}
          </button>
        </form>
      )}

      {state?.success ? (
        <p className="mt-3 text-xs font-semibold text-emerald-700">{state.success}</p>
      ) : null}
      {state?.error ? (
        <p className="mt-3 text-xs font-semibold text-rose-700">{state.error}</p>
      ) : null}
    </section>
  );
}
