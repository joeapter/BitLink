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
import { getAnnatelPlanName, getPlan, type PlanSlug } from "@/lib/plans";
import { grantTopup } from "@/lib/topups/grant-topup";
import { changeLinePlan } from "@/lib/line-plan-change";
import { getTelecomProvider } from "@/lib/telecom/provider.registry";
import { getStripe } from "@/lib/stripe/server";
import { createSubscriber, updateSubscriber } from "@/lib/db/subscribers";
import { sendEmail } from "@/lib/email/send";
import {
  buildTrialDecisionReminderEmail,
  buildTrialFinalWarningEmail,
  buildTrialAutoContinuedEmail,
  buildTrialChargeFailedEmail,
  buildTrialLineFrozenEmail,
  buildTrialTerminationWarningEmail,
  buildTrialTerminatedEmail,
} from "@/lib/email/templates";
import { absoluteUrl } from "@/lib/utils";
import { notifyRepOfConversion } from "@/lib/admin/notify-rep";
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
// Every trial line is provisioned on this plan at the carrier. Converting to
// anything else therefore needs the carrier told as well as Stripe — see
// convertTrialToPlan.
export const TRIAL_PROVISIONED_PLAN: PlanSlug = "basic";

// ── The charge-retry ladder ──────────────────────────────────────────────────
//
// A declined auto-continue charge used to be terminal: status went 'frozen',
// nothing retried, nothing was emailed. Both trials that hit it in Aug 2026
// were simply declined cards — neither customer had said no.
//
// The ladder, all of it driven by the daily sweep:
//   day 0    charge declines. The line KEEPS RUNNING. Email says so, and names
//            the date it stops.
//   every 2d retry the card. A success at any point converts them and lifts
//            any suspension already applied.
//   day 15   suspend the line, and say it has happened.
//   day 30   one warning naming the termination date.
//   day 33   terminate at the carrier, releasing the DID.
//
// The 15 days of continued service are deliberate. Nearly every decline is an
// expired card or a short balance, and cutting service off on the same day we
// first fail to collect punishes a customer who has done nothing wrong for a
// problem they usually fix within the week.
//
// All timing is measured from charge_failed_at — the FIRST decline — never
// from the last retry. Anchoring to the last attempt makes the dates we promise
// in these emails drift every time a retry runs.
export const TRIAL_RETRY_INTERVAL_DAYS = 2;
export const TRIAL_FREEZE_AFTER_DAYS = 15;
export const TRIAL_RETRY_WINDOW_DAYS = 30;
export const TRIAL_TERMINATION_WARNING_DAYS = 3;

const DAY_MS = 86_400_000;

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / DAY_MS;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

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
      planName: getAnnatelPlanName(TRIAL_PROVISIONED_PLAN),
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

// Suspends the carrier line and marks it paused locally. The number is held,
// not released — 'freeze' at Annatel keeps the line, the DID and the SIM, so
// reactivateLine restores service without a reprovision.
//
// Says nothing about trial_lines: a suspension happens at several different
// points on the ladder and the row's status means something different at each.
async function suspendTrialLine(
  admin: SupabaseClient,
  telecomLineId: string,
): Promise<{ ok: boolean }> {
  const { data: line } = await admin
    .from("telecom_lines")
    .select("provider_line_id, metadata, status")
    .eq("id", telecomLineId)
    .maybeSingle();

  if (line?.status === "terminated") return { ok: false };

  // Already paused by the customer (pause-actions.ts stamps paused_at). The
  // line is down, so there is nothing to suspend — and claiming it as ours
  // would hand the ladder the right to lift their pause on the next recovery.
  if ((line?.metadata as Record<string, unknown> | null)?.paused_at) {
    log.info({ telecomLineId }, "Trial line already paused by the customer — leaving the carrier alone");
    return { ok: false };
  }

  if (line?.provider_line_id) {
    try {
      await getTelecomProvider().suspendLine(line.provider_line_id as string, "freeze");
    } catch (err) {
      log.error(
        { telecomLineId, error: err instanceof Error ? err.message : String(err) },
        "Failed to suspend trial line",
      );
      return { ok: false };
    }
  }

  const now = new Date().toISOString();
  await admin
    .from("telecom_lines")
    .update({
      status: "paused",
      metadata: { ...((line?.metadata as Record<string, unknown>) ?? {}), trial_ended_at: now },
      updated_at: now,
    })
    .eq("id", telecomLineId);

  return { ok: true };
}

