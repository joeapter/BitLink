"use client";

import { useState, useActionState } from "react";
import { Globe2, PlusCircle } from "lucide-react";
import { IntlNumberPicker } from "@/components/checkout/IntlNumberPicker";
import { usCanadaNumberAddOn } from "@/lib/plans";
import { formatMoney } from "@/lib/utils";
import {
  addIntlNumberToLineAccountAction,
  type AccountAddIntlNumberState,
} from "@/lib/account/intl-number-actions";

type IntlCountry = "us" | "canada" | "uk";

export function AddIntlNumberCard({
  lineId,
  status,
  existingNumber,
}: {
  lineId: string;
  status: string;
  existingNumber: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState<IntlCountry>("us");
  const [chosenNumber, setChosenNumber] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<AccountAddIntlNumberState, FormData>(
    addIntlNumberToLineAccountAction,
    null,
  );

  if (status !== "active" || existingNumber) return null;

  return (
    <div className="mt-3 rounded-xl border border-ink/10 bg-white p-4">
      {state?.success ? (
        <p className="text-sm font-semibold text-emerald-700">{state.success}</p>
      ) : !open ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-muted-slate" aria-hidden="true" />
            <p className="text-sm text-muted-slate">
              <span className="font-semibold text-ink">Add a US, Canadian, or UK number</span> for{" "}
              {formatMoney(usCanadaNumberAddOn.priceCents)}/mo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-slate-50"
          >
            Add a number
          </button>
        </div>
      ) : (
        <form action={formAction}>
          <p className="text-sm font-semibold text-ink">
            Add a US, Canadian, or UK number — {formatMoney(usCanadaNumberAddOn.priceCents)}/mo
          </p>
          <p className="mt-1 text-xs text-muted-slate">
            Prorated for the rest of this month, then billed together with this line going forward.
          </p>

          <input type="hidden" name="lineId" value={lineId} />
          <input type="hidden" name="number" value={chosenNumber ?? ""} />

          <div className="mt-3 grid gap-3">
            <label className="grid gap-1.5 text-xs font-semibold text-ink">
              <span>Country</span>
              <select
                name="country"
                value={country}
                onChange={(event) => {
                  setCountry(event.target.value as IntlCountry);
                  setChosenNumber(null);
                }}
                className="h-10 w-full max-w-[12rem] rounded-xl border border-ink/15 bg-white px-3 text-xs font-semibold text-ink outline-none focus:border-link-blue"
              >
                <option value="us">US</option>
                <option value="canada">Canada</option>
                <option value="uk">UK</option>
              </select>
            </label>

            <IntlNumberPicker
              endpoint={`/api/account/international-numbers?country=${country}`}
              country={country}
              label="Pick the number your family and friends will dial"
              onChosen={setChosenNumber}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={pending || !chosenNumber}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink/90 disabled:opacity-60"
            >
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              {pending ? "Adding…" : "Add number"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-muted-slate transition hover:text-ink"
            >
              Never mind
            </button>
          </div>
          {state?.error ? <p className="mt-3 text-xs font-semibold text-rose-700">{state.error}</p> : null}
        </form>
      )}
    </div>
  );
}
