"use client";

import { useActionState } from "react";
import { CheckCircle2, Mail, QrCode } from "lucide-react";
import {
  resendProvisionedEmailAction,
  markEsimInstalledAction,
  type ResendState,
} from "@/lib/admin/line-actions";

// Shown below the Provisioning Job box while an eSIM is ready but not yet
// confirmed installed. There's no automatic "installed" signal from Annatel
// today (no first-registration webhook wired up), so "Mark as installed"
// is a manual admin override rather than a real detection — hides this
// card (and the matching customer-portal QR) once clicked.
export function EsimActivationCard({
  lineId,
  providerLineId,
  activationCode,
  qrDataUrl,
  iccId,
}: {
  lineId: string;
  providerLineId: string;
  activationCode: string;
  qrDataUrl: string;
  iccId?: string;
}) {
  const [state, resendAction, resendPending] = useActionState<ResendState, FormData>(
    resendProvisionedEmailAction,
    null,
  );

  return (
    <section className="rounded-[2rem] border border-blue-200 bg-white p-5 shadow-soft">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <QrCode className="h-5 w-5 text-blue-600" aria-hidden="true" />
        eSIM activation
      </h2>
      <p className="mt-1 text-xs text-muted-slate">
        Not yet confirmed installed. Scan this from the customer&apos;s phone, or forward the email.
      </p>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="eSIM QR code"
          width={150}
          height={150}
          className="shrink-0 rounded-xl border border-blue-200 bg-white p-1"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-blue-800">Manual entry code</p>
          <p className="mt-1 break-all rounded-lg border border-blue-200 bg-blue-50 px-2 py-2 font-mono text-[0.6rem] leading-5 text-blue-900">
            {activationCode}
          </p>
          {iccId ? <p className="mt-2 text-[0.6rem] text-slate-400">ICC: {iccId}</p> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <form action={resendAction}>
          <input type="hidden" name="lineId" value={lineId} />
          <input type="hidden" name="providerLineId" value={providerLineId} />
          <button
            type="submit"
            disabled={resendPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            {resendPending ? "Sending…" : "Resend activation email"}
          </button>
        </form>
        {state?.success ? <p className="text-xs font-semibold text-emerald-700">{state.success}</p> : null}
        {state?.error ? <p className="text-xs font-semibold text-rose-700">{state.error}</p> : null}

        <form action={markEsimInstalledAction}>
          <input type="hidden" name="lineId" value={lineId} />
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink/90 sm:w-auto"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Mark as installed
          </button>
        </form>
      </div>
    </section>
  );
}
