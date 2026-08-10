"use client";

import { useMemo, useState } from "react";
import { Copy, KeyRound, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { IntlNumberPicker } from "@/components/checkout/IntlNumberPicker";
import { PhysicalSimDeliveryPicker } from "@/components/checkout/PhysicalSimDeliveryPicker";
import {
  emptyDeliveryDetails,
  resolveDeliveryCity,
  resolveDeliveryMethod,
  isDeliveryDetailsComplete,
  type PhysicalSimDeliveryDetails,
} from "@/lib/delivery";
import { formatMoney } from "@/lib/utils";
import { getPlan, plans, type PlanSlug } from "@/lib/plans";
import { topups as topupCatalog } from "@/lib/topups";

type CustomerOption = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
};

type IntlCountry = "us" | "canada" | "uk";
type IntlSource = "new" | "port";

type BuilderTopup = {
  id: string;
  topupId: string;
  customPrice: string;
};

type BuilderLine = {
  id: string;
  planSlug: PlanSlug;
  isEsim: boolean;
  iccId: string;
  delivery: PhysicalSimDeliveryDetails;
  isPortIn: boolean;
  portNumber: string;
  wantsIntlNumber: boolean;
  intlCountry: IntlCountry;
  intlSource: IntlSource;
  intlPortNumber: string;
  intlChosenNumber: string;
  customPrice: string;
  topups: BuilderTopup[];
};

function newLine(): BuilderLine {
  const plan = getPlan("student-5g");
  return {
    id: crypto.randomUUID(),
    planSlug: plan.slug,
    isEsim: true,
    iccId: "",
    delivery: emptyDeliveryDetails,
    isPortIn: false,
    portNumber: "",
    wantsIntlNumber: false,
    intlCountry: "us",
    intlSource: "new",
    intlPortNumber: "",
    intlChosenNumber: "",
    customPrice: (plan.priceCents / 100).toFixed(2),
    topups: [],
  };
}

function newTopup(): BuilderTopup {
  const first = topupCatalog[0];
  return { id: crypto.randomUUID(), topupId: first.id, customPrice: (first.priceCents / 100).toFixed(2) };
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
  if (line.topups.length) parts.push(`+${line.topups.length} topup${line.topups.length === 1 ? "" : "s"}`);
  return parts.join(" - ");
}

function lineTotalCents(line: BuilderLine): number {
  return dollarsToCents(line.customPrice) + line.topups.reduce((sum, t) => sum + dollarsToCents(t.customPrice), 0);
}

function generateCustomerPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const values = new Uint32Array(14);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => chars[value % chars.length]).join("");
}

