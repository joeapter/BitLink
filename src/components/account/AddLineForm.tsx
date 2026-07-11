"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, PlusCircle } from "lucide-react";
import { plans, type PlanSlug } from "@/lib/plans";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import { EmbeddedStripeCheckout } from "@/components/checkout/EmbeddedStripeCheckout";
import { EsimCompatibilityModal } from "@/components/checkout/EsimCompatibilityModal";
import { IntlNumberPicker } from "@/components/checkout/IntlNumberPicker";
import { OrderInfoPanel } from "@/components/checkout/OrderInfoPanel";
import { PortNumberVerification } from "@/components/checkout/PortNumberVerification";

type SimType = "esim" | "physical";
type NumberChoice = "new" | "port-in";
type IntlCountry = "us" | "canada" | "uk";
type IntlSource = "new" | "port";

export function AddLineForm({
  initialPlanSlug,
  customerName,
  customerEmail,
}: {
  initialPlanSlug: PlanSlug;
  customerName?: string | null;
  customerEmail?: string | null;
}) {
  const [planSlug, setPlanSlug] = useState<PlanSlug>(initialPlanSlug);
  const [simType, setSimType] = useState<SimType>("esim");
  const [numberChoice, setNumberChoice] = useState<NumberChoice>("new");
  const [wantsIntlNumber, setWantsIntlNumber] = useState(false);
  const [intlCountry, setIntlCountry] = useState<IntlCountry>("us");
  const [intlSource, setIntlSource] = useState<IntlSource>("new");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [feeWaived, setFeeWaived] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [verifiedPortNumber, setVerifiedPortNumber] = useState<string | null>(null);
  const [chosenIntlNumber, setChosenIntlNumber] = useState<string | null>(null);

  useEffect(() => {
    const check = () => {
      if (localStorage.getItem("bl_staff") === "1") setFeeWaived(true);
    };
    check();
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

  const forcePhysical = selectedPlan.isKosher;
  const effectiveSimType: SimType = forcePhysical ? "physical" : simType;

  function handlePlanChange(slug: PlanSlug) {
    setPlanSlug(slug);
    const plan = plans.find((p) => p.slug === slug);
    if (plan?.isKosher) setSimType("physical");
  }

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const isPortIn = numberChoice === "port-in";
    if (isPortIn && !verifiedPortNumber) {
      setLoading(false);
      setError("Verify the number you're porting first — we text a code to it.");
      return;
    }
    if (wantsIntlNumber && intlSource === "new" && !chosenIntlNumber) {
      setLoading(false);
      setError("Choose your international number before continuing.");
      return;
    }
    // Read the waiver fresh at submit time — mounted state can be stale.
    const waived = feeWaived || localStorage.getItem("bl_staff") === "1";
    const response = await fetch("/api/account/create-line-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planSlug,
        isEsim: effectiveSimType === "esim",
        isPortIn,
        skipActivationFee: waived,
        portInNumber: isPortIn ? verifiedPortNumber : null,
        wantsIntlNumber,
        intlNumberCountry: wantsIntlNumber ? intlCountry : undefined,
        intlNumberSource: wantsIntlNumber ? intlSource : undefined,
        intlPortNumber: wantsIntlNumber && intlSource === "port" ? formData.get("intlPortNumber") : null,
        intlChosenNumber: wantsIntlNumber && intlSource === "new" ? chosenIntlNumber : null,
      }),
    });

    const payload = (await response.json()) as { url?: string; clientSecret?: string; added?: boolean; error?: string };
    setLoading(false);

    if (!response.ok || (!payload.url && !payload.clientSecret && !payload.added)) {
      setError(payload.error ?? "Line checkout could not be started.");
      return;
    }

    if (payload.added) {
      setSuccess("Your new line was added to your existing monthly bill and activation has started.");
      setTimeout(() => {
        window.location.href = "/account/lines";
      }, 1000);
      return;
    }

    // Embedded checkout keeps payment on-site; hosted URL is the fallback.
    if (payload.clientSecret) {
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
            info={{ fullName: customerName ?? "", email: customerEmail ?? "", phone: "" }}
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
      <form action={onSubmit} className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
        <div>
          <p className="text-sm font-semibold text-link-blue">Add line</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-ink">Create another BitLink line.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-slate">
            This line will be added to {customerName ?? customerEmail ?? "your account"} and billed as its own monthly subscription.
          </p>
        </div>

        <div className="mt-8">
          <Select
            label="Plan"
            name="planSlug"
            value={planSlug}
            onChange={(event) => handlePlanChange(event.target.value as PlanSlug)}
          >
            {plans.map((plan) => (
              <option key={plan.slug} value={plan.slug}>
                {plan.name}
              </option>
            ))}
          </Select>
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-ink">Type of SIM</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
              effectiveSimType === "esim" ? "border-link-blue bg-link-blue/5" : "border-ink/10 hover:border-ink/20"
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
                <p className="text-xs text-muted-slate">Sent by email after activation</p>
                <div className="mt-1.5">
                  <EsimCompatibilityModal />
                </div>
              </div>
            </label>

            <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
              effectiveSimType === "physical" ? "border-link-blue bg-link-blue/5" : "border-ink/10 hover:border-ink/20"
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
                  {selectedPlan.isKosher ? "Required for kosher-certified devices" : "Mailed or assigned by support"}
                </p>
              </div>
            </label>
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-ink">Israeli number</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
              numberChoice === "new" ? "border-link-blue bg-link-blue/5" : "border-ink/10 hover:border-ink/20"
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
                <p className="text-xs text-muted-slate">Assign a fresh Israeli number</p>
              </div>
            </label>

            <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
              numberChoice === "port-in" ? "border-link-blue bg-link-blue/5" : "border-ink/10 hover:border-ink/20"
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
                <p className="text-sm font-semibold text-ink">Port an Israeli number</p>
                <p className="text-xs text-muted-slate">Move an existing Israeli number to this line</p>
              </div>
            </label>
          </div>

          {numberChoice === "port-in" ? (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <PortNumberVerification onVerified={setVerifiedPortNumber} />
            </div>
          ) : null}
        </fieldset>

        <div className="mt-6">
          <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
            wantsIntlNumber ? "border-link-blue bg-link-blue/5" : "border-ink/10 hover:border-ink/20"
          }`}>
            <input
              type="checkbox"
              checked={wantsIntlNumber}
              onChange={(event) => setWantsIntlNumber(event.target.checked)}
              className="mt-0.5 accent-link-blue"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink">Add a US, Canadian, or UK number</p>
                <span className="text-sm font-semibold text-link-blue">+$9.99/mo</span>
              </div>
              <p className="text-xs text-muted-slate">Let family call this line through a local number.</p>
            </div>
          </label>

          {wantsIntlNumber ? (
            <div className="mt-3 grid gap-3 rounded-2xl border border-link-blue/20 bg-link-blue/5 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  label="Country"
                  value={intlCountry}
                  onChange={(event) => {
                    setIntlCountry(event.target.value as IntlCountry);
                    setChosenIntlNumber(null);
                  }}
                >
                  <option value="us">US</option>
                  <option value="canada">Canada</option>
                  <option value="uk">UK</option>
                </Select>
                <Select
                  label="Number"
                  value={intlSource}
                  onChange={(event) => {
                    setIntlSource(event.target.value as IntlSource);
                    setChosenIntlNumber(null);
                  }}
                >
                  <option value="new">Assign me one</option>
                  <option value="port">Port my existing</option>
                </Select>
              </div>

              {intlSource === "port" ? (
                <div className="grid gap-3">
                  <Input label="Number to port" name="intlPortNumber" type="tel" placeholder="+1 212 555 0000" required />
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    <p className="font-semibold">One-time port fee: $49.99</p>
                    <p className="mt-0.5">International number ports are processed manually after the Israeli line is active.</p>
                  </div>
                </div>
              ) : (
                <IntlNumberPicker
                  endpoint={`/api/account/international-numbers?country=${intlCountry}`}
                  country={intlCountry}
                  label="Pick the number your family and friends will dial"
                  onChosen={setChosenIntlNumber}
                />
              )}
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            {success}
          </div>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={loading || (wantsIntlNumber && intlSource === "new" && !chosenIntlNumber)}
          className="mt-6"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <PlusCircle className="h-4 w-4" aria-hidden="true" />}
          Continue to payment
        </Button>
      </form>

      <CheckoutSummary
        plan={selectedPlan}
        isPortIn={numberChoice === "port-in"}
        feeWaived={feeWaived}
        hasIntlNumber={wantsIntlNumber}
        intlIsPortIn={wantsIntlNumber && intlSource === "port"}
      />
    </div>
  );
}
