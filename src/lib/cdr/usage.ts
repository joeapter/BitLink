// CDR-derived plan-usage meters.
//
// Annatel's live balance endpoint (GET lines/{id}/ocs_balances) has returned
// HTTP 200 with an empty body on every call since June 2026 (see
// provider_sync_logs), so the plan-balance UIs can't rely on it. Instead we
// derive "used X of Y" from the CDR records the VPS relay ingests from
// Annatel's FTP every ~4 hours. Callers should try the provider's live
// balances first and fall back to these buckets.
//
// The window is the current calendar month — matching the month framing the
// /account/usage page already uses — not the Stripe billing anniversary.
// That's the honest resolution CDRs give us today; switch to cycle anchors
// if live balances ever arrive.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BalanceBucket } from "@/types/telecom";
import { getPlan } from "@/lib/plans";

export type CdrUsageResult = {
  buckets: BalanceBucket[];
  monthStart: Date;
  monthEnd: Date;
  recordCount: number;
};

type LineFilter = { providerLineId: string } | { telecomLineId: string };

export async function getCdrUsageBuckets(
  db: SupabaseClient,
  filter: LineFilter,
  planSlug: string | null | undefined,
): Promise<CdrUsageResult | null> {
  const plan = getPlan(planSlug);
  if (!plan) return null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  let query = db
    .from("cdr_records")
    .select("call_type, duration_sec, data_bytes, sms_count, direction")
    .gte("occurred_at", monthStart.toISOString())
    .lt("occurred_at", monthEnd.toISOString());
  query =
    "providerLineId" in filter
      ? query.eq("provider_line_id", filter.providerLineId)
      : query.eq("telecom_line_id", filter.telecomLineId);

  const { data: rows, error } = await query;
  if (error) return null;

  // Data counts in both directions; included minutes and SMS only cover
  // outgoing (incoming calls and texts are free in Israel).
  let dataBytes = 0;
  let voiceSec = 0;
  let smsCount = 0;
  for (const r of rows ?? []) {
    if (r.call_type === "data") dataBytes += r.data_bytes ?? 0;
    if (r.direction !== "outgoing") continue;
    if (r.call_type === "voice") voiceSec += r.duration_sec ?? 0;
    if (r.call_type === "sms") smsCount += r.sms_count ?? 0;
  }

  const { allowances } = plan;
  const buckets: BalanceBucket[] = [];
  // Voice buckets are denominated in seconds (both meter components format
  // voice values via seconds→minutes).
  if (allowances.dataBytes !== null) {
    buckets.push(makeBucket("data", allowances.dataBytes, dataBytes, monthEnd));
  }
  buckets.push(makeBucket("voice", allowances.voiceMinutes * 60, voiceSec, monthEnd));
  if (allowances.smsCount !== null) {
    buckets.push(makeBucket("sms", allowances.smsCount, smsCount, monthEnd));
  }

  return { buckets, monthStart, monthEnd, recordCount: rows?.length ?? 0 };
}

function makeBucket(
  type: "data" | "voice" | "sms",
  allowance: number,
  used: number,
  monthEnd: Date,
): BalanceBucket {
  return {
    id: `cdr-${type}`,
    type,
    categories: [type],
    value: Math.max(0, allowance - used),
    initialValue: allowance,
    expirationDate: monthEnd,
    weight: 0,
  };
}
