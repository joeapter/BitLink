"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { generateResetLinkAction, type ResetLinkState } from "@/lib/admin/line-actions";

// Generates the customer's real password-reset link (Supabase's own recovery
// token, not a lookalike) and, in the same click, emails it to the address on
// file — so a support call ("I can't log in") ends in one action instead of
// walking the customer through /forgot-password themselves. The link is also
// shown on screen with its own copy button, for handing over on WhatsApp when
// email isn't the fastest path.
export function ResetLinkCard({
  lineId,
  email,
  fullName,
}: {
  lineId: string;
  email?: string;
  fullName?: string;
}) {
  const [state, formAction, pending] = useActionState<ResetLinkState, FormData>(generateResetLinkAction, null);
  const [copied, setCopied] = useState(false);

  // A fresh link replaces whatever "Copied" state was showing for the last one.
  useEffect(() => setCopied(false), [state?.link]);

  async function copyLink() {
    if (!state?.link) return;
    try {
      await navigator.clipboard.writeText(state.link);
      setCopied(true);
    } catch {
      // Clipboard access can be denied by the browser; the link is still
      // selectable text in the field below, so nothing is actually lost.
    }
  }

  if (!email) {
    return null; // no address on file — nothing to reset or send to
  }

  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <KeyRound className="h-5 w-5 text-link-blue" aria-hidden="true" />
        Reset password
      </h2>
      <p className="mt-1 text-xs text-muted-slate">
        Generates a real reset link for {email} and emails it to them — the same link they&apos;d get from
        &ldquo;Forgot password&rdquo; themselves.
      </p>

      <form action={formAction} className="mt-4">
        <input type="hidden" name="lineId" value={lineId} />
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="fullName" value={fullName ?? ""} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-white disabled:opacity-50"
        >
          <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
          {pending ? "Generating…" : "Generate & send reset link"}
        </button>
      </form>

      {state?.link ? (
        <div className="mt-4 rounded-xl border border-ink/10 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-ink">Reset link</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              readOnly
              value={state.link}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 truncate rounded-lg border border-ink/10 bg-white px-2.5 py-1.5 font-mono text-[0.7rem] text-ink outline-none focus:border-link-blue"
            />
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-link-blue px-2.5 py-1.5 text-[0.7rem] font-bold text-white transition hover:bg-link-blue/90"
            >
              {copied ? <Check className="h-3 w-3" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-2 text-[0.65rem] text-slate-400">
            Single-use and expires soon — if it goes stale before the customer clicks it, generate a new one.
          </p>
        </div>
      ) : null}

      {state?.success ? <p className="mt-3 text-xs font-semibold text-emerald-700">{state.success}</p> : null}
      {state?.error ? <p className="mt-3 text-xs font-semibold text-rose-700">{state.error}</p> : null}
    </section>
  );
}
