"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { plans, type PlanSlug } from "@/lib/plans";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CheckoutSummary } from "./CheckoutSummary";
import { EmbeddedStripeCheckout } from "./EmbeddedStripeCheckout";
import { EsimCompatibilityModal } from "./EsimCompatibilityModal";
import { OrderInfoPanel } from "./OrderInfoPanel";
import { PortNumberVerification } from "./PortNumberVerification";

type SimType = "esim" | "physical";
type NumberChoice = "new" | "port-in";
type IntlCountry = "us" | "canada" | "uk";
type IntlSource = "new" | "port";

export function CheckoutForm({
  initialPlanSlug,
  initialReferralCode = "",
}: {
  initialPlanSlug: PlanSlug;
  initialReferralCode?: string;
}) {
  const [planSlug, setPlanSlug] = useState<PlanSlug>(initialPlanSlug);
  const [simType, setSimType] = useState<SimType>("esim");
  const [numberChoice, setNumberChoice] = useState<NumberChoice>("new");
  const [wantsIntlNumber, setWantsIntlNumber] = useState(false);
  const [intlCountry, setIntlCountry] = useState<IntlCountry>("us");
  const [intlSource, setIntlSource] = useState<IntlSource>("new");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feeWaived, setFeeWaived] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [verifiedPortNumber, setVerifiedPortNumber] = useState<string | null>(null);
  const [orderInfo, setOrderInfo] = useState<{ fullName: string; email: string; phone: string } | null>(null);

  useEffect(() => {
    const check = () => {
      if (localStorage.getItem("bl_staff") === "1") setFeeWaived(true);
    };
    check();
    // React to the unlock happening while this form is already mounted:
    // same-tab (custom event from BrandMark), cross-tab (storage), and focus.
    window.addEventListener("bl-staff-changed", check);
    window.addEventListener("storage", check);
    window.addEventListener("focus", check);
    return () => {
      window.removeEventListener("bl-staff-changed", check);
      window.removeEventListener("storage", check);
      window.removeEventListener("focus", check);
    };
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.slug === planSlug) ?? plans[1],
    [planSlug],
  );

  // Kosher plans are physical-SIM only
  const forcePhysical = selectedPlan.isKosher;
  const effectiveSimType: SimType = forcePhysical ? "physical" : simType;

  // Keep simType in sync when plan changes to kosher
  const handlePlanChange = (slug: PlanSlug) => {
    setPlanSlug(slug);
    const plan = plans.find((p) => p.slug === slug);
    if (plan?.isKosher) setSimType("physical");
  };

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const isPortIn = numberChoice === "port-in";
    if (isPortIn && !verifiedPortNumber) {
      setLoading(false);
      setError("Verify the number you're porting first — we text a code to it.");
      return;
    }
    // Read the waiver fresh at submit time — the mounted state can be stale
    // if the unlock happened after this form loaded.
    const waived = feeWaived || localStorage.getItem("bl_staff") === "1";

    const response = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planSlug,
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        referralCode: formData.get("referralCode") || null,
        isKosher: selectedPlan.isKosher,
        isEsim: effectiveSimType === "esim",
        isPortIn,
        portInNumber: isPortIn ? verifiedPortNumber : null,
        skipActivationFee: waived,
        wantsIntlNumber,
        intlNumberCountry: wantsIntlNumber ? intlCountry : undefined,
        intlNumberSource: wantsIntlNumber ? intlSource : undefined,
        intlPortNumber: wantsIntlNumber && intlSource === "port" ? formData.get("intlPortNumber") : null,
      }),
    });

    const payload = (await response.json()) as { url?: string; clientSecret?: string; error?: string };
    setLoading(false);

    if (!response.ok || (!payload.url && !payload.clientSecret)) {
      setError(payload.error ?? "Checkout could not be started. Please try again.");
      return;
    }

    // Embedded checkout keeps payment on-site; hosted URL is the fallback.
    if (payload.clientSecret) {
      setOrderInfo({
        fullName: String(formData.get("fullName") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
      });
      setClientSecret(payload.clientSecret);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.location.href = payload.url!;
  }

  if (clientSecret) {
    return (
      <div className="overflow-hidden rounded-4xl border border-ink/10 bg-white shadow-soft lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
        <div className="grid gap-4 p-6 sm:p-8">
          <OrderInfoPanel
            info={orderInfo}
            planName={selectedPlan.name}
            simType={effectiveSimType}
            portNumber={numberChoice === "port-in" ? verifiedPortNumber : null}
            hasIntlNumber={wantsIntlNumber}
          />
          <CheckoutSummary
            plan={selectedPlan}
            isPortIn={numberChoice === "port-in"}
            feeWaived={feeWaived}
            hasIntlNumber={wantsIntlNumber}
            intlIsPortIn={wantsIntlNumber && intlSource === "port"}
          />
        </div>
        <div className="border-t border-ink/10 p-6 sm:p-8 lg:border-l lg:border-t-0">
          <button
            type="button"
            onClick={() => setClientSecret(null)}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to order details
          </button>
          <EmbeddedStripeCheckout clientSecret={clientSecret} bare />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
      <form action={onSubmit} className="rounded-4xl border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
        <div>
          <p className="text-sm font-semibold text-link-blue">Checkout</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
            Checkout securely. We&apos;ll get your connection moving.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-slate">
            Enter your details, confirm the plan, and continue to secure payment.
          </p>
        </div>

        {/* ── Plan ── */}
        <div className="mt-8">
          <Select
            label="Plan"
            name="planSlug"
            value={planSlug}
            onChange={(e) => handlePlanChange(e.target.value as PlanSlug)}
          >
            {plans.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </Select>
        </div>

        {/* ── SIM type ── */}
        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-ink">Type of SIM</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
              effectiveSimType === "esim"
                ? "border-link-blue bg-link-blue/5"
                : "border-ink/10 hover:border-ink/20"
            } ${forcePhysical ? "pointer-events-none opacity-50" : ""}`}>
              <input
                type="radio"
                name="simType"
                value="esim"
                checked={effectiveSimType === "esim"}
                onChange={() => setSimType("esim")}
                className="mt-0.5 accent-link-blue"
                disabled={forcePhysical}
              />
              <div>
                <p className="text-sm font-semibold text-ink">eSIM</p>
                <p className="text-xs text-muted-slate">Sent by email — instant activation</p>
                <div className="mt-1.5">
                  <EsimCompatibilityModal />
                </div>
              </div>
            </label>

            <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
              effectiveSimType === "physical"
                ? "border-link-blue bg-link-blue/5"
                : "border-ink/10 hover:border-ink/20"
            }`}>
              <input
                type="radio"
                name="simType"
                value="physical"
                checked={effectiveSimType === "physical"}
                onChange={() => setSimType("physical")}
                className="mt-0.5 accent-link-blue"
              />
              <div>
                <p className="text-sm font-semibold text-ink">Physical SIM</p>
                <p className="text-xs text-muted-slate">
                  {selectedPlan.isKosher
                    ? "Required for kosher-certified devices"
                    : "Mailed to you — 7–10 business days"}
                </p>
              </div>
            </label>
          </div>
        </fieldset>

        {/* ── Israeli number ── */}
        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-ink">Israeli number</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
              numberChoice === "new"
                ? "border-link-blue bg-link-blue/5"
                : "border-ink/10 hover:border-ink/20"
            }`}>
              <input
                type="radio"
                name="numberChoice"
                value="new"
                checked={numberChoice === "new"}
                onChange={() => setNumberChoice("new")}
                className="mt-0.5 accent-link-blue"
              />
              <div>
                <p className="text-sm font-semibold text-ink">Get a new number</p>
                <p className="text-xs text-muted-slate">We assign you a fresh Israeli number</p>
              </div>
            </label>

            <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
              numberChoice === "port-in"
                ? "border-link-blue bg-link-blue/5"
                : "border-ink/10 hover:border-ink/20"
            }`}>
              <input
                type="radio"
                name="numberChoice"
                value="port-in"
                checked={numberChoice === "port-in"}
                onChange={() => setNumberChoice("port-in")}
                className="mt-0.5 accent-link-blue"
              />
              <div>
                <p className="text-sm font-semibold text-ink">Keep my current number</p>
                <p className="text-xs text-muted-slate">Transfer your existing Israeli number</p>
              </div>
            </label>
          </div>

          {numberChoice === "port-in" && (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <PortNumberVerification onVerified={setVerifiedPortNumber} />
            </div>
          )}
        </fieldset>

        {/* ── International number add-on ── */}
        <div className="mt-6">
          <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
            wantsIntlNumber ? "border-link-blue bg-link-blue/5" : "border-ink/10 hover:border-ink/20"
          }`}>
            <input
              type="checkbox"
              checked={wantsIntlNumber}
              onChange={(e) => setWantsIntlNumber(e.target.checked)}
              className="mt-0.5 accent-link-blue"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink">Add a US, Canadian, or UK number</p>
                <span className="text-sm font-semibold text-link-blue">+$9.99/mo</span>
              </div>
              <p className="text-xs text-muted-slate">Let family call you like a local number — no international dialing</p>
            </div>
          </label>

          {wantsIntlNumber && (
            <div className="mt-3 grid gap-3 rounded-2xl border border-link-blue/20 bg-link-blue/5 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Country */}
                <div>
                  <p className="mb-2 text-xs font-semibold text-ink">Country</p>
                  <div className="flex gap-2">
                    {(["us", "canada", "uk"] as IntlCountry[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setIntlCountry(c)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          intlCountry === c
                            ? "border-link-blue bg-link-blue text-white"
                            : "border-ink/10 text-ink hover:border-ink/20"
                        }`}
                      >
                        {c === "us" ? "US" : c === "canada" ? "Canada" : "UK"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* New vs port */}
                <div>
                  <p className="mb-2 text-xs font-semibold text-ink">Number</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIntlSource("new")}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        intlSource === "new"
                          ? "border-link-blue bg-link-blue text-white"
                          : "border-ink/10 text-ink hover:border-ink/20"
                      }`}
                    >
                      Assign me one
                    </button>
                    <button
                      type="button"
                      onClick={() => setIntlSource("port")}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        intlSource === "port"
                          ? "border-link-blue bg-link-blue text-white"
                          : "border-ink/10 text-ink hover:border-ink/20"
                      }`}
                    >
                      Port my existing
                    </button>
                  </div>
                </div>
              </div>

              {intlSource === "port" && (
                <div className="grid gap-3">
                  <Input
                    label="Number to port"
                    name="intlPortNumber"
                    type="tel"
                    placeholder="+1 212 555 0000"
                    required
                  />
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    <p className="font-semibold">One-time port fee: $49.99</p>
                    <p className="mt-0.5">International number ports are processed manually and typically take 3–5 business days after your Israeli SIM is activated.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Contact info ── */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <p className="text-sm font-semibold text-ink sm:col-span-2">Your details</p>
          <Input label="Full name" name="fullName" autoComplete="name" required />
          <Input label="Email" name="email" type="email" autoComplete="email" required />
          <Input label="Phone" name="phone" type="tel" autoComplete="tel" required />
          <Input label="Referral code" name="referralCode" defaultValue={initialReferralCode} placeholder="Optional" />
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Continue to secure payment
          </Button>
          <p className="text-xs leading-5 text-muted-slate">
            Monthly subscription + one-time activation fee. Activation subject to BitLink confirmation.
          </p>
        </div>
      </form>

      <CheckoutSummary plan={selectedPlan} isPortIn={numberChoice === "port-in"} feeWaived={feeWaived} hasIntlNumber={wantsIntlNumber} intlIsPortIn={wantsIntlNumber && intlSource === "port"} />
    </div>
  );
}
