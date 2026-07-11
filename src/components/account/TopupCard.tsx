"use client";

import { useState, useActionState } from "react";
import { Gift, Loader2 } from "lucide-react";
import { buyTopupAccountAction, type AccountBuyTopupState } from "@/lib/account/topup-actions";
import { getTopUpsForPlan } from "@/lib/topups";
import { formatMoney } from "@/lib/utils";

export function TopupCard({
  lineId,
  status,
  isKosher,
}: {
  lineId: string;
  status: string;
  isKosher: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<AccountBuyTopupState, FormData>(
    buyTopupAccountAction,
    null,
  );
  const options = getTopUpsForPlan(isKosher);

  if (status !== "active" || !options.length) return null;

  return (
    <div className="mt-3 rounded-xl border border-ink/10 bg-white p-4">
      {!open ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-muted-slate" aria-hidden="true" />
            <p className="text-sm text-muted-slate">
              <span className="font-semibold text-ink">Need more data or minutes?</span> Buy a topup, valid 30 days.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-slate-50"
          >
            Buy a topup
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm font-semibold text-ink">Buy a topup</p>
          <p className="mt-1 text-xs text-muted-slate">Charged immediately to your card on file, valid for 30 days.</p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {options.map((topup) => (
              <form key={topup.id} action={formAction}>
                <input type="hidden" name="lineId" value={lineId} />
                <input type="hidden" name="topupId" value={topup.id} />
                <button
                  type="submit"
                  disabled={pending}
                  className="flex w-full items-center justify-between gap-2 rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-left text-sm transition hover:border-link-blue/40 disabled:opacity-50"
                >
                  <span>
                    <span className="font-semibold text-ink">{topup.name}</span>
                    {topup.badge ? (
                      <span className="ml-1.5 rounded-full bg-link-blue/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-link-blue">{topup.badge}</span>
                    ) : null}
                  </span>
                  <span className="font-semibold text-ink">{formatMoney(topup.priceCents)}</span>
                </button>
              </form>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 text-xs font-semibold text-muted-slate transition hover:text-ink"
          >
            Never mind
          </button>

          {pending ? (
            <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted-slate">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Charging your card…
            </p>
          ) : null}
          {state?.error ? <p className="mt-3 text-xs font-semibold text-rose-700">{state.error}</p> : null}
          {state?.success ? <p className="mt-3 text-xs font-semibold text-emerald-700">{state.success}</p> : null}
        </div>
      )}
    </div>
  );
}