/**
 * Customer explicitly opted out before the deadline.
 *
 * This TERMINATES rather than freezes, which is the difference between an
 * opt-out and a declined card: someone who has told us they don't want the
 * line is not coming back in two days, so holding their DID only starves the
 * number bank. Israeli inventory is two blocks of 100 (see KOSHER_DID_PREFIXES
 * in the Annatel provider), and three opt-outs were sitting on live numbers
 * before this changed.
 *
 * Terminating at the carrier is what returns the DID to the tenant pool, so a
 * freeze here would keep the number checked out indefinitely.
 */
export async function cancelTrial(
  admin: SupabaseClient,
  trial: { id: string; telecom_line_id: string },
): Promise<void> {
  const outcome = await terminateTrialLine(admin, trial, "cancelled");
  if (!outcome.ok) {
    // Couldn't reach the carrier. Suspend instead so the customer at least
    // stops being able to use a line they've cancelled, and leave the row
    // terminal — the number is reclaimed by the next admin sweep.
    log.error({ trialId: trial.id }, "Opt-out termination failed — falling back to suspension");
    await suspendTrialLine(admin, trial.telecom_line_id);
    const now = new Date().toISOString();
    await admin.from("trial_lines").update({ status: "cancelled", updated_at: now }).eq("id", trial.id);
  }
}

/**
 * Lift the freeze applied at the first decline, after a retry finally collects.
 *
 * Without this a customer who pays on retry 8 gets a working subscription and a
 * dead line — the exact shape of bug that made the manual terminate button
 * leave people paying for nothing. Deliberately tolerant: the money is already
 * in, so a carrier failure here is logged for a human rather than thrown, which
 * would roll the conversion back and re-charge them on the next sweep.
 */
async function reactivateTrialLine(
  admin: SupabaseClient,
  telecomLineId: string,
  frozenByLadder: boolean,
): Promise<void> {
  // Only lift a suspension this ladder applied. 'paused' is not enough to go
  // on: the customer-facing Pause feature sets exactly the same status, and a
  // customer paying $10/month to hold their number would otherwise have that
  // pause silently undone the moment a retry collected. Same narrowing, and
  // the same reason, as dunning.ts keying its reactivation on
  // dunning_suspended_at.
  if (!frozenByLadder) return;

  const { data: line } = await admin
    .from("telecom_lines")
    .select("provider_line_id, status, metadata")
    .eq("id", telecomLineId)
    .maybeSingle();

  // Belt and braces: paused_at is stamped by pause-actions.ts and by nothing
  // else, so its presence means the customer chose this.
  if ((line?.metadata as Record<string, unknown> | null)?.paused_at) {
    log.warn({ telecomLineId }, "Trial retry collected on a customer-paused line — leaving the pause alone");
    return;
  }

  // Most recoveries now happen in the first 15 days, while the line is still
  // running, and reactivating a line that was never suspended errors.
  if (!line?.provider_line_id || line.status !== "paused") return;

  try {
    await getTelecomProvider().reactivateLine(line.provider_line_id as string);
    await admin
      .from("telecom_lines")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", telecomLineId);
  } catch (err) {
    log.error(
      { telecomLineId, error: err instanceof Error ? err.message : String(err) },
      "Paid on retry but the line did not come back — needs manual reactivation",
    );
  }
}

