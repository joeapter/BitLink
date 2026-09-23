// Tenant-wide usage meter — "what am I paying Annatel this month".
//
// Cost-focused by design. Telecom runs on pooled averages: light users
// subsidise heavy ones, so a customer at break-even is the model working, not a
// leak. The headline is therefore blended cost against blended revenue, and the
// per-line table below is framed as anomaly detection — an outlier usually
// means tethering, reselling or a stuck device — not a profitability ranking.

import type { Metadata } from "next";
import { Database, Gauge, Percent, Signal } from "lucide-react";
import { AdminMetric } from "@/components/admin/AdminMetric";
import { EmptyState } from "@/components/ui/EmptyState";
import { getUsageReport } from "@/lib/db/usage";

export const metadata: Metadata = { title: "Usage" };
export const dynamic = "force-dynamic";

function ils(agurot: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(agurot / 100);
}

function gb(value: number): string {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })} GB`;
}

export default async function UsagePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const offset = Math.min(0, Math.max(-11, parseInt(month ?? "0", 10) || 0));
  const report = await getUsageReport(offset);

  if (!report) {
    return <EmptyState title="Usage unavailable">The database isn&apos;t reachable right now.</EmptyState>;
  }

  const {
    monthLabel, daysElapsed, daysInMonth, isCurrentMonth,
    gb: totalGb, voiceMinutes, sms, activeLines, linesWithUsage,
    dataAgurot, voiceAgurot, smsAgurot, lineFeeAgurot, totalAgurot,
    projectedGb, projectedAgurot, mrrAgurot, costRatio, usdToIls,
    lines, history, ratesMissing,
  } = report;

  const ratioLabel = costRatio === null ? "—" : `${Math.round(costRatio * 100)}%`;
  // Carrier cost eating a third of revenue is the point at which the blend
  // stops being comfortable — worth a colour change rather than a silent number.
  const ratioTone = costRatio === null ? "blue" : costRatio > 0.33 ? "amber" : "green";

  const breakdown = [
    { label: "Data", detail: gb(totalGb), agurot: dataAgurot },
    { label: "Voice", detail: `${voiceMinutes.toLocaleString("en-US")} min`, agurot: voiceAgurot },
    { label: "SMS", detail: `${sms.toLocaleString("en-US")} messages`, agurot: smsAgurot },
    { label: "Line fees", detail: `${activeLines} active lines`, agurot: lineFeeAgurot },
  ];

  // An outlier is relative to the book, not an absolute number — what counts as
  // heavy on a 60-line tenant is ordinary on a 600-line one.
  const meanGb = lines.length ? totalGb / lines.length : 0;
  const outlierThreshold = meanGb * 3;

  return (
    <div className="grid gap-8">
      <section>
        <p className="text-sm font-semibold text-link-blue">Reporting</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Usage &amp; carrier cost</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-slate">
          What the whole book cost at Annatel in {monthLabel}
          {isCurrentMonth ? ` — ${daysElapsed} of ${daysInMonth} days so far` : ""}. Data is billed in
          decimal GB. International number fees are excluded: they are charged per number held rather
          than per number assigned, so they sit in overheads, not here.
        </p>
      </section>

      {ratesMissing && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-800">No carrier rates found</p>
          <p className="mt-1 text-sm text-amber-700">
            Every cost on this page will read zero until the rate card is populated.
          </p>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric label={`Data — ${monthLabel}`} value={gb(totalGb)} icon={Database} tone="blue" />
        <AdminMetric label="Carrier cost" value={ils(totalAgurot)} icon={Gauge} tone="purple" />
        <AdminMetric
          label={isCurrentMonth ? "Projected month end" : "Lines with usage"}
          value={isCurrentMonth && projectedAgurot !== null ? ils(projectedAgurot) : `${linesWithUsage}`}
          icon={Signal}
          tone="blue"
        />
        <AdminMetric label="Cost as % of revenue" value={ratioLabel} icon={Percent} tone={ratioTone} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-4xl border border-ink/10 bg-white p-6 shadow-soft">
          <h2 className="text-sm font-semibold text-ink">Cost breakdown</h2>
          <table className="mt-4 w-full text-sm">
            <tbody>
              {breakdown.map((row) => (
                <tr key={row.label} className="border-b border-ink/5 last:border-0">
                  <td className="py-2.5 font-medium text-ink">{row.label}</td>
                  <td className="py-2.5 text-right text-muted-slate">{row.detail}</td>
                  <td className="py-2.5 text-right font-semibold text-ink">{ils(row.agurot)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-ink/10">
                <td className="pt-3 font-semibold text-ink">Total</td>
                <td />
                <td className="pt-3 text-right text-lg font-semibold text-ink">{ils(totalAgurot)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-4 text-xs leading-5 text-muted-slate">
            Against {ils(mrrAgurot)} monthly revenue at ₪{usdToIls.toFixed(2)}/$.
            {isCurrentMonth && projectedGb !== null
              ? ` Straight-line projection to month end: ${gb(projectedGb)}.`
              : ""}
          </p>
        </div>

        <div className="rounded-4xl border border-ink/10 bg-white p-6 shadow-soft">
          <h2 className="text-sm font-semibold text-ink">Month over month</h2>
          {history.length ? (
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-slate">
                  <th className="pb-2 font-semibold">Month</th>
                  <th className="pb-2 text-right font-semibold">Data</th>
                  <th className="pb-2 text-right font-semibold">Lines</th>
                  <th className="pb-2 text-right font-semibold">Per line</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.month} className="border-b border-ink/5 last:border-0">
                    <td className="py-2.5 font-medium text-ink">{row.month}</td>
                    <td className="py-2.5 text-right text-ink">{gb(row.gb)}</td>
                    <td className="py-2.5 text-right text-muted-slate">{row.linesWithUsage}</td>
                    <td className="py-2.5 text-right text-muted-slate">
                      {row.linesWithUsage ? gb(row.gb / row.linesWithUsage) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-4 text-sm text-muted-slate">No usage recorded yet.</p>
          )}
          <p className="mt-4 text-xs leading-5 text-muted-slate">
            Per line is the one to watch — a jump there is a change in behaviour, while a jump in the
            total with per line flat is just growth.
          </p>
        </div>
      </section>

      <section className="rounded-4xl border border-ink/10 bg-white p-6 shadow-soft">
        <h2 className="text-sm font-semibold text-ink">By line</h2>
        <p className="mt-1 text-xs leading-5 text-muted-slate">
          Here to catch anomalies, not to rank customers. Heavy users are expected and priced for —
          flagged rows are simply more than 3× the {gb(meanGb)} average, which is usually worth a look
          for tethering, resale or a device stuck in a loop.
        </p>
        {lines.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-160 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-slate">
                  <th className="pb-2 font-semibold">Customer</th>
                  <th className="pb-2 font-semibold">Number</th>
                  <th className="pb-2 font-semibold">Plan</th>
                  <th className="pb-2 text-right font-semibold">Data</th>
                  <th className="pb-2 text-right font-semibold">Voice</th>
                  <th className="pb-2 text-right font-semibold">Cost</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const isOutlier = outlierThreshold > 0 && line.gb > outlierThreshold;
                  return (
                    <tr key={line.lineId} className="border-b border-ink/5 last:border-0">
                      <td className="py-2.5 font-medium text-ink">
                        {line.customerName}
                        {isOutlier && (
                          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                            check
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-muted-slate">{line.phoneNumber ?? "—"}</td>
                      <td className="py-2.5 text-muted-slate">{line.planSlug ?? "—"}</td>
                      <td className="py-2.5 text-right text-ink">{gb(line.gb)}</td>
                      <td className="py-2.5 text-right text-muted-slate">{line.voiceMinutes} min</td>
                      <td className="py-2.5 text-right text-muted-slate">{ils(line.costAgurot)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-slate">No usage recorded for {monthLabel}.</p>
        )}
      </section>

      <section className="flex flex-wrap gap-2 text-sm">
        {[0, -1, -2, -3].map((value) => (
          <a
            key={value}
            href={value === 0 ? "/admin/usage" : `/admin/usage?month=${value}`}
            className={`rounded-full px-4 py-2 font-semibold ${
              value === offset ? "bg-link-blue text-white" : "border border-ink/10 bg-white text-ink"
            }`}
          >
            {value === 0 ? "This month" : value === -1 ? "Last month" : `${-value} months ago`}
          </a>
        ))}
      </section>
    </div>
  );
}
