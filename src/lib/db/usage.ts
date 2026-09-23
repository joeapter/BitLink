// Tenant-wide carrier usage and cost for a calendar month.
//
// The org profit report (src/app/admin/organizations/[id]/page.tsx) does this
// arithmetic for one organisation's customers; this does it for the whole book,
// which is the number that actually answers "what am I paying Annatel this
// month".
//
// Framing is deliberately COST-focused, not margin-focused. Telecom is a
// pooled-average business: light users subsidise heavy ones, and a single
// customer sitting at break-even is the model working as priced, not a leak.
// So the headline is blended cost as a share of revenue, and the per-line table
// exists to spot anomalies — a line at 500GB means tethering, reselling or a
// stuck device — rather than to rank customers by profitability.

import { getAdminDb } from "@/lib/db/admin";

/** Telecom billing uses decimal GB (1e9 bytes), not GiB. Matches the org report. */
const BYTES_PER_GB = 1_000_000_000;

export interface UsageLine {
  lineId: string;
  customerName: string;
  phoneNumber: string | null;
  planSlug: string | null;
  gb: number;
  voiceMinutes: number;
  sms: number;
  costAgurot: number;
}

export interface MonthTotals {
  month: string;
  gb: number;
  costAgurot: number;
  linesWithUsage: number;
}

export interface UsageReport {
  monthLabel: string;
  daysElapsed: number;
  daysInMonth: number;
  isCurrentMonth: boolean;

  gb: number;
  voiceMinutes: number;
  sms: number;
  activeLines: number;
  linesWithUsage: number;

  dataAgurot: number;
  voiceAgurot: number;
  smsAgurot: number;
  lineFeeAgurot: number;
  totalAgurot: number;

  /** Straight-line to month end. Null for a month already complete. */
  projectedGb: number | null;
  projectedAgurot: number | null;

  /** Monthly recurring revenue in agurot, converted at the live USD rate. */
  mrrAgurot: number;
  /** Cost as a share of revenue, 0–1. Null when revenue is unknown. */
  costRatio: number | null;
  usdToIls: number;

  lines: UsageLine[];
  history: MonthTotals[];
  /** True when carrier_rates could not be read — every cost here would be 0. */
  ratesMissing: boolean;
}

interface CdrRow {
  telecom_line_id: string | null;
  call_type: string;
  duration_sec: number | null;
  data_bytes: number | null;
  sms_count: number | null;
}

/**
 * Cost of one bundle of CDRs, in agurot. Mirrors calcCdrCost in the org report
 * — same rate keys, same decimal-GB basis, same "interconnect rides on top of
 * the per-minute rate" rule. Deliberately does NOT include international DID
 * fees: Annatel bills those per number HELD rather than per number assigned, so
 * they are a company-level fixed cost and are added once at the tenant level,
 * never attributed to a line.
 */
function costOf(rows: CdrRow[], rates: Record<string, number>): number {
  let cost = 0;
  for (const row of rows) {
    if (row.call_type === "data") {
      cost += ((row.data_bytes ?? 0) / BYTES_PER_GB) * (rates.data ?? 0);
    } else if (row.call_type === "voice") {
      const minutes = Math.ceil((row.duration_sec ?? 0) / 60);
      cost += minutes * (rates.voice ?? 0);
      cost += minutes * (rates.interconnect_out ?? 0);
    } else if (row.call_type === "sms") {
      cost += (row.sms_count ?? 0) * (rates.sms ?? 0);
    }
  }
  return cost;
}

/**
 * @param monthOffset 0 = this calendar month, -1 = last month, and so on.
 */