/**
 * Cancel at the carrier — which is what releases the DID back to the tenant
 * number bank — and stop any billing attached to the line.
 *
 * Reached two ways: the customer opts out (finalStatus 'cancelled'), or the
 * retry ladder runs out (finalStatus 'terminated'). The carrier work is
 * identical; only what the row says afterwards differs, and that distinction is
 * worth keeping because "changed their mind" and "card never worked" are
 * different businesses.
 *
 * The subscription lookup is defensive. A trial reaching here should have no
 * subscriber row at all — the charge that would have created one is precisely
 * what failed — but terminating a line while leaving a live subscription behind
 * is the bug this whole change exists to kill, so it is checked anyway.
 */
async function terminateTrialLine(
  admin: SupabaseClient,
  trial: { id: string; telecom_line_id: string },
  finalStatus: "terminated" | "cancelled" = "terminated",
): Promise<{ ok: boolean; error?: string }> {
  const { data: line } = await admin
    .from("telecom_lines")
    .select("provider_line_id, status")
    .eq("id", trial.telecom_line_id)
    .maybeSingle();

  if (line?.provider_line_id && line.status !== "terminated") {
    try {
      await getTelecomProvider().terminateLine(line.provider_line_id as string);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ trialId: trial.id, error: message }, "Carrier termination failed — will retry next sweep");
      return { ok: false, error: message };
    }
  }

  const now = new Date().toISOString();
  await admin
    .from("telecom_lines")
    .update({ status: "terminated", updated_at: now })
    .eq("id", trial.telecom_line_id);

  const stripe = getStripe();
  const { data: subs } = await admin
    .from("subscribers")
    .select("id, stripe_subscription_id, status")
    .eq("telecom_line_id", trial.telecom_line_id);

  for (const sub of subs ?? []) {
    if (stripe && sub.stripe_subscription_id && sub.status !== "cancelled") {
      try {
        await stripe.subscriptions.cancel(sub.stripe_subscription_id as string);
      } catch (err) {
        log.error(
          { trialId: trial.id, subscriptionId: sub.stripe_subscription_id, error: err instanceof Error ? err.message : String(err) },
          "Could not cancel subscription while terminating trial line",
        );
      }
    }
    await admin
      .from("subscribers")
      .update({ status: "cancelled", cancelled_at: now, updated_at: now })
      .eq("id", sub.id as string);
  }

  await admin
    .from("trial_lines")
    .update({ status: finalStatus, terminated_at: now, updated_at: now })
    .eq("id", trial.id);

  return { ok: true };
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

  // No activation fee on this path, on any plan. Two reasons, either of which
  // is sufficient:
  //
  // 1. It cannot work. The fee is a one-time price, and Stripe rejects
  //    one-time prices as subscription items ("this field only accepts prices
  //    with type=recurring"). Adding it threw, the caller caught it, and
  //    processTrialLifecycle froze the line instead of converting it — so
  //    every trial defaulting to Basic (or converting to either Kosher plan)
  //    silently lost service at its deadline and was never charged. Only
  //    Student 5G and Max 5G survived, because they skip the fee anyway.
  // 2. There is nothing to charge for. A trial line is already provisioned
  //    and activated; the fee covers work that happened a month earlier and
  //    was not billed then.
  //
  // Charging it here would mean a separate one-time invoice after the
  // subscription exists (the pattern used for the intl port fee), not a
  // subscription item. Note that buildTrialFinalWarningEmail quotes the plan
  // price alone — that copy is correct only while this stays fee-free.
  // ── Move the carrier plan FIRST, before any money changes hands ──────
  //
  // The trial line is provisioned on Basic (TRIAL_PROVISIONED_PLAN), and until
  // now nothing here ever told Annatel otherwise: a customer who picked Max on
  // the trial decision page was billed $39.99, shown a 200GB meter, and left on
  // a 1GB Basic line that would cut out almost immediately. It never surfaced
  // only because every conversion so far happened to choose Basic, where the
  // hardcoded plan was accidentally correct — and the decision page now
  // pre-selects Student, so the default choice was wrong.
  //
  // Ordered before the charge deliberately. A carrier failure aborts the whole
  // conversion with nothing taken, leaving the trial intact for the customer or
  // the retry ladder to try again — the opposite of charging someone for a plan
  // their line does not have. carrier_only because the Stripe subscription is
  // created by this function, a few lines below.
  //
  // Skipped when the target IS the provisioned plan, so the well-trodden
  // auto-continue-on-Basic path keeps behaving exactly as before.
  if (planSlug !== TRIAL_PROVISIONED_PLAN) {
    const carrier = await changeLinePlan({
      admin,
      lineId: trial.telecom_line_id,
      newPlanSlug: planSlug,
      billingMode: "carrier_only",
    });
    if (carrier.error) {
      log.error(
        { trialId: trial.id, planSlug, error: carrier.error },
        "Carrier plan change failed — trial NOT converted and nothing was charged",
      );
      return { success: false, error: `Could not move the line onto ${planSlug}: ${carrier.error}` };
    }
    log.info({ trialId: trial.id, planSlug }, "Carrier plan moved ahead of trial conversion charge");
  }

  const items: { price: string }[] = [{ price: planRow.stripe_price_id as string }];

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

  // Tell the BitLink Rep who sent this customer, if there is one. Best-effort:
  // awaited so it survives a serverless invocation ending, but never throws.
  await notifyRepOfConversion(admin, { customerId: trial.customer_id, planSlug });

  log.info({ trialId: trial.id, planSlug, subscriptionId: subscription.id }, "Trial converted to paid plan");
  return { success: true };
}

