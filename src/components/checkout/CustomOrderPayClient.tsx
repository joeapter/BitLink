"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, LockKeyhole, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { EmbeddedStripeCheckout } from "@/components/checkout/EmbeddedStripeCheckout";
import { PortNumberVerification } from "@/components/checkout/PortNumberVerification";
import { formatMoney, normalizeIsraeliMobile } from "@/lib/utils";
import { getPlan, type PlanSlug } from "@/lib/plans";

type PayLine = {
  planSlug: PlanSlug;
  isEsim: boolean;
  isPortIn: boolean;
  portNumber: string | null;
  wantsIntlNumber: boolean;
  intlCountry: "us" | "canada" | "uk" | null;
  intlSource: "new" | "port" | null;
  intlPortNumber: string | null;
  customPriceCents: number;
};

function lineDescription(line: PayLine) {
  const plan = getPlan(line.planSlug);
  const items = [
    line.isEsim ? "eSIM" : "Physical SIM",
    line.isPortIn && line.portNumber ? `Port ${formatIsraeliPortDisplay(line.portNumber)}` : "New Israeli number",
  ];
  if (line.wantsIntlNumber) {
    const country = (line.intlCountry ?? "us").toUpperCase();
    items.push(line.intlSource === "port" ? `${country} number port` : `${country} number`);
  }
  return `${plan.name} - ${items.join(" - ")}`;
}

function formatIsraeliPortDisplay(value: string) {
  const normalized = normalizeIsraeliMobile(value);
  if (!normalized) return value;
  const local = `0${normalized.slice(4)}`;
  return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
}

export function CustomOrderPayClient({
  token,
  status,
  customerName,
  customerEmail,
  lines,
}: {
  token: string;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  lines: PayLine[];
}) {
  const [verifiedPorts, setVerifiedPorts] = useState<Record<number, string | null>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const portLineIndexes = useMemo(
    () => lines.map((line, index) => line.isPortIn ? index : -1).filter((index) => index >= 0),
    [lines],
  );
  const total = lines.reduce((sum, line) => sum + line.customPriceCents, 0);
  const allPortsVerified = portLineIndexes.every((index) => Boolean(verifiedPorts[index]));

  async function startPayment() {
    setBusy(true);
    setError(null);

    const response = await fetch(`/api/custom-orders/${token}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        verifiedPortNumbers: Object.fromEntries(
          Object.entries(verifiedPorts).filter(([, value]) => Boolean(value)),
        ),
      }),
    });

    const payload = (await response.json()) as { url?: string; clientSecret?: string; added?: boolean; error?: string };
    setBusy(false);

    if (!response.ok || (!payload.url && !payload.clientSecret && !payload.added)) {
      setError(payload.error ?? "Payment could not be started.");
      return;
    }

    if (payload.added) {
      setCompleted(true);
      return;
    }

    if (payload.clientSecret) {
      setClientSecret(payload.clientSecret);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.location.href = payload.url!;
  }

  if (status !== "draft") {
    return (
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-ink/10 bg-white p-8 shadow-soft">
        <EmptyState title="This payment link is no longer open">
          The order status is {status}. Contact BitLink support if this needs to be reopened.
        </EmptyState>
      </section>
    );
  }

  if (completed) {
    return (
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-emerald-200 bg-white p-8 shadow-soft">
        <EmptyState title="Your new lines are being activated">
          The lines were added to the existing monthly subscription and activation has started.
        </EmptyState>
      </section>
    );
  }

  if (clientSecret) {
    return (
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <OrderSummary customerName={customerName} customerEmail={customerEmail} lines={lines} total={total} />
        <EmbeddedStripeCheckout clientSecret={clientSecret} onBack={() => setClientSecret(null)} />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
      <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-white">
            <Phone className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-link-blue">BitLink payment link</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Review and activate your lines.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-slate">
              {customerName ?? customerEmail ?? "Your account"} will receive one combined monthly bill. Each line can still be managed separately.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          {lines.map((line, index) => (
            <div key={index} className="rounded-[1.5rem] border border-ink/10 bg-slate-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-link-blue">Line {index + 1}</p>
                  <h2 className="mt-1 text-xl font-semibold text-ink">{getPlan(line.planSlug).name}</h2>
                  <p className="mt-1 text-sm text-muted-slate">{lineDescription(line)}</p>
                </div>
                <p className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-ink">
                  {formatMoney(line.customPriceCents)}/mo
                </p>
              </div>

              {line.isPortIn && line.portNumber ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-900">
                    <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                    Verify ownership before payment
                  </div>
                  <PortNumberVerification
                    initialNumber={line.portNumber}
                    lockedNumber
                    label={`Line ${index + 1} port number`}
                    onVerified={(number) => setVerifiedPorts((current) => ({ ...current, [index]: number }))}
                  />
                </div>
              ) : (
                <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  New Israeli number will be assigned during activation.
                </div>
              )}
            </div>
          ))}
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        <Button
          type="button"
          size="lg"
          onClick={startPayment}
          disabled={busy || !allPortsVerified}
          className="mt-6"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
          Continue to secure payment
        </Button>
        {!allPortsVerified ? (
          <p className="mt-2 text-xs font-semibold text-amber-800">
            Verify every ported number before payment.
          </p>
        ) : null}
      </section>

      <OrderSummary customerName={customerName} customerEmail={customerEmail} lines={lines} total={total} />
    </div>
  );
}

function OrderSummary({
  customerName,
  customerEmail,
  lines,
  total,
}: {
  customerName: string | null;
  customerEmail: string | null;
  lines: PayLine[];
  total: number;
}) {
  return (
    <aside className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft lg:sticky lg:top-24 lg:self-start">
      <p className="text-sm font-semibold text-link-blue">Monthly bill</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-normal text-ink">{formatMoney(total)}/mo</h2>
      <p className="mt-1 text-sm text-muted-slate">{lines.length} line{lines.length === 1 ? "" : "s"} on one bill</p>
      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-slate">Account</p>
        <p className="mt-2 text-sm font-semibold text-ink">{customerName ?? "BitLink customer"}</p>
        <p className="mt-1 text-xs text-muted-slate">{customerEmail}</p>
      </div>
      <div className="mt-4 grid gap-3">
        {lines.map((line, index) => (
          <div key={index} className="rounded-2xl border border-ink/10 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-ink">Line {index + 1}</p>
              <p className="text-sm font-semibold text-ink">{formatMoney(line.customPriceCents)}</p>
            </div>
            <p className="mt-1 text-xs text-muted-slate">{lineDescription(line)}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
