"use client";

import { useActionState } from "react";
import { Mail, RefreshCw, RotateCcw } from "lucide-react";
import {
  resendProvisionedEmailAction,
  recycleAndResendEsimAction,
  type ResendState,
} from "@/lib/admin/line-actions";

// Always-available eSIM recovery tool for an eSIM line — shown whether or not
// the line is marked installed, because the two situations it handles can both
// happen after activation:
//
//   • "Refresh & resend"  — customer lost/deleted the QR email, or the stored
//     code went stale (profile re-released). Re-pulls the current code from the
//     carrier and re-emails it. The eSIM itself is untouched.
//
//   • "Recycle & send new QR" — the eSIM was already installed/used or a
//     download failed, so the old code can't be installed again. Mints a
//     brand-new profile at the carrier and emails the new QR. This invalidates
//     any existing install, so it's confirm-gated.
export function EsimResendCard({
  lineId,
  providerLineId,
}: {
  lineId: string;
  providerLineId: string;
}) {
  const [refreshState, refreshAction, refreshPending] = useActionState<ResendState, FormData>(
    resendProvisionedEmailAction,
    null,
  );
  const [recycleState, recycleAction, recyclePending] = useActionState<ResendState, FormData>(
    recycleAndResendEsimAction,
    null,
  );

  const state = recycleState ?? refreshState;

  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <Mail className="h-5 w-5 text-link-blue" aria-hidden="true" />
        Send the customer their eSIM QR
      </h2>
      <p className="mt-1 text-xs text-muted-slate">
        For when a customer lost their QR code, or it won&apos;t install.
      </p>

      <div className="mt-4 grid gap-3">
        <div className="rounded-xl border border-ink/10 bg-slate-50 p-3">
          <p className="text-sm font-semibold text-ink">Lost or deleted the QR?</p>
          <p className="mt-0.5 text-xs text-muted-slate">
            Re-emails the current QR. Use this first — it also fixes a QR that stopped working without
            replacing the eSIM.
          </p>
          <form action={refreshAction} className="mt-2">
            <input type="hidden" name="lineId" value={lineId} />
            <input type="hidden" name="providerLineId" value={providerLineId} />
            <button
              type="submit"
              disabled={refreshPending || recyclePending}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-white disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              {refreshPending ? "Sending…" : "Refresh & resend QR"}
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-900">Already installed / used, or still failing?</p>
          <p className="mt-0.5 text-xs text-amber-800">
            Creates a brand-new eSIM and emails the new QR. Only use this if &ldquo;Refresh &amp; resend&rdquo;
            didn&apos;t help — it cancels any eSIM the customer already installed, so they must scan the new one.
          </p>
          <form
            action={recycleAction}
            className="mt-2"
            onSubmit={(e) => {
              if (
                !window.confirm(
                  "Create a brand-new eSIM for this line? Any eSIM the customer already installed will stop working and they'll need to scan the new QR. Only do this if a normal resend didn't work.",
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="lineId" value={lineId} />
            <input type="hidden" name="providerLineId" value={providerLineId} />
            <button
              type="submit"
              disabled={refreshPending || recyclePending}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-400 bg-white px-4 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {recyclePending ? "Creating…" : "Recycle & send new QR"}
            </button>
          </form>
        </div>

        {state?.success ? <p className="text-xs font-semibold text-emerald-700">{state.success}</p> : null}
        {state?.error ? <p className="text-xs font-semibold text-rose-700">{state.error}</p> : null}
      </div>
    </section>
  );
}
