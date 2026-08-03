// Free trial offer for students/olim: signup with a card on file (no charge),
// a real Basic eSIM line + free 10GB topup, one month to decide on a real
// plan (charged off-session on the saved card), auto-freeze if they don't.
//
// Kill switch: src/lib/settings.ts isTrialOfferEnabled() gates new signups
// and all on-page promo copy. Existing trial lines are unaffected by the
// switch — they run their course either way.

import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createProvisioningJob } from "@/lib/provisioning/orchestrator";
import { getAnnatelPlanName } from "@/lib/plans";
import { grantTopup } from "@/lib/topups/grant-topup";
import { getTelecomProvider } from "@/lib/telecom/provider.registry";
import { sendEmail } from "@/lib/email/send";
import { buildTrialDecisionReminderEmail } from "@/lib/email/templates";
import { absoluteUrl } from "@/lib/utils";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "trial-offer" });

export const TRIAL_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 1 month
export const TRIAL_REMINDER_BEFORE_MS = 9 * 24 * 60 * 60 * 1000; // ~day 21
export const TRIAL_TOPUP_ID = "data-10gb";

function buildToken(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

// Called from the Stripe webhook once the setup-mode session completes (card
// saved, not charged). Creates the trial_lines row + kicks off provisioning
// of a real Annatel Basic eSIM line via the same durable pipeline every other
// line uses (provisioning_jobs → Inngest → orchestrator).
export async function startTrial(
  admin: SupabaseClient,
  params: { customerRecordId: string; customerEmail: string; stripeCustomerId: string },
): Promise<{ trialId: string; token: string; lineId: string; jobId: string }> {
  const correlationId = crypto.randomUUID();
  const externalId = `trial_${correlationId}`;

  const { data: newLine, error: lineError } = await admin
    .from("telecom_lines")
    .insert({
      external_id: externalId,
      customer_id: params.customerRecordId,
      status: "draft",
      is_kosher: false,
      metadata: {
        source: "trial_offer",
        plan_slug: "basic",
        is_esim: true,
        is_trial: true,
        correlation_id: correlationId,
      },
    })
    .select("id")
    .single();

  if (lineError || !newLine) {
    throw new Error(`Failed to create trial telecom line: ${lineError?.message}`);
  }

  const identityNumber = process.env.PORT_IN_DEFAULT_ID?.trim() ?? "341280188";

  const job = await createProvisioningJob({
    lineId: newLine.id as string,
    type: "create_line",
    payload: {
      externalId,
      planName: getAnnatelPlanName("basic"),
      isKosher: false,
      email: params.customerEmail,
      identityNumber,
      language: "he_IL",
      metadata: {
        source: "trial_offer",
        is_esim: true,
        correlation_id: correlationId,
      },
    },
    idempotencyKey: `trial_create_line:${correlationId}`,
  });

  const token = buildToken();
  const now = Date.now();

  const { data: trial, error: trialError } = await admin
    .from("trial_lines")
    .insert({
      token,
      telecom_line_id: newLine.id,
      customer_id: params.customerRecordId,
      stripe_customer_id: params.stripeCustomerId,
      status: "pending_provision",
      started_at: new Date(now).toISOString(),
      decision_due_at: new Date(now + TRIAL_DURATION_MS).toISOString(),
    })
    .select("id")
    .single();

  if (trialError || !trial) {
    throw new Error(`Failed to create trial_lines row: ${trialError?.message}`);
  }

  log.info({ lineId: newLine.id, jobId: job.id, token }, "Trial started — line provisioning queued");

  return { trialId: trial.id as string, token, lineId: newLine.id as string, jobId: job.id };
}

// Called once the trial's telecom line goes ACTIVE (see the
// provisioning/line.completed listener) — grants the free 10GB bonus and
// flips the trial row from pending_provision to active.
export async function activateTrialTopup(admin: SupabaseClient, telecomLineId: string): Promise<void> {
  const { data: trial } = await admin
    .from("trial_lines")
    .select("id, status")
    .eq("telecom_line_id", telecomLineId)
    .eq("status", "pending_provision")
    .maybeSingle();

  if (!trial) return; // not a trial line, or already handled

  const result = await grantTopup({
    admin,
    lineId: telecomLineId,
    topupId: TRIAL_TOPUP_ID,
    frequency: "once",
    billingMode: "free",
    source: "admin",
  });

  if (result.error) {
    log.error({ telecomLineId, error: result.error }, "Failed to grant trial topup");
  }

  await admin.from("trial_lines").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", trial.id);
}

// Freezes a trial line whose decision window has passed with no plan chosen.
// No Stripe subscription exists yet for a trial — just an Annatel freeze and
// a status flip, no billing swap needed.
export async function freezeExpiredTrial(
  admin: SupabaseClient,
  trial: { id: string; telecom_line_id: string },
): Promise<void> {
  const { data: line } = await admin
    .from("telecom_lines")
    .select("provider_line_id, metadata")
    .eq("id", trial.telecom_line_id)
    .maybeSingle();

  if (line?.provider_line_id) {
    const provider = getTelecomProvider();
    await provider.suspendLine(line.provider_line_id, "freeze").catch((err) => {
      log.error({ trialId: trial.id, error: err instanceof Error ? err.message : String(err) }, "Failed to freeze expired trial line");
    });
  }

  const now = new Date().toISOString();
  await admin
    .from("telecom_lines")
    .update({
      status: "paused",
      metadata: { ...((line?.metadata as Record<string, unknown>) ?? {}), trial_expired_at: now },
      updated_at: now,
    })
    .eq("id", trial.telecom_line_id);

  await admin.from("trial_lines").update({ status: "frozen", updated_at: now }).eq("id", trial.id);
}

// Daily sweep: sends the ~day-21 "pick your plan" reminder once per trial,
// and freezes any trial whose decision window has fully expired with no
// plan chosen. Independent of the kill switch — a trial already running
// finishes its own lifecycle regardless of whether new signups are open.
export async function processTrialLifecycle(admin: SupabaseClient): Promise<{
  reminded: number;
  expired: number;
}> {
  const now = new Date();

  const { data: dueForReminder } = await admin
    .from("trial_lines")
    .select("id, token, customer_id, decision_due_at")
    .eq("status", "active")
    .is("reminder_sent_at", null)
    .lte("decision_due_at", new Date(now.getTime() + TRIAL_REMINDER_BEFORE_MS).toISOString());

  let reminded = 0;
  for (const trial of dueForReminder ?? []) {
    const { data: customer } = await admin
      .from("customers")
      .select("full_name, email")
      .eq("id", trial.customer_id)
      .maybeSingle();
    if (!customer?.email) continue;

    const sent = await sendEmail({
      to: customer.email as string,
      subject: "Pick your BitLink plan — your trial wraps up soon",
      html: buildTrialDecisionReminderEmail({
        fullName: (customer.full_name as string | null) ?? "",
        decideUrl: absoluteUrl(`/trial/${trial.token}`),
      }),
    });

    if (sent) {
      reminded += 1;
      await admin.from("trial_lines").update({ reminder_sent_at: new Date().toISOString() }).eq("id", trial.id);
    }
  }

  const { data: dueForExpiry } = await admin
    .from("trial_lines")
    .select("id, telecom_line_id")
    .eq("status", "active")
    .lte("decision_due_at", now.toISOString());

  let expired = 0;
  for (const trial of dueForExpiry ?? []) {
    if (!trial.telecom_line_id) continue;
    await freezeExpiredTrial(admin, { id: trial.id as string, telecom_line_id: trial.telecom_line_id as string });
    expired += 1;
  }

  log.info({ reminded, expired }, "Trial lifecycle sweep complete");
  return { reminded, expired };
}
