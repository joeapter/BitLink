import type { BalanceBucket } from "@/types/telecom";
import { BarChart2 } from "lucide-react";

interface Props {
  balances: BalanceBucket[];
}

function fmt(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${Math.round(bytes / 1e3)} KB`;
}

function pct(value: number, initial: number): number {
  if (!initial) return 0;
  return Math.max(0, Math.min(100, Math.round(((initial - value) / initial) * 100)));
}

export function LineBalanceCard({ balances }: Props) {
  if (!balances.length) {
    return (
      <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <BarChart2 className="h-4 w-4 text-link-blue" />
          Balance / usage
        </h2>
        <p className="mt-3 text-sm text-muted-slate">No balance data available.</p>
      </section>
    );
  }

  const isData = (b: BalanceBucket) =>
    b.type.toLowerCase().includes("data") || b.categories.some((c) => c.includes("data"));
  const isVoice = (b: BalanceBucket) =>
    b.type.toLowerCase().includes("voice") || b.categories.some((c) => c.includes("voice"));
  const isSms = (b: BalanceBucket) =>
    b.type.toLowerCase().includes("sms") || b.categories.some((c) => c.includes("sms"));

  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <BarChart2 className="h-4 w-4 text-link-blue" />
        Balance / usage
      </h2>

      <div className="mt-5 grid gap-4">
        {balances.map((b) => {
          const used = b.initialValue - b.value;
          const usedPct = pct(b.value, b.initialValue);
          const isDataBucket = isData(b);
          const bar =
            usedPct > 90
              ? "bg-red-500"
              : usedPct > 70
                ? "bg-amber-500"
                : "bg-emerald-500";

          return (
            <div key={b.id} className="rounded-xl border border-ink/8 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold capitalize text-ink">
                  {isData(b) ? "Data" : isVoice(b) ? "Voice" : isSms(b) ? "SMS" : b.type}
                </p>
                <p className="text-xs text-muted-slate">
                  Expires {b.expirationDate.toLocaleDateString()}
                </p>
              </div>

              <div className="mt-2 flex items-end justify-between text-xs text-muted-slate">
                <span>
                  Used:{" "}
                  <span className="font-semibold text-ink">
                    {isDataBucket ? fmt(used) : Math.round(used)}
                  </span>
                </span>
                <span>
                  Remaining:{" "}
                  <span className="font-semibold text-ink">
                    {isDataBucket ? fmt(b.value) : Math.round(b.value)}
                  </span>
                </span>
              </div>

              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink/10">
                <div
                  className={`h-full rounded-full transition-all ${bar}`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-muted-slate">{usedPct}% used</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
