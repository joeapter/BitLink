"use client";

import { useState, useActionState } from "react";
import { Mail, MailCheck } from "lucide-react";
import {
  setupSmsForwarderAction,
  removeSmsForwarderAction,
  type SmsForwarderActionState,
} from "@/lib/account/sms-forwarder-actions";

export function SmsForwarderCard({
  lineId,
  initialStatus,
  defaultEmail,
}: {
  lineId: string;
  initialStatus: { id: string; email: string } | null;
  defaultEmail?: string;
}) {
  const [open, setOpen] = useState(false);
  const [setupState, setupFormAction, setupPending] = useActionState<SmsForwarderActionState, FormData>(
    setupSmsForwarderAction,
    null,
  );
  const [removeState, removeFormAction, removePending] = useActionState<SmsForwarderActionState, FormData>(
    removeSmsForwarderAction,
    null,
  );

  // Once set up, trust the action's own state over the server-fetched
  // initialStatus so the UI updates immediately without a full reload.
  const isOn = setupState?.success ? true : removeState?.success ? false : Boolean(initialStatus);

  if (isOn) {
    return (
      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
        <div className="flex items-start gap-3">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-900">SMS-to-email is on</p>
            <p className="mt-1 text-xs leading-5 text-emerald-800">
              Texts to this number — including bank and Google verification codes — also land in{" "}
              <span className="font-semibold">{initialStatus?.email ?? "your inbox"}</span>. This works even before
              you land in Israel, since it happens on our network, not your phone.
            </p>
            {initialStatus?.id && (
              <form action={removeFormAction} className="mt-3">
                <input type="hidden" name="lineId" value={lineId} />
                <input type="hidden" name="settingId" value={initialStatus.id} />
                <button
                  type="submit"
                  disabled={removePending}
                  className="text-xs font-semibold text-emerald-800 underline transition hover:text-ink disabled:opacity-60"
                >
                  {removePending ? "Turning off…" : "Turn off"}
                </button>
              </form>
            )}
            {removeState?.error ? <p className="mt-2 text-xs font-semibold text-rose-700">{removeState.error}</p> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-ink/10 bg-white p-4">
      {setupState?.success ? (
        <p className="text-sm font-semibold text-emerald-700">{setupState.success}</p>
      ) : !open ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-slate" aria-hidden="true" />
            <p className="text-sm text-muted-slate">
              <span className="font-semibold text-ink">Get bank &amp; Google codes by email</span> — even before you
              land in Israel.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-slate-50"
          >
            Set it up
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm font-semibold text-ink">SMS-to-email forwarding</p>
          <p className="mt-1 text-xs leading-5 text-muted-slate">
            Any text sent to this number also gets forwarded to an email address of your choice — texts, calls, and
            data don&apos;t work abroad, but this does, since it happens on our network before it ever reaches your
            phone.
          </p>
          <form action={setupFormAction} className="mt-3 flex flex-wrap items-center gap-2">
            <input type="hidden" name="lineId" value={lineId} />
            <input
              type="email"
              name="email"
              required
              defaultValue={defaultEmail}
              placeholder="you@example.com"
              className="min-w-0 flex-1 rounded-full border border-ink/15 px-4 py-2 text-sm text-ink outline-none focus:border-link-blue"
            />
            <button
              type="submit"
              disabled={setupPending}
              className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink/90 disabled:opacity-60"
            >
              {setupPending ? "Turning on…" : "Turn on"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 text-xs font-semibold text-muted-slate transition hover:text-ink"
          >
            Never mind
          </button>
          {setupState?.error ? <p className="mt-3 text-xs font-semibold text-rose-700">{setupState.error}</p> : null}
        </div>
      )}
    </div>
  );
}
