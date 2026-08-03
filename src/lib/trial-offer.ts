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
import { getAnnatelPlanName, getPlan, isActivationFeeWaivedForPlan, type PlanSlug } from "@/lib/plans";
import { grantTopup } from "@/lib/topups/grant-topup";
import { getTelecomProvider } from "@/lib/telecom/provider.registry";
import { getStripe } from "@/lib/stripe/server";
import { createSubscriber, updateSubscriber } from "@/lib/db/subscribers";
import { sendEmail } from "@/lib/email/send";
import {
  buildTrialDecisionReminderEmail,
  buildTrialFinalWarningEmail,
  buildTrialAutoContinuedEmail,
} from "@/lib/email/templates";
import { absoluteUrl } from "@/lib/utils";
import { logger } from "@/lib/logger";

// Auto-continue plan when a trial reaches its decision deadline with no
// choice made. No topup — just the plain plan, same as any other signup.
export const TRIAL_AUTO_CONTINUE_PLAN: PlanSlug = "basic";
// How long before the deadline the final "you'll be charged" warning goes
// out — separate from the softer day-~21 "pick your plan" reminder.
const TRIAL_FINAL_WARNING_BEFORE_MS = 2 * 24 * 60 * 60 * 1000;

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

// Freezes a trial's line at Annatel and marks the trial_lines row terminal.
// Used both when an auto-continue charge fails (falls back here rather than
// leaving an unpaid line running) and when a customer explicitly opts out
// before the deadline.
async function freezeTrialLine(
  admin: SupabaseClient,
  trial: { id: string; telecom_line_id: string },
  trialStatus: "frozen" | "cancelled",
): Promise<void> {
  const { data: line } = await admin
    .from("telecom_lines")
    .select("provider_line_id, metadata")
    .eq("id", trial.telecom_line_id)
    .maybeSingle();

  if (line?.provider_line_id) {
    const provider = getTelecomProvider();
    await provider.suspendLine(line.provider_line_id, "freeze").catch((err) => {
      log.error({ trialId: trial.id, error: err instanceof Error ? err.message : String(err) }, "Failed to freeze trial line");
    });
  }

  const now = new Date().toISOString();
  await admin
    .from("telecom_lines")
    .update({
      status: "paused",
      metadata: { ...((line?.metadata as Record<string, unknown>) ?? {}), trial_ended_at: now },
      updated_at: now,
    })
    .eq("id", trial.telecom_line_id);

  await admin.from("trial_lines").update({ status: trialStatus, updated_at: now }).eq("id", trial.id);
}

// Customer explicitly opted out before the deadline — freeze right away
// rather than waiting, and never auto-charge.
export async function cancelTrial(admin: SupabaseClient, trial: { id: string; telecom_line_id: string }): Promise<void> {
  await freezeTrialLine(admin, trial, "cancelled");
}

