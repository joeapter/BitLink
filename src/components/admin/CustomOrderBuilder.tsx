"use client";

import { useMemo, useState } from "react";
import { Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatMoney } from "@/lib/utils";
import { getPlan, plans, type PlanSlug } from "@/lib/plans";

type CustomerOption = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
};

type IntlCountry = "us" | "canada" | "uk";
type IntlSource = "new" | "port";

type BuilderLine = {
  id: string;
  planSlug: PlanSlug;
  isEsim: boolean;
  isPortIn: boolean;
  portNumber: string;
  wantsIntlNumber: boolean;
  intlCountry: IntlCountry;
  intlSource: IntlSource;
  intlPortNumber: string;
  customPrice: string;
};

function newLine(): BuilderLine {
  const plan = getPlan("student-5g");
  return {
    id: crypto.randomUUID(),
    planSlug: plan.slug,
    isEsim: true,
    isPortIn: false,
    portNumber: "",
    wantsIntlNumber: false,
    intlCountry: "us",
    intlSource: "new",
    intlPortNumber: "",
    customPrice: (plan.priceCents / 100).toFixed(2),
  };
}

function dollarsToCents(value: string): number {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

function lineLabel(line: BuilderLine) {
  const plan = getPlan(line.planSlug);
  const parts = [plan.name];
  if (line.isPortIn) parts.push("port");
  if (line.wantsIntlNumber) parts.push(`${line.intlCountry.toUpperCase()} ${line.intlSource}`);
  return parts.join(" - ");
}

export function CustomOrderBuilder({
  customers,
  initialCustomerId,
}: {
  customers: CustomerOption[];
  initialCustomerId?: string | null;
}) {
  const [customerMode, setCustomerMode] = useState<"existing" | "new">(initialCustomerId ? "existing" : "existing");
  const [customerId, setCustomerId] = useState(initialCustomerId ?? customers[0]?.id ?? "");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<BuilderLine[]>([newLine()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  const selectedCustomer = customers.find((customer) => customer.id === customerId);
  const total = useMemo(
    () => lines.reduce((sum, line) => sum + dollarsToCents(line.customPrice), 0),
    [lines],
  );

  function updateLine(id: string, patch: Partial<BuilderLine>) {
    setLines((current) =>
      current.map((line) => {
        if (line.id !== id) return line;
        const next = { ...line, ...patch };
        const plan = getPlan(next.planSlug);
        if (patch.planSlug) {
          next.customPrice = (plan.priceCents / 100).toFixed(2);
          if (plan.isKosher) next.isEsim = false;
        }
        return next;
      }),
    );
  }

  async function createOrder() {
    setBusy(true);
    setError(null);
    setCreatedUrl(null);

    const response = await fetch("/api/admin/custom-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: customerMode === "existing"
          ? { id: customerId }
          : { fullName, email, phone },
        note,
        lines: lines.map((line) => ({
          planSlug: line.planSlug,
          isEsim: line.isEsim,
          isPortIn: line.isPortIn,
          portNumber: line.isPortIn ? line.portNumber : null,
          wantsIntlNumber: line.wantsIntlNumber,
          intlCountry: line.wantsIntlNumber ? line.intlCountry : null,
          intlSource: line.wantsIntlNumber ? line.intlSource : null,
          intlPortNumber: line.wantsIntlNumber && line.intlSource === "port" ? line.intlPortNumber : null,
          customPriceCents: dollarsToCents(line.customPrice),
        })),
      }),
    });

    const payload = (await response.json()) as { url?: string; error?: string };
    setBusy(false);

    if (!response.ok || !payload.url) {
      setError(payload.error ?? "Could not create the payment link.");
      return;
    }

    setCreatedUrl(payload.url);
  }

  async function copyLink() {
    if (!createdUrl) return;
    await navigator.clipboard.writeText(createdUrl).catch(() => {});
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_21rem]">
      <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
        <div>
          <p className="text-sm font-semibold text-link-blue">Custom order</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Build a multi-line payment link</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-slate">
            Create one combined monthly subscription. Each row becomes its own line and subscription item.
          </p>
        </div>

        <div className="mt-8 grid gap-4 rounded-[1.5rem] border border-ink/10 bg-slate-50 p-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCustomerMode("existing")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                customerMode === "existing" ? "bg-ink text-white" : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              Existing customer
            </button>
            <button
              type="button"
              onClick={() => setCustomerMode("new")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                customerMode === "new" ? "bg-ink text-white" : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              New customer
            </button>
          </div>

          {customerMode === "existing" ? (
            <Select label="Customer" value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.fullName || "Unnamed"} - {customer.email || "no email"}
                </option>
              ))}
            </Select>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <Input label="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
              <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              <Input label="Phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>
          )}
          <Input label="Internal note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional" />
        </div>

        <div className="mt-6 grid gap-4">
          {lines.map((line, index) => {
            const plan = getPlan(line.planSlug);
            return (
              <div key={line.id} className="rounded-[1.5rem] border border-ink/10 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">Line {index + 1}</p>
                    <p className="mt-1 text-xs text-muted-slate">{lineLabel(line)}</p>
                  </div>
                  {lines.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setLines((current) => current.filter((item) => item.id !== line.id))}
                      className="grid h-9 w-9 place-items-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                      aria-label={`Remove line ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <Select
                    label="Plan"
                    value={line.planSlug}
                    onChange={(event) => updateLine(line.id, { planSlug: event.target.value as PlanSlug })}
                  >
                    {plans.map((item) => (
                      <option key={item.slug} value={item.slug}>{item.name}</option>
                    ))}
                  </Select>
                  <Select
                    label="SIM"
                    value={line.isEsim ? "esim" : "physical"}
                    disabled={plan.isKosher}
                    onChange={(event) => updateLine(line.id, { isEsim: event.target.value === "esim" })}
                  >
                    <option value="esim">eSIM</option>
                    <option value="physical">Physical SIM</option>
                  </Select>
                  <Input
                    label="Monthly price"
                    type="number"
                    min="1"
                    step="0.01"
                    value={line.customPrice}
                    onChange={(event) => updateLine(line.id, { customPrice: event.target.value })}
                  />
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/10 bg-slate-50 p-4">
                    <input
                      type="checkbox"
                      checked={line.isPortIn}
                      onChange={(event) => updateLine(line.id, { isPortIn: event.target.checked })}
                      className="mt-1 accent-link-blue"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-ink">Port Israeli number</span>
                      <span className="block text-xs text-muted-slate">Customer verifies by SMS on the pay link.</span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/10 bg-slate-50 p-4">
                    <input
                      type="checkbox"
                      checked={line.wantsIntlNumber}
                      onChange={(event) => updateLine(line.id, { wantsIntlNumber: event.target.checked })}
                      className="mt-1 accent-link-blue"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-ink">US/CA/UK number</span>
                      <span className="block text-xs text-muted-slate">New number or manual port request.</span>
                    </span>
                  </label>
                </div>

                {line.isPortIn ? (
                  <div className="mt-4">
                    <Input
                      label="Israeli number to port"
                      type="tel"
                      value={line.portNumber}
                      onChange={(event) => updateLine(line.id, { portNumber: event.target.value })}
                      placeholder="058-728-0062"
                    />
                  </div>
                ) : null}

                {line.wantsIntlNumber ? (
                  <div className="mt-4 grid gap-4 rounded-2xl border border-link-blue/20 bg-link-blue/5 p-4 lg:grid-cols-3">
                    <Select
                      label="Country"
                      value={line.intlCountry}
                      onChange={(event) => updateLine(line.id, { intlCountry: event.target.value as IntlCountry })}
                    >
                      <option value="us">US</option>
                      <option value="canada">Canada</option>
                      <option value="uk">UK</option>
                    </Select>
                    <Select
                      label="Number"
                      value={line.intlSource}
                      onChange={(event) => updateLine(line.id, { intlSource: event.target.value as IntlSource })}
                    >
                      <option value="new">Assign new</option>
                      <option value="port">Port existing</option>
                    </Select>
                    {line.intlSource === "port" ? (
                      <Input
                        label="Intl number to port"
                        type="tel"
                        value={line.intlPortNumber}
                        onChange={(event) => updateLine(line.id, { intlPortNumber: event.target.value })}
                        placeholder="+1 212 555 0000"
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        {createdUrl ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">Payment link created</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <a href={createdUrl} className="break-all font-mono text-xs text-emerald-900 hover:underline" target="_blank" rel="noreferrer">
                {createdUrl}
              </a>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                Copy
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" onClick={() => setLines((current) => [...current, newLine()])}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add another line
          </Button>
          <Button type="button" onClick={createOrder} disabled={busy || (customerMode === "existing" && !customerId)}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Create payment link
          </Button>
        </div>
      </section>

      <aside className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft xl:sticky xl:top-24 xl:self-start">
        <p className="text-sm font-semibold text-link-blue">Order summary</p>
        <div className="mt-4 grid gap-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-slate">Customer</p>
            <p className="mt-2 text-sm font-semibold text-ink">
              {customerMode === "existing" ? (selectedCustomer?.fullName ?? selectedCustomer?.email ?? "Select customer") : (fullName || email || "New customer")}
            </p>
            <p className="mt-1 text-xs text-muted-slate">
              {customerMode === "existing" ? selectedCustomer?.email : email}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-slate">Monthly total</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{formatMoney(total)}</p>
            <p className="mt-1 text-xs text-muted-slate">{lines.length} line{lines.length === 1 ? "" : "s"} in one Stripe subscription</p>
          </div>
          {lines.map((line, index) => (
            <div key={line.id} className="rounded-2xl border border-ink/10 p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-ink">Line {index + 1}</p>
                <span className="font-semibold text-ink">{formatMoney(dollarsToCents(line.customPrice))}</span>
              </div>
              <p className="mt-1 text-xs text-muted-slate">{lineLabel(line)}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
