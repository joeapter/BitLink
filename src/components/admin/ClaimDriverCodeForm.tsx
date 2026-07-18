"use client";

import { useActionState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { claimDriverCodeAction, type ClaimDriverCodeState } from "@/lib/admin/driver-code-actions";

// Built for one situation: Joe standing at Ben Gurion arrivals, phone in hand,
// driver waiting. Pick the code off the top card of the stack, type a name and
// number, done.
export function ClaimDriverCodeForm({ unclaimedCodes }: { unclaimedCodes: string[] }) {
  const [state, formAction, pending] = useActionState<ClaimDriverCodeState, FormData>(
    claimDriverCodeAction,
    null,
  );

  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
      <h2 className="text-lg font-semibold text-ink">Claim a card stack for a driver</h2>
      <p className="mt-1 text-xs text-muted-slate">
        The code is printed under the QR on the card. Claiming links the whole stack to this driver.
      </p>

      <form action={formAction} className="mt-4 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-semibold text-ink">
            <span>Card code</span>
            <select
              name="code"
              required
              className="h-11 rounded-xl border border-ink/10 bg-white px-3 font-mono text-sm font-semibold text-ink outline-none focus:border-link-blue"
            >
              <option value="">Choose code…</option>
              {unclaimedCodes.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-ink">
            <span>Driver name</span>
            <input
              name="driverName"
              required
              placeholder="Moshe"
              className="h-11 rounded-xl border border-ink/10 bg-white px-3 text-sm text-ink outline-none focus:border-link-blue"
            />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-ink">
            <span>Phone</span>
            <input
              name="driverPhone"
              type="tel"
              placeholder="05x-xxx-xxxx"
              className="h-11 rounded-xl border border-ink/10 bg-white px-3 text-sm text-ink outline-none focus:border-link-blue"
            />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-ink">
            <span>Email (optional)</span>
            <input
              name="driverEmail"
              type="email"
              placeholder="driver@example.com"
              className="h-11 rounded-xl border border-ink/10 bg-white px-3 text-sm text-ink outline-none focus:border-link-blue"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-50 sm:w-fit"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
          {pending ? "Claiming…" : "Claim for driver"}
        </button>
      </form>

      {state?.error ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{state.error}</p> : null}
      {state?.success ? <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{state.success}</p> : null}
    </section>
  );
}
