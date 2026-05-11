"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function BillingPanel({
  subscriptionStatus,
  nextBillingDate,
}: {
  subscriptionStatus?: string | null;
  nextBillingDate?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/stripe/customer-portal", { method: "POST" });
    const payload = (await response.json()) as { url?: string; error?: string };
    setLoading(false);

    if (!response.ok || !payload.url) {
      setError(payload.error ?? "Billing portal is unavailable.");
      return;
    }

    window.location.href = payload.url;
  }

  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
      <p className="text-sm font-semibold text-link-blue">Billing</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-normal text-ink">Manage your subscription.</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.5rem] bg-slate-50 p-5">
          <p className="text-sm font-semibold text-muted-slate">Payment status</p>
          <div className="mt-3">
            <StatusBadge status={subscriptionStatus ?? "pending"} />
          </div>
        </div>
        <div className="rounded-[1.5rem] bg-slate-50 p-5">
          <p className="text-sm font-semibold text-muted-slate">Next billing date</p>
          <p className="mt-3 text-lg font-semibold text-ink">{nextBillingDate ?? "Pending"}</p>
        </div>
      </div>
      {error ? <div className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div> : null}
      <Button type="button" onClick={openPortal} className="mt-6" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ExternalLink className="h-4 w-4" aria-hidden="true" />}
        Manage billing
      </Button>
    </section>
  );
}
