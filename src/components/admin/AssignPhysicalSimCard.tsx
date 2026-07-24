"use client";

import { useActionState, useState } from "react";
import { CreditCard } from "lucide-react";
import { assignPhysicalSimAction, type ResendState } from "@/lib/admin/line-actions";

// Bind a physical SIM to this line by the ICCID printed on the card. Use it
// when handing a card to a customer in person, or when shipping — grab a card,
// enter its ICCID, and it becomes the line's primary SIM. Shown only for
// physical (non-eSIM) lines.
export function AssignPhysicalSimCard({
  lineId,
  providerLineId,
  currentIccId,
}: {
  lineId: string;
  providerLineId: string;
  currentIccId?: string | null;
}) {
  const [state, action, pending] = useActionState<ResendState, FormData>(assignPhysicalSimAction, null);
  const [iccId, setIccId] = useState("");

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft sm:rounded-4xl sm:p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <CreditCard className="h-5 w-5 text-link-blue" aria-hidden="true" />
        Assign a physical SIM
      </h2>
      <p className="mt-1 text-xs text-muted-slate">
        {currentIccId
          ? "This line already has a SIM assigned. Assigning another replaces which card is the main SIM."
          : "Enter the ICCID printed on the card you're handing over. It becomes this line's main SIM; the number stays the same."}
      </p>

      {currentIccId ? (
        <p className="mt-2 rounded-lg bg-slate-50 px-2 py-1.5 font-mono text-[0.7rem] text-slate-600">
          Current: {currentIccId}
        </p>
      ) : null}

      <form
        action={(fd) => {
          fd.set("iccId", iccId);
          return action(fd);
        }}
        className="mt-3 grid gap-2"
        onSubmit={(e) => {
          if (currentIccId && !window.confirm("This line already has a SIM. Attach a different card as the main SIM?")) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="lineId" value={lineId} />
        <input type="hidden" name="providerLineId" value={providerLineId} />
        <input
          value={iccId}
          onChange={(e) => setIccId(e.target.value)}
          inputMode="numeric"
          placeholder="ICCID, e.g. 8997226000000000000"
          className="h-11 rounded-xl border border-ink/10 bg-slate-50 px-3 font-mono text-sm outline-none focus:border-link-blue"
        />
        <button
          type="submit"
          disabled={pending || iccId.replace(/\s+/g, "").length < 15}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-40"
        >
          {pending ? "Attaching…" : "Attach SIM to this line"}
        </button>
      </form>

      {state?.success ? <p className="mt-2 text-xs font-semibold text-emerald-700">{state.success}</p> : null}
      {state?.error ? <p className="mt-2 text-xs font-semibold text-rose-700">{state.error}</p> : null}
    </section>
  );
}
