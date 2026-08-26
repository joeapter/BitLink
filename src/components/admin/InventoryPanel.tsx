import { Boxes, AlertTriangle } from "lucide-react";
import type { InventorySnapshot, InventoryBucket } from "@/lib/admin/inventory";

// Free count leads, total is context, and the bar is there to be read at a
// glance rather than compared precisely — this panel is scanned on the way past,
// not studied.
const TONES: Record<InventoryBucket["level"], { text: string; bar: string; track: string }> = {
  ok: { text: "text-ink", bar: "bg-trust-green", track: "bg-emerald-100" },
  low: { text: "text-amber-700", bar: "bg-amber-500", track: "bg-amber-100" },
  critical: { text: "text-rose-700", bar: "bg-rose-600", track: "bg-rose-100" },
};

function Tile({ bucket }: { bucket: InventoryBucket }) {
  const tone = TONES[bucket.level];
  const pct = bucket.total > 0 ? Math.round((bucket.free / bucket.total) * 100) : 0;
  return (
    <div className="rounded-2xl border border-ink/10 bg-slate-50 p-3">
      <p className="text-xs font-medium leading-4 text-muted-slate">{bucket.label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${tone.text}`}>
        {bucket.free}
        <span className="ml-1 text-xs font-medium text-muted-slate">of {bucket.total} free</span>
      </p>
      <div className={`mt-2 h-1.5 w-full overflow-hidden rounded-full ${tone.track}`}>
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${pct}%` }} />
      </div>
      {bucket.note ? <p className="mt-1.5 text-[0.7rem] leading-4 text-muted-slate">{bucket.note}</p> : null}
    </div>
  );
}

export function InventoryPanel({ snapshot }: { snapshot: InventorySnapshot }) {
  const worst = [...snapshot.numbers, ...snapshot.sims].some((b) => b.level === "critical");

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft sm:rounded-4xl sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-ink">
          <Boxes className="h-5 w-5 text-link-blue" aria-hidden="true" />
          Inventory
        </h2>
        {worst ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            Order more
          </span>
        ) : null}
      </div>

      <p className="mt-1 text-xs text-muted-slate">
        What provisioning can run out of. Running dry is quiet — a line completes with no number, or an
        order fails outright.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {snapshot.numbers.map((b) => (
          <Tile key={b.key} bucket={b} />
        ))}
        {snapshot.sims.map((b) => (
          <Tile key={b.key} bucket={b} />
        ))}
      </div>

      {snapshot.idleIntlCount > 0 ? (
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">
            {snapshot.idleIntlCount} international numbers attached to nothing
          </p>
          <p className="text-sm font-semibold tabular-nums text-amber-900">
            ₪{(snapshot.idleIntlAgorot / 100).toFixed(0)}/month
          </p>
          <p className="w-full text-xs leading-5 text-amber-800">
            Annatel bills the whole allocation whether or not a number is in use, so an idle number is rent
            on nothing. Attaching one to a line costs nothing extra.
          </p>
        </div>
      ) : null}

      {snapshot.degraded ? (
        <p className="mt-3 text-xs font-medium text-amber-700">{snapshot.degraded}</p>
      ) : null}
    </section>
  );
}

export function InventoryPanelSkeleton() {
  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft sm:rounded-4xl sm:p-6">
      <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    </section>
  );
}