export function CustomOrderBuilder({
  customers,
  initialCustomerId,
  customersWithActiveSubscription = [],
}: {
  customers: CustomerOption[];
  initialCustomerId?: string | null;
  // Customer IDs with a locally-known active/trialing subscription — offers
  // "add to existing billing" as an alternative to always creating a new
  // payment link. Re-verified live against Stripe at actual submit time.
  customersWithActiveSubscription?: string[];
}) {
  const [customerMode, setCustomerMode] = useState<"existing" | "new">(initialCustomerId ? "existing" : "existing");
  const [customerId, setCustomerId] = useState(initialCustomerId ?? customers[0]?.id ?? "");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<BuilderLine[]>([newLine()]);
  const [addMode, setAddMode] = useState<"new-link" | "existing-billing">("new-link");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);
  const [loginEmailNotice, setLoginEmailNotice] = useState<{ tone: "success" | "warning"; message: string } | null>(null);
  // Days before the first real charge — card saved at checkout, subscription
  // sits in Stripe "trialing" status, lines provision/ship immediately.
  // Empty = bill right away (existing behavior). Only applies to a brand-new
  // payment link, not "add to existing billing" (that customer already pays).
  const [trialDays, setTrialDays] = useState("");

  const selectedCustomer = customers.find((customer) => customer.id === customerId);
  const canAddToExisting = customerMode === "existing" && customersWithActiveSubscription.includes(customerId);
  const effectiveMode = canAddToExisting ? addMode : "new-link";
  const total = useMemo(() => lines.reduce((sum, line) => sum + lineTotalCents(line), 0), [lines]);
  const newCustomerIncomplete = customerMode === "new" && (!email.trim() || accountPassword.length < 8);

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

  function addTopup(lineId: string) {
    setLines((current) =>
      current.map((line) => (line.id === lineId ? { ...line, topups: [...line.topups, newTopup()] } : line)),
    );
  }

  function updateTopup(lineId: string, topupRowId: string, patch: Partial<BuilderTopup>) {
    setLines((current) =>
      current.map((line) => {
        if (line.id !== lineId) return line;
        return {
          ...line,
          topups: line.topups.map((t) => {
            if (t.id !== topupRowId) return t;
            const next = { ...t, ...patch };
            if (patch.topupId) {
              const catalogTopup = topupCatalog.find((c) => c.id === patch.topupId);
              if (catalogTopup) next.customPrice = (catalogTopup.priceCents / 100).toFixed(2);
            }
            return next;
          }),
        };
      }),
    );
  }

  function removeTopup(lineId: string, topupRowId: string) {
    setLines((current) =>
      current.map((line) =>
        line.id === lineId ? { ...line, topups: line.topups.filter((t) => t.id !== topupRowId) } : line,
      ),
    );
  }

  function buildLinePayload() {
    return lines.map((line) => ({
      planSlug: line.planSlug,
      isEsim: line.isEsim,
      iccId: line.isEsim ? null : (line.iccId.trim() || null),
      delivery: !line.isEsim && isDeliveryDetailsComplete(line.delivery) ? {
        method: resolveDeliveryMethod(resolveDeliveryCity(line.delivery)),
        city: resolveDeliveryCity(line.delivery),
        addressLine1: line.delivery.addressLine1,
        addressLine2: line.delivery.addressLine2 || null,
        requestedDate: line.delivery.requestedDate || null,
      } : null,
      isPortIn: line.isPortIn,
      portNumber: line.isPortIn ? line.portNumber : null,
      wantsIntlNumber: line.wantsIntlNumber,
      intlCountry: line.wantsIntlNumber ? line.intlCountry : null,
      intlSource: line.wantsIntlNumber ? line.intlSource : null,
      intlPortNumber: line.wantsIntlNumber && line.intlSource === "port" ? line.intlPortNumber : null,
      intlChosenNumber: line.wantsIntlNumber && line.intlSource === "new" ? (line.intlChosenNumber || null) : null,
      customPriceCents: dollarsToCents(line.customPrice),
      topups: line.topups.map((t) => ({ topupId: t.topupId, customPriceCents: dollarsToCents(t.customPrice) })),
    }));
  }

  async function createOrder() {
    setBusy(true);
    setError(null);
    setCreatedUrl(null);
    setAddedMessage(null);
    setLoginEmailNotice(null);

    if (effectiveMode === "existing-billing") {
      const response = await fetch("/api/admin/custom-orders/add-to-existing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, lines: buildLinePayload() }),
      });
      const payload = (await response.json()) as { added?: boolean; lineIds?: string[]; error?: string };
      setBusy(false);

      if (!response.ok || !payload.added) {
        setError(payload.error ?? "Could not add these lines to the existing subscription.");
        return;
      }

      const name = selectedCustomer?.fullName || selectedCustomer?.email || "the customer";
      setAddedMessage(
        `${lines.length} line${lines.length === 1 ? "" : "s"} added directly to ${name}'s existing subscription — billed immediately, no payment link needed. Provisioning has started.`,
      );
      return;
    }

    const response = await fetch("/api/admin/custom-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: customerMode === "existing"
          ? { id: customerId }
          : { fullName, email, phone, accountPassword },
        note,
        lines: buildLinePayload(),
        trialDays: trialDays.trim() ? Number(trialDays) : null,
      }),
    });

    const payload = (await response.json()) as {
      url?: string;
      error?: string;
      loginEmailSent?: boolean | null;
      loginEmailWarning?: string | null;
    };
    setBusy(false);

    if (!response.ok || !payload.url) {
      setError(payload.error ?? "Could not create the payment link.");
      return;
    }

    setCreatedUrl(payload.url);
    if (payload.loginEmailWarning) {
      setLoginEmailNotice({ tone: "warning", message: payload.loginEmailWarning });
    } else if (payload.loginEmailSent) {
      setLoginEmailNotice({ tone: "success", message: "Login email sent with the customer's BitLink account details." });
    }
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
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Input label="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
              <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              <Input label="Phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
              <div className="grid gap-2">
                <Input
                  label="Create password"
                  type="text"
                  autoComplete="new-password"
                  value={accountPassword}
                  onChange={(event) => setAccountPassword(event.target.value)}
                  placeholder="8+ characters"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="justify-self-start"
                  onClick={() => setAccountPassword(generateCustomerPassword())}
                >
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  Generate
                </Button>
              </div>
            </div>
          )}

          {canAddToExisting && (
            <div className="grid gap-2 rounded-2xl border border-link-blue/20 bg-link-blue/5 p-3">
              <p className="text-xs font-semibold text-ink">
                {selectedCustomer?.fullName || selectedCustomer?.email} already has an active subscription
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAddMode("existing-billing")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    addMode === "existing-billing" ? "bg-ink text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Add to existing billing
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode("new-link")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    addMode === "new-link" ? "bg-ink text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Create a new payment link
                </button>
              </div>
              <p className="text-xs text-muted-slate">
                {addMode === "existing-billing"
                  ? "Bills immediately with proration, no separate link — the customer's next invoice reflects the new line(s)."
                  : "Starts a separate subscription with its own payment link, even though this customer already has one."}
              </p>
            </div>
          )}

          <Input label="Internal note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional" />

          {effectiveMode === "new-link" ? (
            <div className="grid gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <Input
                label="Free trial — delay first charge (days)"
                type="number"
                min="1"
                max="90"
                value={trialDays}
                onChange={(event) => setTrialDays(event.target.value)}
                placeholder="Leave blank to bill immediately"
              />
              <p className="text-xs text-amber-800">
                Card is saved and verified now, nothing is charged. Lines still provision and ship immediately.
                Stripe auto-charges the saved card the day the trial ends — no follow-up needed.
              </p>
            </div>
          ) : null}
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

                {!line.isEsim ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <Input
                      label="Physical SIM ICCID"
                      value={line.iccId}
                      onChange={(event) => updateLine(line.id, { iccId: event.target.value })}
                      placeholder="ICCID printed on the card, e.g. 8997226000000000000"
                    />
                    <p className="mt-1.5 text-xs text-amber-800">
                      Enter the card you&apos;re handing over now to activate the line on it. Leave blank for a mailed
                      order and assign the SIM later from the line page.
                    </p>
                    <div className="mt-4">
                      <PhysicalSimDeliveryPicker
                        value={line.delivery}
                        onChange={(next) => updateLine(line.id, { delivery: next })}
                        idPrefix={`delivery-${line.id}`}
                      />
                      <p className="mt-1.5 text-xs text-amber-800">
                        Optional here — fill in if you already have the address, or leave blank and the
                        customer&apos;s fulfillment stays untracked until you add it on the line page.
                      </p>
                    </div>
                  </div>
                ) : null}

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

                {line.wantsIntlNumber && line.intlSource === "new" ? (
                  line.intlChosenNumber ? (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                      <span>Picked: {line.intlChosenNumber}</span>
                      <button
                        type="button"
                        onClick={() => updateLine(line.id, { intlChosenNumber: "" })}
                        className="text-xs font-semibold text-emerald-700 underline decoration-dotted"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-ink/10 bg-slate-50 p-4">
                      <p className="mb-3 text-xs text-muted-slate">
                        Optional — pick a number now, or leave blank and the customer chooses one on the payment link.
                      </p>
                      <IntlNumberPicker
                        endpoint={`/api/admin/international-numbers?country=${line.intlCountry}`}
                        country={line.intlCountry}
                        label="Pick a number for this line"
                        onChosen={(number) => updateLine(line.id, { intlChosenNumber: number ?? "" })}
                      />
                    </div>
                  )
                ) : null}

                <div className="mt-4 rounded-2xl border border-ink/10 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">Carrier topups</p>
                    <Button type="button" variant="secondary" size="sm" onClick={() => addTopup(line.id)}>
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      Add topup
                    </Button>
                  </div>
                  {line.topups.length ? (
                    <div className="mt-3 grid gap-3">
                      {line.topups.map((topup) => (
                        <div key={topup.id} className="grid items-end gap-3 sm:grid-cols-[1fr_auto_auto]">
                          <Select
                            label="Topup"
                            value={topup.topupId}
                            onChange={(event) => updateTopup(line.id, topup.id, { topupId: event.target.value })}
                          >
                            {topupCatalog.map((catalogTopup) => (
                              <option key={catalogTopup.id} value={catalogTopup.id}>
                                {catalogTopup.name} ({formatMoney(catalogTopup.priceCents)}/mo list)
                              </option>
                            ))}
                          </Select>
                          <Input
                            label="Price this customer"
                            type="number"
                            min="0"
                            step="0.01"
                            value={topup.customPrice}
                            onChange={(event) => updateTopup(line.id, topup.id, { customPrice: event.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => removeTopup(line.id, topup.id)}
                            className="grid h-9 w-9 place-items-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            aria-label="Remove topup"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-slate">
                      None added. Price is independent of the catalog rate — set your own for a discounted deal.
                    </p>
                  )}
                </div>
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
            {loginEmailNotice ? (
              <p
                className={`mt-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                  loginEmailNotice.tone === "warning"
                    ? "bg-amber-50 text-amber-800"
                    : "bg-white/70 text-emerald-800"
                }`}
              >
                {loginEmailNotice.message}
              </p>
            ) : null}
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

        {addedMessage ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">Added to existing billing</p>
            <p className="mt-1 text-xs text-emerald-800">{addedMessage}</p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" onClick={() => setLines((current) => [...current, newLine()])}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add another line
          </Button>
          <Button type="button" onClick={createOrder} disabled={busy || (customerMode === "existing" && !customerId) || newCustomerIncomplete}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {effectiveMode === "existing-billing" ? "Add to existing billing" : "Create payment link"}
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
                <span className="font-semibold text-ink">{formatMoney(lineTotalCents(line))}</span>
              </div>
              <p className="mt-1 text-xs text-muted-slate">{lineLabel(line)}</p>
            </div>
          ))}
          {trialDays.trim() && effectiveMode === "new-link" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
              First charge delayed {trialDays} day{trialDays === "1" ? "" : "s"} — card saved now, $0 today.
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
