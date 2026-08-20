// Emails a BitLink Rep when a trial they sent converts to a paying customer.
//
// Best-effort by design: a failure here must never break the conversion or the
// charge that goes with it. Every path returns quietly.

import type { SupabaseClient } from "@supabase/supabase-js";
import { getPlan, type PlanSlug } from "@/lib/plans";
import { sendEmail } from "@/lib/email/send";
import { buildRepConversionEmail } from "@/lib/email/templates";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "notify-rep" });

/** Plans paying the higher rate — matches lib/admin/rep-earnings.ts. */
const PREMIUM_PLANS: ReadonlySet<string> = new Set<PlanSlug>(["student-5g", "max-5g"]);

/** Trials that are live but haven't earned anything yet. */
const LIVE_TRIAL_STATUSES = ["pending_provision", "active"];

function payoutFor(planSlug: string | null, basicCents: number, premiumCents: number): number {
  return planSlug && PREMIUM_PLANS.has(planSlug) ? premiumCents : basicCents;
}

export async function notifyRepOfConversion(
  db: SupabaseClient,
  params: { customerId: string; planSlug: string },
): Promise<void> {
  try {
    const { data: customer } = await db
      .from("customers")
      .select("full_name, referred_by")
      .eq("id", params.customerId)
      .maybeSingle();

    const code = (customer?.referred_by as string | null)?.trim();
    if (!code) return; // not referred by anyone

    const { data: rep } = await db
      .from("affiliates")
      .select("id, name, code, email, status, rate_basic_cents, rate_premium_cents")
      .eq("code", code)
      .maybeSingle();

    // Code might belong to a driver card or an old campaign, not a Rep.
    if (!rep || rep.status !== "active") return;
    const to = (rep.email as string | null)?.trim();
    if (!to) return; // tracked and earning, just no address to notify

    const basicCents = Number(rep.rate_basic_cents ?? 500);
    const premiumCents = Number(rep.rate_premium_cents ?? 1000);

    // Everyone who came through this Rep's code.
    const { data: theirCustomers } = await db
      .from("customers")
      .select("id")
      .eq("referred_by", code);
    const ids = (theirCustomers ?? []).map((c) => c.id as string);
    if (!ids.length) return;

    const { data: trials } = await db
      .from("trial_lines")
      .select("telecom_line_id, status, decided_at")
      .in("customer_id", ids);

    const liveTrials = (trials ?? []).filter((t) =>
      LIVE_TRIAL_STATUSES.includes(String(t.status)),
    ).length;

    // Conversions inside the current calendar month.
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const convertedThisMonth = (trials ?? []).filter(
      (t) => String(t.status) === "converted" && (t.decided_at as string | null) && (t.decided_at as string) >= monthStart,
    );

    // Price each of this month's conversions off the plan its line landed on.
    const lineIds = convertedThisMonth.map((t) => t.telecom_line_id as string).filter(Boolean);
    const { data: lines } = lineIds.length
      ? await db.from("telecom_lines").select("id, metadata").in("id", lineIds)
      : { data: [] };
    const planByLine = new Map<string, string | null>();
    for (const l of lines ?? []) {
      const metadata = (l.metadata ?? {}) as Record<string, unknown>;
      planByLine.set(l.id as string, (metadata.plan_slug as string | undefined) ?? null);
    }

    const monthEarnedCents = convertedThisMonth.reduce(
      (sum, t) => sum + payoutFor(planByLine.get(t.telecom_line_id as string) ?? null, basicCents, premiumCents),
      0,
    );

    await sendEmail({
      to,
      subject: `You earned a commission — ${getPlan(params.planSlug as PlanSlug).name} conversion`,
      html: buildRepConversionEmail({
        repName: rep.name as string,
        customerName: (customer?.full_name as string | null) ?? "A new customer",
        planName: getPlan(params.planSlug as PlanSlug).name,
        payoutCents: payoutFor(params.planSlug, basicCents, premiumCents),
        liveTrials,
        monthConversions: convertedThisMonth.length,
        monthEarnedCents,
        monthLabel: now.toLocaleString("en-US", { month: "long", timeZone: "UTC" }),
      }),
    });

    log.info({ repCode: code, planSlug: params.planSlug }, "Rep notified of conversion");
  } catch (err) {
    log.error(
      { customerId: params.customerId, error: err instanceof Error ? err.message : String(err) },
      "Failed to notify Rep of conversion — continuing",
    );
  }
}
