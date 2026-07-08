"use client";

import { useState } from "react";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatMoney } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AccountLineBilling } from "@/lib/db/account";

export type InvoiceRow = {
  id: string;
  number: string | null;
  amountPaid: number;
  currency: string;
  status: string | null;
  created: number;
  invoicePdf: string | null;
  hostedInvoiceUrl: string | null;
};

export function BillingPanel({
  subscriptionStatus,
  nextBillingDate,
  invoices = [],
  lineBillings = [],
}: {
  subscriptionStatus?: string | null;
  nextBillingDate?: string | null;
  invoices?: InvoiceRow[];
  lineBillings?: AccountLineBilling[];
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
    <div className="grid gap-6">
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

      <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
        <p className="text-sm font-semibold text-link-blue">Line billing</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal text-ink">Monthly subscriptions</h2>
        {lineBillings.length ? (
          <div className="mt-6 grid gap-3">
            {lineBillings.map((line) => (
              <div key={line.stripeSubscriptionItemId ?? line.lineId ?? line.stripeSubscriptionId} className="rounded-[1.5rem] bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{line.planName}</p>
                    <p className="mt-1 font-mono text-xs text-muted-slate">
                      {line.lineId ? `Line ${line.lineId.slice(0, 8)}` : "Line pending"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-ink">
                      {formatMoney(line.priceCents, line.currency)}
                      <span className="text-sm text-muted-slate">/mo</span>
                    </p>
                    <StatusBadge status={line.subscriptionStatus ?? line.subscriberStatus} />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-slate">
                  <span>{line.stripeSubscriptionItemId ? `Item ${line.stripeSubscriptionItemId.slice(0, 12)}` : `Subscription ${line.stripeSubscriptionId.slice(0, 12)}`}</span>
                  {line.nextBillingDate ? (
                    <span>Next bill {new Date(line.nextBillingDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState title="No active line subscriptions">
              Add a line from your account portal to see per-line billing here.
            </EmptyState>
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
        <p className="text-sm font-semibold text-link-blue">Payment history</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal text-ink">Invoices</h2>

        {invoices.length ? (
          <div className="mt-6 grid gap-3">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] bg-slate-50 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {formatMoney(inv.amountPaid, inv.currency.toUpperCase())}
                    {inv.number ? <span className="ml-2 font-normal text-muted-slate">#{inv.number}</span> : null}
                  </p>
                  <p className="text-xs text-muted-slate">
                    {new Date(inv.created * 1000).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={inv.status} />
                  {inv.invoicePdf ? (
                    <a
                      href={inv.invoicePdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-100 transition"
                    >
                      <Download className="h-3 w-3" aria-hidden="true" />
                      PDF
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState title="No invoices yet">
              Your billing history will appear here after your first payment.
            </EmptyState>
          </div>
        )}
      </section>
    </div>
  );
}
