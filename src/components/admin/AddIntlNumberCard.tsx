"use client";

import { useState, useActionState } from "react";
import { Globe2, Loader2, PlusCircle } from "lucide-react";
import { IntlNumberPicker } from "@/components/checkout/IntlNumberPicker";
import { addIntlNumberToLineAdminAction, type AdminAddIntlNumberState } from "@/lib/admin/line-actions";

type IntlCountry = "us" | "canada" | "uk";

type ExistingIntlNumber = {
  country: string;
  number: string;
  status: string;
  billingMode?: string;
} | null;

export function AddIntlNumberCard({
  lineId,
  existingIntlNumber,
}: {
  lineId: string;
  existingIntlNumber: ExistingIntlNumber;
}) {
  const [country, setCountry] = useState<IntlCountry>("us");
  const [chosenNumber, setChosenNumber] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<AdminAddIntlNumberState, FormData>(
    addIntlNumberToLineAdminAction,
    null,
  );

  if (existingIntlNumber?.status === "assigned" || existingIntlNumber?.status === "reserved") {
    return (
      <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Globe2 className="h-4 w-4 text-link-blue" />
          International number
        </h2>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-4 text-sm">
          <div>
            <p className="font-semibold text-ink">{existingIntlNumber.number}</p>
            <p className="text-xs text-muted-slate">{existingIntlNumber.country.toUpperCase()}</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            {existingIntlNumber.billingMode === "free" ? "Free" : "Paid"}
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <Globe2 className="h-4 w-4 text-link-blue" />
        Add international number
      </h2>
      <p className="mt-1 text-xs text-muted-slate">
        Attaches immediately at the carrier. Choose whether to charge the customer&apos;s subscription or give it for free.
      </p>

      <form action={formAction} className="mt-4 grid gap-4">
        <input type="hidden" name="lineId" value={lineId} />
        <input type="hidden" name="number" value={chosenNumber ?? ""} />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-semibold text-ink">
            <span>Country</span>
            <select
              name="country"
              value={country}
              onChange={(event) => {
                setCountry(event.target.value as IntlCountry);
                setChosenNumber(null);
              }}
              className="h-10 rounded-xl border border-ink/10 bg-white px-3 text-xs font-semibold text-ink outline-none focus:border-link-blue"
            >
              <option value="us">US</option>
              <option value="canada">Canada</option>
              <option value="uk">UK</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-ink">
            <span>Billing</span>
            <select
              name="billingMode"
              defaultValue="paid"
              className="h-10 rounded-xl border border-ink/10 bg-white px-3 text-xs font-semibold text-ink outline-none focus:border-link-blue"
            >
              <option value="paid">Charge subscription (prorated)</option>
              <option value="free">Give for free</option>
            </select>
          </label>
        </div>

        <IntlNumberPicker
          endpoint={`/api/admin/international-numbers?country=${country}`}
          country={country}
          label="Pick a number for this line"
          onChosen={setChosenNumber}
        />

        <button
          type="submit"
          disabled={pending || !chosenNumber}
          className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink/90 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />}
          {pending ? "Adding…" : "Add number"}
        </button>
      </form>

      {state?.error ? <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{state.error}</p> : null}
      {state?.success ? <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{state.success}</p> : null}
    </section>
  );
}
