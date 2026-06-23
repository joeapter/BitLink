import type { Metadata } from "next";
import { Suspense } from "react";
import { BarChart2, Phone } from "lucide-react";
import { requireUser } from "@/lib/auth/server";
import { getAccountSnapshot } from "@/lib/db/account";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LineUsageMeter } from "@/components/account/LineUsageMeter";

export const metadata: Metadata = { title: "Usage" };
export const dynamic = "force-dynamic";

function fmtData(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
  if (bytes > 0)    return `${Math.round(bytes / 1e3)} KB`;
  return "0 MB";
}

function fmtMinutes(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function UsageStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-5 py-4">
      <p className="text-xs font-semibold text-muted-slate">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-ink">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted-slate">{sub}</p> : null}
    </div>
  );
}

export default async function UsagePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const { month: monthParam, year: yearParam } = await searchParams;

  const now = new Date();
  const reportYear  = parseInt(yearParam  ?? String(now.getFullYear()),   10);
  const reportMonth = Math.min(12, Math.max(1, parseInt(monthParam ?? String(now.getMonth() + 1), 10)));
  const monthStart  = new Date(reportYear, reportMonth - 1, 1).toISOString();
  const monthEnd    = new Date(reportYear, reportMonth,     1).toISOString();
  const monthLabel  = new Date(reportYear, reportMonth - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
  const isCurrentMonth = reportYear === now.getFullYear() && reportMonth === now.getMonth() + 1;

  const user = await requireUser();
  const snapshot = await getAccountSnapshot(user.id);

  // CDR records for this customer in the selected month
  const supabase = await createSupabaseServerClient();
  const { data: cdrs } = await supabase
    .from("cdr_records")
    .select("telecom_line_id, call_type, duration_sec, data_bytes, sms_count, occurred_at")
    .eq("customer_id", snapshot.customer?.id ?? "")
    .gte("occurred_at", monthStart)
    .lt("occurred_at", monthEnd)
    .order("occurred_at", { ascending: false });

  // Aggregate per line
  type LineAgg = {
    dataBytes: number;
    voiceSec: number;
    smsCount: number;
    lastActivity: string | null;
    recordCount: number;
  };
  const byLine: Record<string, LineAgg> = {};

  for (const cdr of cdrs ?? []) {
    const lid = cdr.telecom_line_id ?? "__unknown__";
    if (!byLine[lid]) byLine[lid] = { dataBytes: 0, voiceSec: 0, smsCount: 0, lastActivity: null, recordCount: 0 };
    const agg = byLine[lid];
    agg.recordCount++;
    if (!agg.lastActivity || cdr.occurred_at > agg.lastActivity) agg.lastActivity = cdr.occurred_at;
    if (cdr.call_type === "data")  agg.dataBytes += cdr.data_bytes  ?? 0;
    if (cdr.call_type === "voice") agg.voiceSec  += cdr.duration_sec ?? 0;
    if (cdr.call_type === "sms")   agg.smsCount  += cdr.sms_count   ?? 0;
  }

  // Map line IDs to line metadata
  const lineById = Object.fromEntries(snapshot.lines.map((l) => [l.id, l]));

  // All lines with activity, plus any active lines with no CDR data yet
  const activeLines = snapshot.lines.filter((l) => l.status === "active" || byLine[l.id]);
  const hasCdrData = Object.keys(byLine).length > 0;

  return (
    <div className="grid gap-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-link-blue">Account</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Usage</h1>
          <p className="mt-1 text-sm text-muted-slate">{monthLabel}</p>
        </div>

        {/* Month picker */}
        <form method="GET" className="flex items-end gap-2">
          <div className="grid gap-1">
            <label className="text-xs font-semibold text-muted-slate" htmlFor="usage-month">Month</label>
            <select
              id="usage-month"
              name="month"
              defaultValue={reportMonth}
              className="h-10 rounded-2xl border border-ink/10 bg-white px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-link-blue"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1, 1).toLocaleString("en-US", { month: "long" })}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-semibold text-muted-slate" htmlFor="usage-year">Year</label>
            <input
              id="usage-year"
              name="year"
              type="number"
              min="2024"
              max="2030"
              defaultValue={reportYear}
              className="h-10 w-24 rounded-2xl border border-ink/10 bg-white px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-link-blue"
            />
          </div>
          <button
            type="submit"
            className="h-10 rounded-2xl border border-ink/10 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Go
          </button>
        </form>
      </section>

      {/* Per-line cards */}
      {activeLines.length ? (
        <div className="grid gap-4">
          {activeLines.map((line) => {
            const agg = byLine[line.id];
            const phone = (line.metadata as Record<string, unknown>)?.phone_number as string | undefined;

            return (
              <section key={line.id} className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-white">
                    <Phone className="h-4 w-4" aria-hidden />
                  </div>
                  <div>
                    <p className="text-lg font-semibold tracking-wide text-ink">
                      {phone ?? "Line pending activation"}
                    </p>
                    {agg?.lastActivity ? (
                      <p className="text-xs text-muted-slate">
                        Last activity {new Date(agg.lastActivity).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-slate">No activity recorded this month</p>
                    )}
                  </div>
                </div>

                {agg ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <UsageStat
                      label="Data"
                      value={fmtData(agg.dataBytes)}
                    />
                    <UsageStat
                      label="Voice"
                      value={fmtMinutes(agg.voiceSec)}
                      sub={`${Math.ceil(agg.voiceSec / 60)} billed minutes`}
                    />
                    <UsageStat
                      label="SMS"
                      value={String(agg.smsCount)}
                      sub="outgoing messages"
                    />
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl bg-slate-50 px-5 py-4 text-sm text-muted-slate">
                    {hasCdrData
                      ? "No activity on this line this month."
                      : "No usage data yet — syncs every 4 hours from your carrier."}
                  </div>
                )}

                {/* Live plan balance (current month only, active lines with a provider ID) */}
                {isCurrentMonth && line.status === "active" && line.provider_line_id ? (
                  <div className="mt-5 border-t border-ink/8 pt-5">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart2 className="h-4 w-4 text-muted-slate" aria-hidden />
                      <p className="text-xs font-semibold text-muted-slate uppercase tracking-widest">Plan balance</p>
                    </div>
                    <Suspense fallback={<div className="h-20 animate-pulse rounded-xl bg-slate-100" />}>
                      <LineUsageMeter providerLineId={line.provider_line_id} />
                    </Suspense>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      ) : (
        <section className="rounded-[2rem] border border-ink/10 bg-white p-8 shadow-soft">
          <div className="grid h-40 place-items-center text-center">
            <div>
              <p className="text-sm font-semibold text-ink">No active lines yet</p>
              <p className="mt-1 text-sm text-muted-slate">Usage will appear here once your line is activated.</p>
            </div>
          </div>
        </section>
      )}

      <p className="text-center text-xs text-muted-slate">
        Usage data syncs every 4 hours from your carrier. Plan balance is live.
      </p>
    </div>
  );
}
