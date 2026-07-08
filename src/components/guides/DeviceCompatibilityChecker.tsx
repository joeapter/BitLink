"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Loader2, MessageCircle, Smartphone } from "lucide-react";
import { submitEsimCheckAction, type EsimCheckState } from "@/lib/support/esim-check";

const WHATSAPP_NUMBER = "972587939426";

export function DeviceCompatibilityChecker() {
  const [model, setModel] = useState("");
  const [state, formAction, pending] = useActionState<EsimCheckState, FormData>(submitEsimCheckAction, null);

  const waText = encodeURIComponent(
    `Hi BitLink, can you confirm this phone works with an eSIM?${model.trim() ? ` My phone: ${model.trim()}` : ""}`,
  );
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`;

  return (
    <div className="rounded-xl border border-link-blue/20 bg-[#f4fbfc] p-6 sm:p-7">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Smartphone className="h-4 w-4 text-link-blue" aria-hidden="true" />
        Not sure if your phone works with eSIM?
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-slate">
        Tell us your exact model and we&apos;ll confirm before you order — no guessing, no returns.
      </p>

      <div className="mt-4">
        <label htmlFor="esim-model" className="text-xs font-semibold uppercase tracking-wide text-muted-slate">
          Your phone model
        </label>
        <input
          id="esim-model"
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="e.g. iPhone 13, Galaxy S22, Pixel 7"
          className="mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-link-blue"
        />
      </div>

      {state?.success ? (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {state.success}
        </p>
      ) : (
        <div className="mt-4 grid gap-3">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Ask on WhatsApp — instant reply
          </a>

          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span className="h-px flex-1 bg-ink/10" />
            or leave your details
            <span className="h-px flex-1 bg-ink/10" />
          </div>

          <form action={formAction} className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input type="hidden" name="model" value={model} />
            <input
              type="text"
              name="contact"
              required
              placeholder="WhatsApp number or email"
              className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-link-blue"
            />
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Have us check
            </button>
          </form>
          {state?.error ? <p className="text-xs font-semibold text-rose-700">{state.error}</p> : null}
        </div>
      )}
    </div>
  );
}
