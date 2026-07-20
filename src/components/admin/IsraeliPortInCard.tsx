"use client";

import { useState, useTransition } from "react";
import { PhoneCall, ShieldCheck, RefreshCw, ArrowRightLeft, XCircle, Plus } from "lucide-react";
import type { IsraeliPortInRequest } from "@/lib/custom-orders/israeli-port-in";
import {
  createIsraeliPortInRequestAction,
  sendPortInAuthCodeAction,
  verifyPortInAuthCodeAction,
  startIsraeliPortInAction,
  refreshIsraeliPortInStatusAction,
  completeIsraeliPortInAction,
  cancelIsraeliPortInAction,
} from "@/lib/admin/line-actions";

interface Props {
  lineId: string;
  requests: IsraeliPortInRequest[];
}

const STATUS_LABEL: Record<IsraeliPortInRequest["status"], string> = {
  pending_auth: "Ready to send code",
  verifying: "Awaiting SMS code",
  ready_to_port: "Verified — ready to start",
  porting: "Porting at carrier",
  ready_to_complete: "Landed — ready to move",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

// Ports an Israeli number onto an ALREADY ACTIVE line. The mechanism is
// proven (two real numbers landed this way, Jul 7 2026) but Annatel only
// lands a port as part of a new line, so this drives a temporary line behind
// the scenes and moves the number over once it's real. Every consequential
// step (starting a real port, completing the move) requires an explicit
// confirm — this touches a real number and real billing.
export function IsraeliPortInCard({ lineId, requests }: Props) {
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const active = requests.find((r) => !["completed", "cancelled", "failed"].includes(r.status));

  function run(action: (fd: FormData) => Promise<unknown>, fd: FormData, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    startTransition(() => { void action(fd); });
  }

  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <PhoneCall className="h-4 w-4 text-link-blue" />
        Port in an Israeli number
      </h2>
      <p className="mt-1 text-xs text-muted-slate">
        Real SMS-verified carrier port — each step below is a live action, not a simulation.
      </p>

      {requests.length > 0 && (
        <div className="mt-4 grid gap-2">
          {requests.map((r) => (
            <div key={r.id} className={`rounded-xl p-3 ${r.id === active?.id ? "bg-link-blue/5" : "bg-slate-50"}`}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-semibold text-ink">{r.number}</p>
                  <p className="text-xs text-muted-slate">
                    {r.mode === "replace" ? "Replace primary" : "Add as secondary"} · {r.billingMode === "free" ? "Free" : "$10/mo"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {r.method && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        r.method === "direct" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}
                      title={
                        r.method === "direct"
                          ? "Ported directly onto this line — no temporary line involved"
                          : "Ported via a temporary landing line, then moved onto this line"
                      }
                    >
                      {r.method === "direct" ? "Direct" : "Landing line"}
                    </span>
                  )}
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-ink shadow-sm">
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
              </div>
              {r.error ? <p className="mt-2 text-xs text-rose-700">{r.error}</p> : null}

              {r.id === active?.id && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {r.status === "pending_auth" && (
                    <form action={(fd) => run(sendPortInAuthCodeAction, fd)}>
                      <input type="hidden" name="lineId" value={lineId} />
                      <input type="hidden" name="requestId" value={r.id} />
                      <button type="submit" disabled={pending} className="inline-flex items-center gap-1 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">
                        <ShieldCheck className="h-3.5 w-3.5" /> Send verification code
                      </button>
                    </form>
                  )}

                  {r.status === "verifying" && (
                    <form
                      action={(fd) => { fd.set("code", code); run(verifyPortInAuthCodeAction, fd); }}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="lineId" value={lineId} />
                      <input type="hidden" name="requestId" value={r.id} />
                      <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Code from SMS"
                        className="h-9 w-32 rounded-lg border border-ink/10 px-2 text-xs"
                      />
                      <button type="submit" disabled={pending || !code} className="inline-flex items-center gap-1 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">
                        <ShieldCheck className="h-3.5 w-3.5" /> Verify
                      </button>
                    </form>
                  )}

                  {r.status === "ready_to_port" && (
                    <form
                      action={(fd) => run(
                        startIsraeliPortInAction,
                        fd,
                        `This starts a REAL port for ${r.number} at Annatel — a temporary line is created to receive it. Proceed?`,
                      )}
                    >
                      <input type="hidden" name="lineId" value={lineId} />
                      <input type="hidden" name="requestId" value={r.id} />
                      <button type="submit" disabled={pending} className="inline-flex items-center gap-1 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">
                        <ArrowRightLeft className="h-3.5 w-3.5" /> Start port
                      </button>
                    </form>
                  )}

                  {r.status === "porting" && (
                    <form action={(fd) => run(refreshIsraeliPortInStatusAction, fd)}>
                      <input type="hidden" name="lineId" value={lineId} />
                      <input type="hidden" name="requestId" value={r.id} />
                      <button type="submit" disabled={pending} className="inline-flex items-center gap-1 rounded-lg border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50 disabled:opacity-40">
                        <RefreshCw className="h-3.5 w-3.5" /> Check status
                      </button>
                    </form>
                  )}

                  {r.status === "ready_to_complete" && (
                    <form
                      action={(fd) => run(
                        completeIsraeliPortInAction,
                        fd,
                        `This moves ${r.number} onto this line right now${r.mode === "replace" ? " and releases the current primary number" : ""}, and bills ${r.billingMode === "paid" ? "$10/mo" : "nothing (free)"}. This is the real, final step. Proceed?`,
                      )}
                    >
                      <input type="hidden" name="lineId" value={lineId} />
                      <input type="hidden" name="requestId" value={r.id} />
                      <button type="submit" disabled={pending} className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-40">
                        <ArrowRightLeft className="h-3.5 w-3.5" /> Complete — move number to this line
                      </button>
                    </form>
                  )}

                  {["pending_auth", "verifying", "ready_to_port"].includes(r.status) && (
                    <form action={(fd) => run(cancelIsraeliPortInAction, fd)}>
                      <input type="hidden" name="lineId" value={lineId} />
                      <input type="hidden" name="requestId" value={r.id} />
                      <button type="submit" disabled={pending} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-40">
                        <XCircle className="h-3.5 w-3.5" /> Cancel
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!active && (
        <form
          action={(fd) => run(createIsraeliPortInRequestAction, fd)}
          className="mt-4 grid gap-2 sm:grid-cols-2"
        >
          <input type="hidden" name="lineId" value={lineId} />
          <input name="number" required placeholder="Number to port, e.g. +972587280062" className="h-10 rounded-xl border border-ink/10 bg-slate-50 px-3 text-sm outline-none focus:border-link-blue sm:col-span-2" />
          <label className="grid gap-1 text-xs font-semibold text-ink">
            <span>What happens to the current number</span>
            <select name="mode" defaultValue="replace" className="h-10 rounded-xl border border-ink/10 bg-slate-50 px-3 text-sm outline-none focus:border-link-blue">
              <option value="replace">Replace it (released back to Annatel)</option>
              <option value="secondary">Keep it — add this as secondary</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-ink">
            <span>Billing</span>
            <select name="billingMode" defaultValue="paid" className="h-10 rounded-xl border border-ink/10 bg-slate-50 px-3 text-sm outline-none focus:border-link-blue">
              <option value="paid">Charge $10/mo</option>
              <option value="free">Free</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={pending}
            className="flex w-fit items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-40 sm:col-span-2"
          >
            <Plus className="h-4 w-4" />
            Start a port-in request
          </button>
        </form>
      )}
    </section>
  );
}
