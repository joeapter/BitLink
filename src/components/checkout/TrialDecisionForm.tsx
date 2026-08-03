"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { plans, isActivationFeeWaivedForPlan, type PlanSlug } from "@/lib/plans";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const DECIDABLE_PLANS: PlanSlug[] = ["basic", "student-5g", "max-5g"];

export function TrialDecisionForm({ token }: { token: string }) {
  const [planSlug, setPlanSlug] = useState<PlanSlug>("student-5g");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const options = plans.filter((p) => DECIDABLE_PLANS.includes(p.slug));

  async function onSubmit() {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/trial/${token}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planSlug }),
    });

    const payload = (await response.json()) as { converted?: boolean; error?: string };
    setLoading(false);

    if (!response.ok || !payload.converted) {
      setError(payload.error ?? "Something went wrong. Please try again.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-4xl border border-ink/10 bg-white p-8 text-center shadow-soft">
        <h2 className="text-2xl font-semibold text-ink">You&apos;re set</h2>
        <p className="mt-3 text-sm leading-6 text-muted-slate">
          Your line keeps running with no gap, on the card you already gave us. No new number, nothing to redo.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-4xl border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
      <fieldset>
        <legend className="text-sm font-semibold text-ink">Choose your plan</legend>
        <div className="mt-3 grid gap-3">
          {options.map((p) => {
            const waived = isActivationFeeWaivedForPlan(p.slug);
            return (
              <label
                key={p.slug}
                className={`flex cursor-pointer items-start justify-between gap-3 rounded-2xl border p-4 transition-colors ${
                  planSlug === p.slug ? "border-link-blue bg-link-blue/5" : "border-ink/10 hover:border-ink/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="planSlug"
                    value={p.slug}
                    checked={planSlug === p.slug}
                    onChange={() => setPlanSlug(p.slug)}
                    className="mt-0.5 accent-link-blue"
                  />
                  <div>
                    <p className="text-sm font-semibold text-ink">{p.name}</p>
                    <p className="text-xs text-muted-slate">{p.comparison.data} data · {p.comparison.calls}</p>
                    {!waived && <p className="mt-1 text-xs text-muted-slate">+ one-time activation fee</p>}
                  </div>
                </div>
                <p className="text-sm font-semibold text-ink">{formatMoney(p.priceCents, p.currency)}/mo</p>
              </label>
            );
          })}
        </div>
      </fieldset>

      {error && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-6">
        <Button type="button" size="lg" disabled={loading} onClick={onSubmit}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Confirm my plan
        </Button>
        <p className="mt-3 text-xs leading-5 text-muted-slate">
          Charged to the card on file — no new checkout, nothing to re-enter.
        </p>
      </div>
    </div>
  );
}
