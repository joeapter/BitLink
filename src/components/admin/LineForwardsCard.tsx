"use client";

import { useTransition } from "react";
import type { LineForward } from "@/types/telecom";
import { addForwardAction, removeForwardAction } from "@/lib/admin/line-actions";
import { PhoneForwarded, Plus, Trash2 } from "lucide-react";

interface Props {
  lineId: string;
  providerLineId: string;
  forwards: LineForward[];
}

export function LineForwardsCard({ lineId, providerLineId, forwards }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <PhoneForwarded className="h-4 w-4 text-link-blue" />
        Call forwarding
      </h2>

      <div className="mt-4 grid gap-2">
        {forwards.length ? (
          forwards.map((fwd) => (
            <div key={fwd.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div>
                <p className="font-semibold text-ink">{fwd.destination}</p>
                <p className="text-xs text-muted-slate">Added {fwd.createdAt.toLocaleDateString()}</p>
              </div>
              <form action={(fd) => startTransition(() => { void removeForwardAction(fd); })}>
                <input type="hidden" name="lineId" value={lineId} />
                <input type="hidden" name="providerLineId" value={providerLineId} />
                <input type="hidden" name="forwardId" value={fwd.id} />
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-xl p-2 text-red-500 hover:bg-red-50 disabled:opacity-40"
                  title="Remove forward"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </form>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-slate">No call forwarding set.</p>
        )}
      </div>

      {/* Add forward */}
      <form
        action={(fd) => startTransition(() => { void addForwardAction(fd); })}
        className="mt-4 flex gap-2"
      >
        <input type="hidden" name="lineId" value={lineId} />
        <input type="hidden" name="providerLineId" value={providerLineId} />
        <input
          name="destination"
          placeholder="+972XXXXXXXXX"
          className="flex-1 rounded-xl border border-ink/10 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-link-blue focus:ring-2 focus:ring-link-blue/15"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/80 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </form>
    </section>
  );
}