export async function getUsageReport(monthOffset = 0): Promise<UsageReport | null> {
  const db = await getAdminDb();
  if (!db) return null;

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthOffset, 1));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  const daysInMonth = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  const isCurrentMonth = monthOffset === 0;
  // Part-days would flatter the projection early in the day, so count whole
  // elapsed days and never less than one.
  const daysElapsed = isCurrentMonth ? Math.max(1, now.getUTCDate()) : daysInMonth;

  const [{ data: rateRows }, { data: cdrRows }, { count: activeLines }, { data: subRows }] =
    await Promise.all([
      db.from("carrier_rates").select("call_type, rate_agurot"),
      db
        .from("cdr_records")
        .select("telecom_line_id, call_type, duration_sec, data_bytes, sms_count")
        .gte("occurred_at", start.toISOString())
        .lt("occurred_at", end.toISOString()),
      db.from("telecom_lines").select("id", { count: "exact", head: true }).eq("status", "active"),
      db.from("subscribers").select("plan_slug, monthly_price_cents, status").eq("status", "active"),
    ]);

  const rates: Record<string, number> = {};
  for (const row of rateRows ?? []) rates[row.call_type] = Number(row.rate_agurot);
  const ratesMissing = Object.keys(rates).length === 0;

  const cdrs = (cdrRows ?? []) as CdrRow[];

  let totalBytes = 0;
  let totalSeconds = 0;
  let totalSms = 0;
  const byLine = new Map<string, CdrRow[]>();

  for (const row of cdrs) {
    totalBytes += row.data_bytes ?? 0;
    totalSeconds += row.duration_sec ?? 0;
    totalSms += row.sms_count ?? 0;
    const key = row.telecom_line_id;
    if (!key) continue;
    const bucket = byLine.get(key);
    if (bucket) bucket.push(row);
    else byLine.set(key, [row]);
  }

  // Resolve names only for lines that actually used something.
  const lineIds = [...byLine.keys()];
  const lineMeta = new Map<string, { customerName: string; phoneNumber: string | null; planSlug: string | null }>();

  if (lineIds.length) {
    const { data: lineRows } = await db
      .from("telecom_lines")
      .select("id, metadata, customers(full_name)")
      .in("id", lineIds);

    const { data: planRows } = await db
      .from("subscribers")
      .select("telecom_line_id, plan_slug")
      .in("telecom_line_id", lineIds);

    const planByLine = new Map<string, string | null>();
    for (const row of planRows ?? []) {
      planByLine.set(row.telecom_line_id as string, (row.plan_slug as string | null) ?? null);
    }

    for (const row of lineRows ?? []) {
      const meta = (row.metadata ?? {}) as Record<string, unknown>;
      const customer = row.customers as { full_name?: string | null } | null;
      lineMeta.set(row.id as string, {
        customerName: customer?.full_name?.trim() || "—",
        phoneNumber: (meta.phone_number as string | undefined) ?? null,
        planSlug: planByLine.get(row.id as string) ?? null,
      });
    }
  }

  const lines: UsageLine[] = [...byLine.entries()]
    .map(([lineId, rows]) => {
      const meta = lineMeta.get(lineId);
      return {
        lineId,
        customerName: meta?.customerName ?? "—",
        phoneNumber: meta?.phoneNumber ?? null,
        planSlug: meta?.planSlug ?? null,
        gb: rows.reduce((n, r) => n + (r.data_bytes ?? 0), 0) / BYTES_PER_GB,
        voiceMinutes: Math.round(rows.reduce((n, r) => n + (r.duration_sec ?? 0), 0) / 60),
        sms: rows.reduce((n, r) => n + (r.sms_count ?? 0), 0),
        costAgurot: costOf(rows, rates),
      };
    })
    .sort((a, b) => b.gb - a.gb);

  const gb = totalBytes / BYTES_PER_GB;
  const dataAgurot = gb * (rates.data ?? 0);
  const voiceMinutes = Math.round(totalSeconds / 60);
  const voiceAgurot = voiceMinutes * ((rates.voice ?? 0) + (rates.interconnect_out ?? 0));
  const smsAgurot = totalSms * (rates.sms ?? 0);
  // The line fee is monthly per active line — not prorated by how far into the
  // month we are, because Annatel charges it whole.
  const lineFeeAgurot = (activeLines ?? 0) * (rates.line_fee ?? 0);
  const totalAgurot = dataAgurot + voiceAgurot + smsAgurot + lineFeeAgurot;

  // Revenue: plan list price by slug, since subscribers.monthly_price_cents is
  // frequently null until the first invoice — except where it has been set to a
  // negotiated amount, which must win over the list price.
  const { data: planPriceRows } = await db.from("plans").select("slug, monthly_price_cents");
  const planPrice = new Map<string, number>();
  for (const row of planPriceRows ?? []) {
    planPrice.set(row.slug as string, (row.monthly_price_cents as number | null) ?? 0);
  }

  let mrrCents = 0;
  for (const sub of subRows ?? []) {
    const custom = sub.monthly_price_cents as number | null;
    mrrCents += custom ?? planPrice.get(sub.plan_slug as string) ?? 0;
  }

  const { getUsdToIlsRate } = await import("@/lib/fx");
  const { rate: usdToIls } = await getUsdToIlsRate();
  const mrrAgurot = mrrCents * usdToIls;

  const projectedGb = isCurrentMonth ? (gb / daysElapsed) * daysInMonth : null;
  const projectedAgurot = isCurrentMonth
    ? ((dataAgurot + voiceAgurot + smsAgurot) / daysElapsed) * daysInMonth + lineFeeAgurot
    : null;

  // Trend. One pass over every CDR rather than a query per month — the table is
  // small, and this keeps the page to a fixed number of round trips.
  const { data: allCdrs } = await db.from("cdr_records").select("occurred_at, data_bytes, telecom_line_id");
  const historyMap = new Map<string, { bytes: number; lines: Set<string> }>();
  for (const row of allCdrs ?? []) {
    const key = String(row.occurred_at).slice(0, 7);
    const bucket = historyMap.get(key) ?? { bytes: 0, lines: new Set<string>() };
    bucket.bytes += (row.data_bytes as number | null) ?? 0;
    if (row.telecom_line_id) bucket.lines.add(row.telecom_line_id as string);
    historyMap.set(key, bucket);
  }

  const history: MonthTotals[] = [...historyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, bucket]) => ({
      month,
      gb: bucket.bytes / BYTES_PER_GB,
      costAgurot: (bucket.bytes / BYTES_PER_GB) * (rates.data ?? 0),
      linesWithUsage: bucket.lines.size,
    }));

  return {
    monthLabel: start.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
    daysElapsed,
    daysInMonth,
    isCurrentMonth,
    gb,
    voiceMinutes,
    sms: totalSms,
    activeLines: activeLines ?? 0,
    linesWithUsage: byLine.size,
    dataAgurot,
    voiceAgurot,
    smsAgurot,
    lineFeeAgurot,
    totalAgurot,
    projectedGb,
    projectedAgurot,
    mrrAgurot,
    costRatio: mrrAgurot > 0 ? totalAgurot / mrrAgurot : null,
    usdToIls,
    lines,
    history,
    ratesMissing,
  };
}
