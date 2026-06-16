"use client";

import { useTransition } from "react";
import { AlertTriangle, Power, PowerOff, RefreshCw, RotateCcw, Wifi, ZapOff } from "lucide-react";
import {
  refreshLineAction,
  hardResetLineAction,
  hlrResetAction,
  suspendLineAction,
  reactivateLineAction,
  terminateLineAction,
} from "@/lib/admin/line-actions";

interface Props {
  lineId: string;
  providerLineId: string;
  currentStatus: string;
}

function ActionButton({
  label,
  icon: Icon,
  tone,
  children,
}: {
  label: string;
  icon: React.ElementType;
  tone: "blue" | "amber" | "red" | "green" | "slate";
  children: React.ReactNode;
}) {
  const colors = {
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
    amber: "bg-amber-500 hover:bg-amber-600 text-white",
    red: "bg-red-600 hover:bg-red-700 text-white",
    green: "bg-emerald-600 hover:bg-emerald-700 text-white",
    slate: "bg-slate-200 hover:bg-slate-300 text-slate-800",
  };

  return (
    <button
      type="submit"
      className={`flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${colors[tone]}`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
      {children}
    </button>
  );
}

export function LineActionsPanel({ lineId, providerLineId, currentStatus }: Props) {
  const [pending, startTransition] = useTransition();
  const isSuspended = currentStatus === "suspended";

  function hidden(name: string, value: string) {
    return <input type="hidden" name={name} value={value} />;
  }

  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-ink">Line actions</h2>
      <p className="mt-1 text-xs text-muted-slate">All actions call Annatel API directly and take effect immediately.</p>

      <div className="mt-5 grid gap-3">
        {/* Refresh — soft reset, re-registers on network */}
        <form action={(fd) => startTransition(() => { void refreshLineAction(fd); })}>
          {hidden("lineId", lineId)}
          {hidden("providerLineId", providerLineId)}
          <ActionButton label="Refresh line" icon={RefreshCw} tone="blue">
            {pending && <span className="ml-auto text-xs opacity-70">…</span>}
          </ActionButton>
        </form>
        <p className="ml-2 text-xs text-muted-slate">Soft network re-registration. Use when customer can't connect.</p>

        {/* Hard reset — full SIM/network reset */}
        <form action={(fd) => startTransition(() => { void hardResetLineAction(fd); })}>
          {hidden("lineId", lineId)}
          {hidden("providerLineId", providerLineId)}
          <ActionButton label="Hard reset" icon={RotateCcw} tone="amber">
            {pending && <span className="ml-auto text-xs opacity-70">…</span>}
          </ActionButton>
        </form>
        <p className="ml-2 text-xs text-muted-slate">Full SIM + network reset. Use for persistent connection issues.</p>

        {/* HLR / IMS reset */}
        <form action={(fd) => startTransition(() => { void hlrResetAction(fd); })}>
          {hidden("lineId", lineId)}
          {hidden("providerLineId", providerLineId)}
          <ActionButton label="HLR / IMS reset" icon={Wifi} tone="slate">
            {pending && <span className="ml-auto text-xs opacity-70">…</span>}
          </ActionButton>
        </form>
        <p className="ml-2 text-xs text-muted-slate">Sends RTR to HLR. Use when VoLTE or IMS registration fails.</p>

        <hr className="border-ink/8" />

        {/* Suspend / reactivate */}
        {isSuspended ? (
          <>
            <form action={(fd) => startTransition(() => { void reactivateLineAction(fd); })}>
              {hidden("lineId", lineId)}
              {hidden("providerLineId", providerLineId)}
              <ActionButton label="Reactivate line" icon={Power} tone="green">
                {pending && <span className="ml-auto text-xs opacity-70">…</span>}
              </ActionButton>
            </form>
            <p className="ml-2 text-xs text-muted-slate">Lifts all active suspensions.</p>
          </>
        ) : (
          <>
            <form action={(fd) => startTransition(() => { void suspendLineAction(fd); })}>
              {hidden("lineId", lineId)}
              {hidden("providerLineId", providerLineId)}
              <input type="hidden" name="reason" value="admin" />
              <ActionButton label="Suspend line" icon={PowerOff} tone="amber">
                {pending && <span className="ml-auto text-xs opacity-70">…</span>}
              </ActionButton>
            </form>
            <p className="ml-2 text-xs text-muted-slate">Immediately suspends service. Customer loses connectivity.</p>
          </>
        )}

        <hr className="border-ink/8" />

        {/* Terminate — destructive */}
        <form
          action={(fd) => {
            if (!confirm("Permanently terminate this line? This cannot be undone.")) return;
            startTransition(() => { void terminateLineAction(fd); });
          }}
        >
          {hidden("lineId", lineId)}
          {hidden("providerLineId", providerLineId)}
          <ActionButton label="Terminate line" icon={ZapOff} tone="red">
            {pending && <span className="ml-auto text-xs opacity-70">…</span>}
          </ActionButton>
        </form>
        <p className="ml-2 flex items-center gap-1 text-xs text-red-600">
          <AlertTriangle className="h-3 w-3" />
          Permanent — removes line from Annatel network.
        </p>
      </div>
    </section>
  );
}
