"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, MessageSquareText } from "lucide-react";

// Port-in ownership verification: fixed +972 prefix field, "text me a code"
// button, code entry, verified state. Used by the public checkout AND the
// portal add-line flow. Only rendered for Israeli port-ins — new-number
// orders never see this step.
//
// The parent receives the verified E.164 number via onVerified (null while
// unverified) and must block submission until it's non-null; the checkout
// APIs enforce the same rule server-side.

type Step = "enter" | "code" | "verified";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

// Accepts "0587939426" or "587939426" — the leading 0 is stripped in code.
function toLocalDigits(value: string): string {
  const digits = digitsOnly(value);
  return digits.startsWith("0") ? digits.slice(1) : digits;
}

export function PortNumberVerification({
  onVerified,
}: {
  onVerified: (e164Number: string | null) => void;
}) {
  const [localDigits, setLocalDigits] = useState("");
  const [step, setStep] = useState<Step>("enter");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isValidLocal = /^5\d{8}$/.test(localDigits);
  const e164 = `+972${localDigits}`;

  function handleNumberChange(value: string) {
    setLocalDigits(toLocalDigits(value).slice(0, 9));
    if (step !== "enter") {
      setStep("enter");
      setCode("");
      setInfo(null);
      onVerified(null);
    }
    setError(null);
  }

  async function sendCode(resend = false) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/port-auth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: e164, resend }),
      });
      const payload = (await response.json()) as { status?: string; error?: string; alreadySent?: boolean };
      if (!response.ok) {
        setError(payload.error ?? "Could not send the code. Try again.");
        return;
      }
      if (payload.status === "completed") {
        // Already verified within the last 15 days — no SMS needed.
        setStep("verified");
        setInfo("This number is already verified.");
        onVerified(e164);
        return;
      }
      setStep("code");
      setInfo(
        payload.alreadySent
          ? `A code was already sent to ${e164} — enter it below, or resend.`
          : `We texted a verification code to ${e164}.`,
      );
    } catch {
      setError("Could not send the code. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/port-auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: e164, code }),
      });
      const payload = (await response.json()) as { verified?: boolean; error?: string };
      if (!response.ok || !payload.verified) {
        setError(payload.error ?? "That code did not match.");
        return;
      }
      setStep("verified");
      setInfo(null);
      onVerified(e164);
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div>
        <label className="text-sm font-medium text-ink" htmlFor="portInNumberLocal">
          Current Israeli number
        </label>
        <div className="mt-1.5 flex">
          <span className="inline-flex items-center rounded-l-xl border border-r-0 border-ink/15 bg-slate-100 px-3 text-sm font-semibold text-slate-600">
            +972
          </span>
          <input
            id="portInNumberLocal"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="58-793-9426"
            value={localDigits}
            onChange={(e) => handleNumberChange(e.target.value)}
            disabled={step === "verified"}
            className="w-full rounded-r-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-link-blue disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>
        <p className="mt-1 text-xs text-amber-800">
          Type it with or without the leading 0 — we handle both.
        </p>
      </div>

      {step === "enter" && (
        <button
          type="button"
          onClick={() => sendCode()}
          disabled={!isValidLocal || busy}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink/90 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <MessageSquareText className="h-4 w-4" aria-hidden="true" />}
          Text me a verification code
        </button>
      )}

      {step === "code" && (
        <div className="grid gap-2">
          {info ? <p className="text-xs text-amber-800">{info}</p> : null}
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Code from SMS"
              value={code}
              onChange={(e) => setCode(digitsOnly(e.target.value).slice(0, 8))}
              className="w-40 rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm tracking-widest text-ink outline-none transition focus:border-link-blue"
            />
            <button
              type="button"
              onClick={verifyCode}
              disabled={code.length < 4 || busy}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink/90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Verify
            </button>
          </div>
          <button
            type="button"
            onClick={() => sendCode(true)}
            disabled={busy}
            className="w-fit text-xs font-semibold text-muted-slate transition hover:text-ink"
          >
            Resend code
          </button>
        </div>
      )}

      {step === "verified" && (
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Number verified — {e164}
          {info ? <span className="font-normal text-emerald-600">({info})</span> : null}
        </p>
      )}

      {error ? <p className="text-xs font-semibold text-rose-700">{error}</p> : null}

      <p className="text-xs text-amber-800">
        Your current number stays active throughout the transfer process.
      </p>
    </div>
  );
}
