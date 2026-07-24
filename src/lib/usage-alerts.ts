// Proactive data-usage warning emails.
//
// BitLink has no overage billing — when a line hits its data cap, data simply
// stops until the customer tops up or the month resets. That's customer-
// friendly, but only if the customer isn't surprised by it: this job watches
// CDR-derived usage (synced every ~4h) and emails the customer at 80%
// ("heads up") and 95% ("almost out"), with the reset date and self-serve
// topup options they can buy in the portal.
//
// Idempotent per line/month/level via telecom_lines.metadata.data_alert —
// each level sends at most once per calendar month, and a 95% send supersedes
// the 80% one (a line that jumps straight past both gets only the 95% email).

import type { SupabaseClient } from "@supabase/supabase-js";
import { getCdrUsageBuckets } from "@/lib/cdr/usage";
import { getTopUpsForPlan } from "@/lib/topups";
import { sendEmail } from "@/lib/email/send";
import { buildDataUsageAlertEmail } from "@/lib/email/templates";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "usage-alerts" });

const WARNING_PCT = 0.8;
const CRITICAL_PCT = 0.95;

export type UsageAlertRunResult = {
  month: string;
  checked: number;
  sent: number;
  skipped: number;
  errors: number;
};

type AlertLevel = "warning" | "critical";

function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatGb(bytes: number): string {
  return `${(bytes / 1_000_000_000).toFixed(1)}GB`;
}

export async function processDataUsageAlerts(admin: SupabaseClient, now = new Date()): Promise<UsageAlertRunResult> {
  const month = monthKey(now);
  const result: UsageAlertRunResult = { month, checked: 0, sent: 0, skipped: 0, errors: 0 };

  // Active, non-kosher lines only — kosher plans are voice-only (no data
  // bucket to alert on). Customer email comes via the customers join.
  const { data: lines } = await admin
    .from("telecom_lines")
    .select("id, customer_id, is_kosher, metadata, customers(full_name, email)")
    .eq("status", "active")
    .eq("is_kosher", false);

  for (const line of lines ?? []) {
    result.checked++;
    try {
      const meta = (line.metadata ?? {}) as Record<string, unknown>;
      const planSlug = meta.plan_slug as string | undefined;
      const customer = line.customers as { full_name?: string; email?: string } | null;
      if (!planSlug || !customer?.email) {
        result.skipped++;
        continue;
      }

      const usage = await getCdrUsageBuckets(admin, { telecomLineId: line.id as string }, planSlug);
      const dataBucket = usage?.buckets.find((b) => b.type === "data");
      if (!usage || !dataBucket || dataBucket.initialValue <= 0) {
        result.skipped++;
        continue;
      }

      const usedBytes = dataBucket.initialValue - dataBucket.value;
      const pct = usedBytes / dataBucket.initialValue;
      const level: AlertLevel | null = pct >= CRITICAL_PCT ? "critical" : pct >= WARNING_PCT ? "warning" : null;
      if (!level) {
        result.skipped++;
        continue;
      }

      // One send per level per month; critical supersedes warning.
      const alertState = (meta.data_alert ?? {}) as { month?: string; level?: AlertLevel };
      const alreadySent = alertState.month === month ? alertState.level : undefined;
      if (alreadySent === "critical" || alreadySent === level) {
        result.skipped++;
        continue;
      }

      const topupOptions = getTopUpsForPlan(false)
        .filter((t) => t.id.startsWith("data-"))
        .map((t) => ({ name: t.name, priceCents: t.priceCents }));

      const sent = await sendEmail({
        to: customer.email,
        subject:
          level === "critical"
            ? "Your BitLink data is almost out — top up or it pauses until reset"
            : `Heads up — you've used ${Math.round(pct * 100)}% of this month's data`,
        html: buildDataUsageAlertEmail({
          fullName: customer.full_name ?? customer.email,
          level,
          usedLabel: formatGb(usedBytes),
          allowanceLabel: formatGb(dataBucket.initialValue),
          percentUsed: Math.min(100, Math.round(pct * 100)),
          resetDate: usage.monthEnd,
          topupOptions,
          portalUrl: "https://bitlink.co.il/account/lines",
        }),
      });

      if (sent) {
        const fresh = await admin.from("telecom_lines").select("metadata").eq("id", line.id).maybeSingle();
        await admin
          .from("telecom_lines")
          .update({
            metadata: {
              ...((fresh.data?.metadata ?? {}) as object),
              data_alert: { month, level },
            } as never,
            updated_at: new Date().toISOString(),
          })
          .eq("id", line.id);
        result.sent++;
        log.info({ lineId: line.id, level, pct: Math.round(pct * 100) }, "Data usage alert sent");
      } else {
        result.errors++;
      }
    } catch (err) {
      result.errors++;
      log.error(
        { lineId: line.id, error: err instanceof Error ? err.message : String(err) },
        "Data usage alert check failed for line",
      );
    }
  }

  return result;
}
