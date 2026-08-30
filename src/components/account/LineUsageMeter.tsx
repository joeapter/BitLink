import { getTelecomProvider } from "@/lib/telecom/provider.registry";
import { getCdrUsageBuckets } from "@/lib/cdr/usage";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BalanceBucket } from "@/types/telecom";

interface Props {
  providerLineId: string;
  // Sizes the CDR-derived fallback meter when the provider returns no live
  // balances (which, today, it never does — see lib/cdr/usage.ts). Optional
  // because the component looks it up from the line when it isn't given:
  // two of the three portal surfaces forgot to pass it, and every customer not
  // on Student 5G was shown that plan's 50GB allowance as a result.
  planSlug?: string | null;
  // Internal telecom_lines.id — used to fold active topup grants into the
  // CDR-derived allowance. Optional only so existing callers keep working;
  // omitting it just means topups won't be reflected.
  lineId?: string;
}

function fmtBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
  return `${Math.round(bytes / 1e3)} KB`;
}

function fmtMinutes(seconds: number): string {
  return `${Math.floor(seconds / 60)} min`;
}

function BucketBar({ bucket }: { bucket: BalanceBucket }) {
  const used = bucket.initialValue - bucket.value;
  const pct = bucket.initialValue ? Math.min(100, Math.round((used / bucket.initialValue) * 100)) : 0;
  const isData = bucket.type.toLowerCase().includes("data") || bucket.categories.some(c => c.includes("data"));
  const isVoice = bucket.type.toLowerCase().includes("voice") || bucket.categories.some(c => c.includes("voice"));
  const isSms = bucket.type.toLowerCase().includes("sms") || bucket.categories.some(c => c.includes("sms"));

  const label = isData ? "Data" : isVoice ? "Minutes" : isSms ? "SMS" : bucket.type;
  const usedFmt = isData ? fmtBytes(used) : isVoice ? fmtMinutes(used) : String(Math.round(used));
  const totalFmt = isData ? fmtBytes(bucket.initialValue) : isVoice ? fmtMinutes(bucket.initialValue) : String(Math.round(bucket.initialValue));
  const remainFmt = isData ? fmtBytes(bucket.value) : isVoice ? fmtMinutes(bucket.value) : String(Math.round(bucket.value));

  const barColor =
    pct > 90 ? "bg-red-500" :
    pct > 70 ? "bg-amber-500" :
    "bg-emerald-500";

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-ink">{label}</span>
        <span className="text-muted-slate">{remainFmt} remaining</span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-ink/8">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[0.65rem] text-muted-slate">
        {usedFmt} used of {totalFmt} · {pct}%
      </p>
    </div>
  );
}

export async function LineUsageMeter({ providerLineId, planSlug, lineId }: Props) {
  let balances: BalanceBucket[] = [];
  let fromCdr = false;

  try {
    const provider = getTelecomProvider();
    balances = await provider.getBalances(providerLineId);
  } catch {
    // Fall through to the CDR-derived meter below.
  }

  if (!balances.length) {
    try {
      const db = await createSupabaseServerClient();
      const activeTopupIds = lineId
        ? (
            await db
              .from("line_topup_grants")
              .select("topup_id")
              .eq("line_id", lineId)
              .eq("status", "active")
          ).data?.map((g) => g.topup_id as string) ?? []
        : [];
      // Fall back to reading the plan off the line itself. getCdrUsageBuckets
      // now refuses to guess, so without this a caller that omits the prop
      // would get no meter at all rather than a wrong one — better, but still
      // not what the customer should see.
      let resolvedPlanSlug = planSlug ?? null;
      if (!resolvedPlanSlug) {
        const { data: lineRow } = await db
          .from("telecom_lines")
          .select("metadata")
          .eq(lineId ? "id" : "provider_line_id", lineId ?? providerLineId)
          .maybeSingle();
        resolvedPlanSlug =
          ((lineRow?.metadata ?? {}) as Record<string, unknown>).plan_slug as string | null ?? null;
      }

      const cdrUsage = await getCdrUsageBuckets(db, { providerLineId }, resolvedPlanSlug, activeTopupIds);
      if (cdrUsage) {
        balances = cdrUsage.buckets;
        fromCdr = true;
      }
    } catch {
      // Leave balances empty; the unavailable message renders below.
    }
  }

  if (!balances.length) {
    return (
      <p className="mt-3 text-xs text-muted-slate">Usage data unavailable.</p>
    );
  }

  return (
    <div className="mt-4 grid gap-3 rounded-xl border border-ink/8 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-slate">
        This month&apos;s usage
      </p>
      {balances.map((b) => (
        <BucketBar key={b.id} bucket={b} />
      ))}
      <p className="text-[0.6rem] text-muted-slate">
        Resets {balances[0]?.expirationDate.toLocaleDateString() ?? "—"}
        {fromCdr ? " · synced every ~4 hours" : ""}
      </p>
    </div>
  );
}
