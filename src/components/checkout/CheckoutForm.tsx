"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { plans, type PlanSlug } from "@/lib/plans";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CheckoutSummary } from "./CheckoutSummary";

export function CheckoutForm({ initialPlanSlug }: { initialPlanSlug: PlanSlug }) {
  const [planSlug, setPlanSlug] = useState<PlanSlug>(initialPlanSlug);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.slug === planSlug) ?? plans[1],
    [planSlug],
  );

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planSlug,
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        referralCode: formData.get("referralCode"),
      }),
    });

    const payload = (await response.json()) as { url?: string; error?: string };
    setLoading(false);

    if (!response.ok || !payload.url) {
      setError(payload.error ?? "Checkout could not be started. Please try again.");
      return;
    }

    window.location.href = payload.url;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
      <form action={onSubmit} className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
        <div>
          <p className="text-sm font-semibold text-link-blue">Checkout</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
            Checkout securely. We&apos;ll get your connection moving.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-slate">
            Enter your details, confirm the plan, and continue to secure payment. Your monthly price and plan are shown before you pay.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Select
            label="Plan"
            name="planSlug"
            value={planSlug}
            onChange={(event) => setPlanSlug(event.target.value as PlanSlug)}
            className="sm:col-span-2"
          >
            {plans.map((plan) => (
              <option key={plan.slug} value={plan.slug}>
                {plan.name}
              </option>
            ))}
          </Select>
          <Input label="Full name" name="fullName" autoComplete="name" required />
          <Input label="Email" name="email" type="email" autoComplete="email" required />
          <Input label="Phone" name="phone" type="tel" autoComplete="tel" required />
          <Input label="Referral code" name="referralCode" placeholder="Optional" />
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Continue to secure payment
          </Button>
          <p className="text-xs leading-5 text-muted-slate">
            Monthly subscription. Activation subject to BitLink confirmation and plan availability.
          </p>
        </div>
      </form>

      <CheckoutSummary plan={selectedPlan} />
    </div>
  );
}