// Converts a trial (or any pre-subscription line) into a real paid plan:
// creates a real Stripe subscription off-session on the card already on
// file, links it to the line, and marks the trial converted. Shared by the
// customer's manual "pick a plan" decision and the automatic day-30
// continue-on-Basic default — same underlying action either way.
export async function convertTrialToPlan(
  admin: SupabaseClient,
  trial: { id: string; telecom_line_id: string; customer_id: string; stripe_customer_id: string },
  planSlug: PlanSlug,
): Promise<{ success: true } | { success: false; error: string }> {
  const stripe = getStripe();
  if (!stripe) return { success: false, error: "Stripe unavailable" };

  const { data: planRow } = await admin
    .from("plans")
    .select("stripe_price_id")
    .eq("slug", planSlug)
    .eq("active", true)
    .maybeSingle();
  if (!planRow?.stripe_price_id) return { success: false, error: "Plan not available" };

  const skipActivationFee = isActivationFeeWaivedForPlan(planSlug);
  const items: { price: string }[] = [{ price: planRow.stripe_price_id as string }];
  const activationFeePriceId = process.env.STRIPE_PRICE_ACTIVATION_FEE?.trim();
  if (!skipActivationFee && activationFeePriceId) {
    items.push({ price: activationFeePriceId });
  }

  let subscription: Awaited<ReturnType<typeof stripe.subscriptions.create>>;
  try {
    subscription = await stripe.subscriptions.create({
      customer: trial.stripe_customer_id,
      items,
      off_session: true,
      payment_behavior: "error_if_incomplete",
      metadata: {
        plan_slug: planSlug,
        customer_record_id: trial.customer_id,
        source: "bitlink_trial_conversion",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ trialId: trial.id, planSlug, error: message }, "Trial conversion charge failed");
    return { success: false, error: message };
  }

  const plan = getPlan(planSlug);
  const subscriber = await createSubscriber(admin, {
    customerId: trial.customer_id,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: trial.stripe_customer_id,
    planSlug,
    monthlyPriceCents: plan.priceCents,
    status: "active",
  });
  await updateSubscriber(admin, subscriber.id, {
    telecomLineId: trial.telecom_line_id,
    activatedAt: new Date().toISOString(),
  });

  const now = new Date().toISOString();
  const { data: lineRow } = await admin
    .from("telecom_lines")
    .select("metadata")
    .eq("id", trial.telecom_line_id)
    .maybeSingle();
  await admin
    .from("telecom_lines")
    .update({
      external_id: `stripe_sub_${subscription.id}`,
      metadata: { ...((lineRow?.metadata as Record<string, unknown>) ?? {}), plan_slug: planSlug, is_trial: false },
      updated_at: now,
    })
    .eq("id", trial.telecom_line_id);
  await admin.from("trial_lines").update({ status: "converted", decided_at: now, updated_at: now }).eq("id", trial.id);

  log.info({ trialId: trial.id, planSlug, subscriptionId: subscription.id }, "Trial converted to paid plan");
  return { success: true };
}

// Daily sweep:
//   1. ~day-21 "pick your plan" reminder (soft, once per trial).
//   2. ~2-days-before "you'll be charged" final warning (once per trial) —
//      the actual disclosure that makes the auto-continue default fair.
//   3. Past-deadline trials: auto-continue on Basic (real off-session
//      charge) by default; if the charge fails (declined card etc.), fall
//      back to freezing rather than leaving an unpaid line running forever.
// Independent of the kill switch — a trial already running finishes its own
// lifecycle regardless of whether new signups are open.
export async function processTrialLifecycle(admin: SupabaseClient): Promise<{
  reminded: number;
  finalWarned: number;
  autoContinued: number;
  autoContinueFailed: number;
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

  const { data: dueForFinalWarning } = await admin
    .from("trial_lines")
    .select("id, token, customer_id, decision_due_at")
    .eq("status", "active")
    .is("final_warning_sent_at", null)
    .lte("decision_due_at", new Date(now.getTime() + TRIAL_FINAL_WARNING_BEFORE_MS).toISOString());

  let finalWarned = 0;
  const plan = getPlan(TRIAL_AUTO_CONTINUE_PLAN);
  for (const trial of dueForFinalWarning ?? []) {
    const { data: customer } = await admin
      .from("customers")
      .select("full_name, email")
      .eq("id", trial.customer_id)
      .maybeSingle();
    if (!customer?.email) continue;

    const sent = await sendEmail({
      to: customer.email as string,
      subject: `We'll charge your card on ${new Date(trial.decision_due_at as string).toLocaleDateString("en-US", { month: "long", day: "numeric" })} unless you cancel`,
      html: buildTrialFinalWarningEmail({
        fullName: (customer.full_name as string | null) ?? "",
        chargeDate: new Date(trial.decision_due_at as string).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        planName: plan.name,
        priceLabel: `$${(plan.priceCents / 100).toFixed(2)}`,
        decideUrl: absoluteUrl(`/trial/${trial.token}`),
      }),
    });

    if (sent) {
      finalWarned += 1;
      await admin.from("trial_lines").update({ final_warning_sent_at: new Date().toISOString() }).eq("id", trial.id);
    }
  }

  const { data: dueForExpiry } = await admin
    .from("trial_lines")
    .select("id, token, telecom_line_id, customer_id, stripe_customer_id")
    .eq("status", "active")
    .lte("decision_due_at", now.toISOString());

  let autoContinued = 0;
  let autoContinueFailed = 0;
  for (const trial of dueForExpiry ?? []) {
    if (!trial.telecom_line_id) continue;
    const trialRef = {
      id: trial.id as string,
      telecom_line_id: trial.telecom_line_id as string,
      customer_id: trial.customer_id as string,
      stripe_customer_id: trial.stripe_customer_id as string,
    };

    const result = await convertTrialToPlan(admin, trialRef, TRIAL_AUTO_CONTINUE_PLAN);
    if (result.success) {
      autoContinued += 1;
      const { data: customer } = await admin
        .from("customers")
        .select("full_name, email")
        .eq("id", trial.customer_id)
        .maybeSingle();
      if (customer?.email) {
        sendEmail({
          to: customer.email as string,
          subject: "Your BitLink line continued on Basic",
          html: buildTrialAutoContinuedEmail({ fullName: (customer.full_name as string | null) ?? "", planName: plan.name, priceLabel: `$${(plan.priceCents / 100).toFixed(2)}` }),
        }).catch(() => {});
      }
    } else {
      log.warn({ trialId: trial.id, error: result.error }, "Auto-continue charge failed — freezing instead");
      await freezeTrialLine(admin, trialRef, "frozen");
      autoContinueFailed += 1;
    }
  }

  log.info({ reminded, finalWarned, autoContinued, autoContinueFailed }, "Trial lifecycle sweep complete");
  return { reminded, finalWarned, autoContinued, autoContinueFailed };
}