// Daily sweep:
//   1. ~day-21 "pick your plan" reminder (soft, once per trial).
//   2. ~2-days-before "you'll be charged" final warning (once per trial) —
//      the actual disclosure that makes the auto-continue default fair.
//   3. Past-deadline trials: auto-continue on Basic (real off-session
//      charge) by default. A decline freezes the line and starts the retry
//      ladder rather than ending the trial.
//   4. The retry ladder itself: re-try the card every TRIAL_RETRY_INTERVAL_DAYS,
//      warn once at TRIAL_RETRY_WINDOW_DAYS, terminate
//      TRIAL_TERMINATION_WARNING_DAYS after that warning.
// Independent of the kill switch — a trial already running finishes its own
// lifecycle regardless of whether new signups are open.
export interface TrialLifecycleResult {
  reminded: number;
  finalWarned: number;
  autoContinued: number;
  /** Declines at the deadline — each one now enters the retry ladder. */
  autoContinueFailed: number;
  /** Deadlines reached on an already-terminated line; closed without charging. */
  strandedClosed: number;
  retried: number;
  recovered: number;
  /** Lines suspended at the end of the TRIAL_FREEZE_AFTER_DAYS grace period. */
  frozen: number;
  terminationWarned: number;
  terminated: number;
}

export async function processTrialLifecycle(admin: SupabaseClient): Promise<TrialLifecycleResult> {
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

  const priceLabel = `$${(plan.priceCents / 100).toFixed(2)}`;

  let autoContinued = 0;
  let autoContinueFailed = 0;
  let strandedClosed = 0;
  for (const trial of dueForExpiry ?? []) {
    if (!trial.telecom_line_id) continue;
    const trialRef = {
      id: trial.id as string,
      telecom_line_id: trial.telecom_line_id as string,
      customer_id: trial.customer_id as string,
      stripe_customer_id: trial.stripe_customer_id as string,
    };

    // Never start billing a line that no longer exists. A line can be
    // terminated out from under a running trial — carrier-side, or by an admin
    // — and charging at the deadline anyway is how a customer ends up paying
    // for a dead number (Sept 2026: one refund, one near miss). There is
    // nothing to sell here, so close the trial quietly and do not charge.
    const { data: expiringLine } = await admin
      .from("telecom_lines")
      .select("status")
      .eq("id", trialRef.telecom_line_id)
      .maybeSingle();

    if (expiringLine?.status === "terminated") {
      log.warn({ trialId: trial.id }, "Trial reached its deadline on a terminated line — closing without charging");
      await admin
        .from("trial_lines")
        .update({ status: "terminated", terminated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", trial.id);
      strandedClosed += 1;
      continue;
    }

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
          html: buildTrialAutoContinuedEmail({ fullName: (customer.full_name as string | null) ?? "", planName: plan.name, priceLabel }),
        }).catch(() => {});
      }
    } else {
      // Onto the retry ladder rather than straight into a grave. The line is
      // deliberately left running — see TRIAL_FREEZE_AFTER_DAYS — so nothing
      // here touches the carrier.
      log.warn({ trialId: trial.id, error: result.error }, "Auto-continue charge declined — entering retry ladder");

      const failedAt = new Date().toISOString();
      await admin
        .from("trial_lines")
        .update({ status: "past_due", charge_failed_at: failedAt, last_retry_at: failedAt, retry_count: 1, updated_at: failedAt })
        .eq("id", trial.id);

      const { data: customer } = await admin
        .from("customers")
        .select("full_name, email")
        .eq("id", trial.customer_id)
        .maybeSingle();
      if (customer?.email) {
        sendEmail({
          to: customer.email as string,
          subject: "We couldn't charge your card",
          html: buildTrialChargeFailedEmail({
            fullName: (customer.full_name as string | null) ?? "",
            planName: plan.name,
            priceLabel,
            updateCardUrl: absoluteUrl("/account/billing"),
            retryDays: TRIAL_RETRY_INTERVAL_DAYS,
            freezeDateLabel: formatDate(new Date(Date.now() + TRIAL_FREEZE_AFTER_DAYS * DAY_MS)),
          }),
        }).catch(() => {});
      }
      autoContinueFailed += 1;
    }
  }

  // ── The retry ladder ────────────────────────────────────────────────────
  // Everything already on it: retry the card, warn once the month is up, and
  // terminate three days after that warning.
  const { data: pastDue } = await admin
    .from("trial_lines")
    .select("id, token, telecom_line_id, customer_id, stripe_customer_id, charge_failed_at, last_retry_at, retry_count, frozen_at, termination_warned_at")
    .eq("status", "past_due")
    .order("charge_failed_at", { ascending: true });

  let retried = 0;
  let recovered = 0;
  let frozen = 0;
  let terminationWarned = 0;
  let terminated = 0;

  for (const trial of pastDue ?? []) {
    if (!trial.telecom_line_id || !trial.charge_failed_at) continue;

    const trialRef = {
      id: trial.id as string,
      telecom_line_id: trial.telecom_line_id as string,
      customer_id: trial.customer_id as string,
      stripe_customer_id: trial.stripe_customer_id as string,
    };

    const { data: customer } = await admin
      .from("customers")
      .select("full_name, email")
      .eq("id", trial.customer_id)
      .maybeSingle();
    const fullName = (customer?.full_name as string | null) ?? "";
    const email = customer?.email as string | undefined;

    const age = daysSince(trial.charge_failed_at as string);
    const warnedAt = trial.termination_warned_at as string | null;
    const frozenAt = trial.frozen_at as string | null;

    // ── Rung 4: terminate ──────────────────────────────────────────────
    // Gated on the warning having actually been sent, not on the day count
    // alone. A backfilled charge_failed_at could otherwise close a line whose
    // owner was never told it was at risk.
    if (warnedAt && daysSince(warnedAt) >= TRIAL_TERMINATION_WARNING_DAYS) {
      const outcome = await terminateTrialLine(admin, trialRef);
      if (!outcome.ok) continue;

      if (email) {
        sendEmail({
          to: email,
          subject: "Your BitLink line has been closed",
          html: buildTrialTerminatedEmail({ fullName }),
        }).catch(() => {});
      }
      log.warn({ trialId: trial.id, days: Math.floor(age) }, "Trial line terminated — retry ladder exhausted");
      terminated += 1;
      continue;
    }

    // ── Rung 3: the one warning ────────────────────────────────────────
    if (!warnedAt && age >= TRIAL_RETRY_WINDOW_DAYS) {
      if (!email) continue;
      const terminationDate = new Date(Date.now() + TRIAL_TERMINATION_WARNING_DAYS * DAY_MS);
      const sent = await sendEmail({
        to: email,
        subject: "Last chance to keep your BitLink number",
        html: buildTrialTerminationWarningEmail({
          fullName,
          terminationDateLabel: formatDate(terminationDate),
          updateCardUrl: absoluteUrl("/account/billing"),
        }),
      });
      if (sent) {
        await admin
          .from("trial_lines")
          .update({ termination_warned_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("id", trial.id);
        terminationWarned += 1;
      }
      continue;
    }

    // ── Rung 2: the grace period is up, suspend the line ───────────────
    // Only after this point does past_due mean "not working". Retrying is not
    // skipped on the same sweep — the suspension and the charge attempt are
    // independent, and there is no reason to give up a collection opportunity
    // just because this is the day the line goes down.
    if (!frozenAt && age >= TRIAL_FREEZE_AFTER_DAYS) {
      const suspended = await suspendTrialLine(admin, trialRef.telecom_line_id);
      if (suspended.ok) {
        await admin
          .from("trial_lines")
          .update({ frozen_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("id", trial.id);
        if (email) {
          sendEmail({
            to: email,
            subject: "Your BitLink line has been paused",
            html: buildTrialLineFrozenEmail({
              fullName,
              updateCardUrl: absoluteUrl("/account/billing"),
              graceDays: TRIAL_FREEZE_AFTER_DAYS,
            }),
          }).catch(() => {});
        }
        log.warn({ trialId: trial.id, days: Math.floor(age) }, "Trial line suspended — grace period elapsed");
        frozen += 1;
      }
    }

    // ── Rung 1: try the card again ─────────────────────────────────────
    const lastRetry = (trial.last_retry_at as string | null) ?? (trial.charge_failed_at as string);
    if (daysSince(lastRetry) < TRIAL_RETRY_INTERVAL_DAYS) continue;

    const attemptAt = new Date().toISOString();
    const result = await convertTrialToPlan(admin, trialRef, TRIAL_AUTO_CONTINUE_PLAN);
    retried += 1;

    if (result.success) {
      // convertTrialToPlan has already flipped the trial to 'converted' and
      // created the subscriber; all that is left is switching the line back on,
      // and only if this ladder is what took it down.
      await reactivateTrialLine(admin, trialRef.telecom_line_id, Boolean(frozenAt));
      if (email) {
        sendEmail({
          to: email,
          subject: "Your BitLink line is back on",
          html: buildTrialAutoContinuedEmail({ fullName, planName: plan.name, priceLabel }),
        }).catch(() => {});
      }
      log.info({ trialId: trial.id, attempts: (trial.retry_count as number) + 1 }, "Trial charge recovered on retry");
      recovered += 1;
      continue;
    }

    await admin
      .from("trial_lines")
      .update({
        last_retry_at: attemptAt,
        retry_count: ((trial.retry_count as number) ?? 0) + 1,
        updated_at: attemptAt,
      })
      .eq("id", trial.id);
  }

  const summary = {
    reminded,
    finalWarned,
    autoContinued,
    autoContinueFailed,
    strandedClosed,
    retried,
    recovered,
    frozen,
    terminationWarned,
    terminated,
  };
  log.info(summary, "Trial lifecycle sweep complete");
  return summary;
}
