"use client";

import { useTransition } from "react";
import type { LineBarring } from "@/types/telecom";
import { addBarringAction, removeBarringAction } from "@/lib/admin/line-actions";
import { Ban, Plus, Trash2 } from "lucide-react";

const BARRING_TYPES = [
  { value: "all_outgoing", label: "Block all outgoing calls" },
  { value: "international", label: "Block international calls" },
  { value: "premium_rate", label: "Block premium rate numbers" },
  { value: "all_incoming", label: "Block all incoming calls" },
  { value: "roaming_outgoing", label: "Block roaming outgoing" },
];

interface Props {
  lineId: string;
  providerLineId: string;
  barrings: LineBarring[];
}

export function LineBarringsCard({ lineId, providerLineId, barrings }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <Ban className="h-4 w-4 text-amber-600" />
        Call barrings
      </h2>
      <p className="mt-1 text-xs text-muted-slate">
        Barrings block specific call types. Different from a full suspension.
      </p>

      <div className="mt-4 grid gap-2">
        {barrings.length ? (
          barrings.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-xl bg-amber-50 p-3">
              <div>
                <p className="font-semibold text-amber-900">{b.type}</p>
                <p className="text-xs text-amber-700">Since {b.createdAt.toLocaleDateString()}</p>
              </div>
              <form action={(fd) => startTransition(() => { void removeBarringAction(fd); })}>
                <input type="hidden" name="lineId" value={lineId} />
                <input type="hidden" name="providerLineId" value={providerLineId} />
                <input type="hidden" name="barringId" value={b.id} />
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-xl p-2 text-red-500 hover:bg-red-50 disabled:opacity-40"
                  title="Remove barring"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </form>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-slate">No barrings active.</p>
        )}
      </div>

      {/* Add barring */}
      <form
        action={(fd) => startTransition(() => { void addBarringAction(fd); })}
        className="mt-4 flex gap-2"
      >
        <input type="hidden" name="lineId" value={lineId} />
        <input type="hidden" name="providerLineId" value={providerLineId} />
        <select
          name="type"
          className="flex-1 rounded-xl border border-ink/10 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-link-blue"
        >
          {BARRING_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </form>
    </section>
  );
}
