"use client";

import { useState, useActionState } from "react";
import { PauseCircle, PlayCircle } from "lucide-react";
import { pauseLineAction, resumeLineAction, type PauseActionState } from "@/lib/account/pause-actions";

const PAUSE_WINDOW_MONTHS = 18;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function pauseWindowEnd(pausedAt: string) {
  const end = new Date(pausedAt);
  end.setMonth(end.getMonth() + PAUSE_WINDOW_MONTHS);
  return end.toISOString();
}

const pauseTerms = [
  "Service stops right away — calls, texts, and data are frozen until you resume.",
  "Your Israeli number and SIM are held for you the whole time.",
  "You've already paid for this month, so it runs to the end of your current billing cycle. The $10/month pause rate starts on your next billing date.",
  "Resume anytime from this page. Your plan restarts immediately and your monthly billing date resets to the day you resume.",
  `A line can stay paused for up to ${PAUSE_WINDOW_MONTHS} months. After ${PAUSE_WINDOW_MONTHS} months without reactivation, the line may be cancelled and the number lost.`,
];

export function PauseLineCard({ lineId, status, pausedAt }: { lineId: string; status: string; pausedAt: string | null }) {
  const [open, setOpen] = useState(false);
  const [pauseState, pauseFormAction, pausePending] = useActionState<PauseActionState, FormData>(pauseLineAction, null);
  const [resumeState, resumeFormAction, resumePending] = useActionState<PauseActionState, FormData>(resumeLineAction, null);

  if (status === "paused") {
    return (
      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
        <div className="flex items-start gap-3">
          <PauseCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900">
              Plan paused{pausedAt ? ` since ${formatDate(pausedAt)}` : ""} · $10/month
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-800">
              Your number and SIM are being held.{" "}
              {pausedAt
                ? `A paused line is held for up to ${PAUSE_WINDOW_MONTHS} months — until ${formatDate(pauseWindowEnd(pausedAt))}. After that it may be cancelled and the number lost.`
                : `A paused line is held for up to ${PAUSE_WINDOW_MONTHS} months, after which it may be cancelled and the number lost.`}
            </p>
            <form action={resumeFormAction} className="mt-3">
              <input type="hidden" name="lineId" value={lineId} />
              <button
                type="submit"
                disabled={resumePending}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink/90 disabled:opacity-60"
              >
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                {resumePending ? "Resuming…" : "Resume my plan"}
              </button>
            </form>
            <p className="mt-2 text-xs leading-5 text-amber-800">
              When you resume, your plan restarts immediately and your monthly billing date resets to that day.
            </p>
            {resumeState?.error ? <p className="mt-2 text-xs font-semibold text-rose-700">{resumeState.error}</p> : null}
            {resumeState?.success ? <p className="mt-2 text-xs font-semibold text-emerald-700">{resumeState.success}</p> : null}
          </div>
        </div>
      </div>
    );
  }

  if (status !== "active") return null;

  return (
    <div className="mt-3 rounded-xl border border-ink/10 bg-white p-4">
      {pauseState?.success ? (
        <p className="text-sm font-semibold text-emerald-700">{pauseState.success}</p>
      ) : !open ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <PauseCircle className="h-4 w-4 text-muted-slate" aria-hidden="true" />
            <p className="text-sm text-muted-slate">
              Leaving Israel for a while? <span className="font-semibold text-ink">Pause your plan for $10/month</span>{" "}
              and keep your number.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-slate-50"
          >
            Pause my plan
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm font-semibold text-ink">Pause my plan — $10/month</p>
          <p className="mt-1 text-xs text-muted-slate">Here&apos;s exactly what happens, no fine print:</p>
          <ul className="mt-3 space-y-2">
            {pauseTerms.map((term) => (
              <li key={term} className="flex gap-2 text-xs leading-5 text-muted-slate">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-link-blue" aria-hidden="true" />
                {term}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <form action={pauseFormAction}>
              <input type="hidden" name="lineId" value={lineId} />
              <button
                type="submit"
                disabled={pausePending}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink/90 disabled:opacity-60"
              >
                <PauseCircle className="h-4 w-4" aria-hidden="true" />
                {pausePending ? "Pausing…" : "Pause now"}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-muted-slate transition hover:text-ink"
            >
              Never mind
            </button>
          </div>
          {pauseState?.error ? <p className="mt-3 text-xs font-semibold text-rose-700">{pauseState.error}</p> : null}
        </div>
      )}
    </div>
  );
}
