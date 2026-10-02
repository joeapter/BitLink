"use client";

import { useActionState, useState } from "react";
import { PhoneForwarded, PhoneIncoming, AlertTriangle } from "lucide-react";
import { loanNumberAction, returnNumberAction, type NumberLoanState } from "@/lib/admin/line-actions";
import type { NumberLoan } from "@/lib/telecom/number-loan";

// The temporary number move: borrow a customer's number onto the office line so
// a voice verification code rings in Israel, then give it straight back. The
// dangerous part is not the move, it's forgetting to undo it — a number left on
// loan is a customer with no service — so the loaned state is loud and says how
// long it has been sitting there.

function elapsed(since: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(since).getTime()) / 60000));
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

export function NumberLoanCard({
  lineId,
  providerLineId,
  phoneNumber,
  numbers = [],
  officeLabel,
  loan,
}: {
  lineId: string;
  providerLineId: string;
  phoneNumber: string | null;
  /** Israeli numbers on the line at the carrier. More than one → the admin picks. */
  numbers?: string[];
  officeLabel: string;
  loan: NumberLoan | null;
}) {
  const [selected, setSelected] = useState(
    phoneNumber && numbers.includes(phoneNumber) ? phoneNumber : (numbers[0] ?? phoneNumber ?? ""),
  );
  const hasChoice = numbers.length > 1;
  const moving = hasChoice ? selected : phoneNumber;
  const [loanState, loanFormAction, loanPending] = useActionState<NumberLoanState, FormData>(
    loanNumberAction,
    null,
  );
  const [returnState, returnFormAction, returnPending] = useActionState<NumberLoanState, FormData>(
    returnNumberAction,
    null,
  );
  const state = loan ? returnState : loanState;

  return (
    <section
      className={`rounded-[2rem] border p-5 shadow-soft ${
        loan ? "border-amber-300 bg-amber-50" : "border-ink/10 bg-white"
      }`}
    >
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <PhoneForwarded className="h-5 w-5 text-link-blue" aria-hidden="true" />
        Temporary number move
      </h2>

      {loan ? (
        <>
          <p className="mt-2 flex items-start gap-2 text-xs font-semibold text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              <b className="font-mono">{loan.number}</b> has been on {officeLabel} for{" "}
              <b>{elapsed(loan.movedAt)}</b>. The customer has no calls or texts on it until it goes back.
            </span>
          </p>
          <p className="mt-2 text-xs text-amber-900/80">
            Answer the verification call here, read the code to them, then return the number. Their SMS
            forwarding
            {loan.smsForwarders.length > 0 ? (
              <>
                {" "}
                (
                <b>
                  {loan.smsForwarders
                    .map((f) => f.emailRecipientAddress ?? f.telegramChatId)
                    .filter(Boolean)
                    .join(", ")}
                </b>
                ) is saved and goes back on automatically
              </>
            ) : (
              <> was not set up, so there is nothing to put back</>
            )}
            .
          </p>

          <form action={returnFormAction} className="mt-4">
            <input type="hidden" name="lineId" value={lineId} />
            <button
              type="submit"
              disabled={returnPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <PhoneIncoming className="h-4 w-4" aria-hidden="true" />
              {returnPending ? "Returning…" : "Return number to customer"}
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="mt-1 text-xs text-muted-slate">
            Moves {moving ? <b className="font-mono text-ink">{moving}</b> : "this line's number"} onto{" "}
            {officeLabel} for a few minutes, so a voice verification code — WhatsApp, a bank, a government portal
            — rings in Israel instead of on a handset that is abroad. Read the code out, then press Return.
          </p>
          <p className="mt-2 text-xs text-muted-slate">
            Their plan, billing and phone number are untouched: as far as BitLink is concerned the number is
            still theirs, and nobody else can be given it. Only the carrier knows it moved.
          </p>

          <form
            action={(fd) => {
              if (
                !confirm(
                  `Move ${moving || "this number"} to ${officeLabel}?\n\n` +
                    `The customer loses calls and texts on it until you press Return. Their SMS forwarding is ` +
                    `saved and restored automatically.`,
                )
              ) {
                return;
              }
              loanFormAction(fd);
            }}
            className="mt-4"
          >
            <input type="hidden" name="lineId" value={lineId} />
            <input type="hidden" name="providerLineId" value={providerLineId} />
            {hasChoice ? (
              <fieldset className="mb-3 grid gap-1.5">
                <legend className="mb-1.5 text-xs font-semibold text-ink">
                  This line has {numbers.length} Israeli numbers — which one?
                </legend>
                {numbers.map((n) => (
                  <label
                    key={n}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                      selected === n ? "border-link-blue bg-sky-50" : "border-ink/10"
                    }`}
                  >
                    <input
                      type="radio"
                      name="number"
                      value={n}
                      checked={selected === n}
                      onChange={() => setSelected(n)}
                    />
                    <span className="font-mono text-ink">{n}</span>
                    {n === phoneNumber ? <span className="text-xs text-muted-slate">main</span> : null}
                  </label>
                ))}
              </fieldset>
            ) : null}
            <button
              type="submit"
              disabled={loanPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-link-blue px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-link-blue/90 disabled:opacity-50"
            >
              <PhoneForwarded className="h-4 w-4" aria-hidden="true" />
              {loanPending ? "Moving…" : `Move number to ${officeLabel}`}
            </button>
          </form>
        </>
      )}

      {state?.error ? (
        <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          {loan
            ? `${state.number} is back on the customer's line` +
              (state.restoredForwarders ? `, SMS forwarding restored.` : `.`)
            : `${state.number} is now on ${officeLabel} — wait for the call.`}
        </p>
      ) : null}
    </section>
  );
}
