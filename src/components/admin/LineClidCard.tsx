"use client";

import { useTransition } from "react";
import type { LineClid } from "@/types/telecom";
import { addClidAction, removeClidAction } from "@/lib/admin/line-actions";
import { PhoneOutgoing, Plus, Trash2 } from "lucide-react";

interface Props {
  lineId: string;
  providerLineId: string;
  clids: LineClid[];
}

// Per-destination-group outbound caller ID — e.g. show a US number as caller
// ID when dialing the US, the Israeli number for domestic calls. Which
// destination_group_name values Annatel actually has for this tenant is
// unconfirmed — ask before relying on this for a real customer.
export function LineClidCard({ lineId, providerLineId, clids }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <PhoneOutgoing className="h-4 w-4 text-link-blue" />
        Caller ID by destination (CLID)
      </h2>
      <p className="mt-1 text-xs text-muted-slate">
        Experimental. Valid destination-group names for this tenant are unconfirmed — ask Annatel before
        expecting a specific group name to work.
      </p>

      <div className="mt-4 grid gap-2">
        {clids.length ? (
          clids.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div>
                <p className="font-mono text-sm font-semibold text-ink">{c.callerId}</p>
                <p className="text-xs text-muted-slate">
                  {c.destinationGroup?.name ?? "—"} · {c.service}
                  {typeof c.destinationGroupWeight === "number" ? ` · weight ${c.destinationGroupWeight}` : ""}
                </p>
              </div>
              <form action={(fd) => startTransition(() => { void removeClidAction(fd); })}>
                <input type="hidden" name="lineId" value={lineId} />
                <input type="hidden" name="providerLineId" value={providerLineId} />
                <input type="hidden" name="clidId" value={c.id} />
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-xl p-2 text-red-500 hover:bg-red-50 disabled:opacity-40"
                  title="Remove CLID"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </form>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-slate">No CLIDs configured.</p>
        )}
      </div>

      <form
        action={(fd) => startTransition(() => { void addClidAction(fd); })}
        className="mt-4 grid gap-2 sm:grid-cols-2"
      >
        <input type="hidden" name="lineId" value={lineId} />
        <input type="hidden" name="providerLineId" value={providerLineId} />
        <input name="callerId" required placeholder="Caller ID, e.g. +972551234567" className="h-10 rounded-xl border border-ink/10 bg-slate-50 px-3 text-sm outline-none focus:border-link-blue" />
        <input name="destinationGroupName" required placeholder="Destination group name (e.g. US)" className="h-10 rounded-xl border border-ink/10 bg-slate-50 px-3 text-sm outline-none focus:border-link-blue" />
        <input name="destinationGroupWeight" type="number" placeholder="Weight (optional)" className="h-10 rounded-xl border border-ink/10 bg-slate-50 px-3 text-sm outline-none focus:border-link-blue" />
        <select name="service" className="h-10 rounded-xl border border-ink/10 bg-slate-50 px-3 text-sm outline-none focus:border-link-blue">
          <option value="voice">voice</option>
          <option value="sms">sms</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="flex w-fit items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-40 sm:col-span-2"
        >
          <Plus className="h-4 w-4" />
          Add CLID
        </button>
      </form>
    </section>
  );
}
