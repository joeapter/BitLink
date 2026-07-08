"use server";

// Pause My Plan — customer-facing line freeze.
//
// Pause: freeze the line at Annatel (holds number + SIM), then swap the Stripe
// subscription to the $10/mo pause price with proration disabled — the month
// the customer already paid for runs its course, and the pause rate starts at
// the next billing date. If the Stripe swap fails, the freeze is rolled back.
//
// Resume: unfreeze at Annatel, then swap back to the plan price with the
// billing cycle re-anchored to today — service and full-price billing restart
// immediately, on a fresh monthly cycle.
//
// Business rule (copy + ops, not code): a line may stay paused up to 18 months
// without reactivation, after which it may be terminated and the number lost.

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import { getPlan, getStripePriceId } from "@/lib/plans";
import { getTelecomProvider } from "@/lib/telecom/provider.registry";

export type PauseActionState = { error?: string; success?: string } | null;

const SUPPORT_HINT = "Please contact support on WhatsApp and we'll sort it out.";

function getAdmin() {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin client unavailable");
  return admin;
}

async function getOwnedLine(userId: string, lineId: string) {
  const admin = getAdmin();
  const { data: customer } = await admin.from("customers").select("id").eq("user_id", userId).maybeSingle();
  if (!customer) return null;

  const { data: line } = await admin
    .from("telecom_lines")
    .select("id, status, provider_line_id, metadata, customer_id")
    .eq("id", lineId)
    .eq("customer_id", customer.id)
    .maybeSingle();
  if (!line) return null;

  return { customerId: customer.id as string, line };
}

async function getSubscriptionForLine(lineId: string, customerId: string) {
  const admin = getAdmin();

  const { data: subscriber } = await admin
    .from("subscribers")
    .select("id, stripe_subscription_id, stripe_subscription_item_id, plan_slug")
    .eq("telecom_line_id", lineId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (subscriber?.stripe_subscription_id) {
    return {
      subscriberId: subscriber.id as string,
      stripeSubscriptionId: subscriber.stripe_subscription_id as string,
      stripeSubscriptionItemId: (subscriber.stripe_subscription_item_id ?? null) as string | null,
      planSlug: subscriber.plan_slug as string | null,
    };
  }

  const { data: subscription } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id, plan_id")
    .eq("customer_id", customerId)
    .not("stripe_subscription_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (subscription?.stripe_subscription_id) {
    let planSlug: string | null = null;
    if (subscription.plan_id) {
      const { data: planRow } = await admin.from("plans").select("slug").eq("id", subscription.plan_id).maybeSingle();
      planSlug = (planRow?.slug as string | undefined) ?? null;
    }
    return {
      subscriberId: null,
      stripeSubscriptionId: subscription.stripe_subscription_id as string,
      stripeSubscriptionItemId: null,
      planSlug,
    };
  }

  return null;
}

async function resolvePlanPriceId(planSlug: string): Promise<string | null> {
  const admin = getAdmin();
  const { data: planRow } = await admin.from("plans").select("stripe_price_id").eq("slug", planSlug).maybeSingle();
  const dbPriceId = planRow?.stripe_price_id as string | undefined;
  if (dbPriceId) return dbPriceId;
  const envPriceId = getStripePriceId(getPlan(planSlug));
  return envPriceId || null;
}

async function logCustomerAction(userId: string, action: string, lineId: string, metadata: Record<string, unknown>) {
  try {
    const admin = getAdmin();
    await admin.from("audit_logs").insert({
      actor_user_id: userId,
      action,
      entity_type: "telecom_line",
      entity_id: lineId,
      metadata,
    });
  } catch {
    // audit failure is non-fatal
  }
}

export async function pauseLineAction(_prev: PauseActionState, formData: FormData): Promise<PauseActionState> {
  const user = await requireUser();
  const lineId = String(formData.get("lineId") ?? "");
  if (!lineId) return { error: "Missing line reference." };

  const owned = await getOwnedLine(user.id, lineId);
  if (!owned) return { error: "We couldn't find that line on your account." };
  const { customerId, line } = owned;

  if (line.status !== "active") return { error: "Only an active line can be paused." };
  if (!line.provider_line_id) return { error: `This line isn't ready to be paused yet. ${SUPPORT_HINT}` };

  const pausePriceId = process.env.STRIPE_PRICE_PAUSE?.trim();
  const stripe = getStripe();
  if (!pausePriceId || !stripe) return { error: `Pausing isn't available right now. ${SUPPORT_HINT}` };

  const subInfo = await getSubscriptionForLine(lineId, customerId);
  if (!subInfo) return { error: `We couldn't find the subscription for this line. ${SUPPORT_HINT}` };

  const subscription = await stripe.subscriptions.retrieve(subInfo.stripeSubscriptionId);
  if (subscription.status === "canceled") {
    return { error: `This subscription is no longer active. ${SUPPORT_HINT}` };
  }
  const item = subInfo.stripeSubscriptionItemId
    ? subscription.items.data.find((subItem) => subItem.id === subInfo.stripeSubscriptionItemId)
    : subscription.items.data[0];
  if (!item) return { error: `We couldn't read your subscription details. ${SUPPORT_HINT}` };

  const provider = getTelecomProvider();
  await provider.suspendLine(line.provider_line_id, "freeze");

  try {
    await stripe.subscriptionItems.update(item.id, {
      price: pausePriceId,
      proration_behavior: "none",
      metadata: {
        ...item.metadata,
        bitlink_paused: "true",
        bitlink_paused_plan_slug: subInfo.planSlug ?? "",
        bitlink_paused_price_id: item.price.id,
      },
    });
  } catch {
    // Billing swap failed — unfreeze so the customer isn't suspended at full price.
    await provider.reactivateLine(line.provider_line_id).catch(() => {});
    return { error: `We couldn't update your billing, so the line was not paused. ${SUPPORT_HINT}` };
  }

  const admin = getAdmin();
  const pausedAt = new Date().toISOString();
  const metadata = { ...((line.metadata as Record<string, unknown>) ?? {}), paused_at: pausedAt, paused_plan_slug: subInfo.planSlug };
  await admin.from("telecom_lines").update({ status: "paused", metadata, updated_at: pausedAt }).eq("id", lineId);
  const subscriberUpdate = admin.from("subscribers").update({ status: "paused", updated_at: pausedAt });
  if (subInfo.subscriberId) await subscriberUpdate.eq("id", subInfo.subscriberId);
  else await subscriberUpdate.eq("stripe_subscription_id", subInfo.stripeSubscriptionId);
  await logCustomerAction(user.id, "line_paused", lineId, {
    providerLineId: line.provider_line_id,
    stripeSubscriptionId: subInfo.stripeSubscriptionId,
    planSlug: subInfo.planSlug,
  });

  revalidatePath("/account/lines");
  revalidatePath("/account");
  return {
    success:
      "Your line is paused and your number is being held. The $10/month pause rate starts on your next billing date.",
  };
}

export async function resumeLineAction(_prev: PauseActionState, formData: FormData): Promise<PauseActionState> {
  const user = await requireUser();
  const lineId = String(formData.get("lineId") ?? "");
  if (!lineId) return { error: "Missing line reference." };

  const owned = await getOwnedLine(user.id, lineId);
  if (!owned) return { error: "We couldn't find that line on your account." };
  const { customerId, line } = owned;

  if (line.status !== "paused") return { error: "This line isn't paused." };
  if (!line.provider_line_id) return { error: `This line can't be resumed automatically. ${SUPPORT_HINT}` };

  const stripe = getStripe();
  if (!stripe) return { error: `Resuming isn't available right now. ${SUPPORT_HINT}` };

  const subInfo = await getSubscriptionForLine(lineId, customerId);
  if (!subInfo) return { error: `We couldn't find the subscription for this line. ${SUPPORT_HINT}` };

  const lineMeta = (line.metadata as Record<string, unknown>) ?? {};
  const planSlug = (lineMeta.paused_plan_slug as string | undefined) || subInfo.planSlug;
  if (!planSlug) return { error: `We couldn't determine which plan to restore. ${SUPPORT_HINT}` };

  const subscription = await stripe.subscriptions.retrieve(subInfo.stripeSubscriptionId);
  const item = subInfo.stripeSubscriptionItemId
    ? subscription.items.data.find((subItem) => subItem.id === subInfo.stripeSubscriptionItemId)
    : subscription.items.data[0];
  if (!item) return { error: `We couldn't read your subscription details. ${SUPPORT_HINT}` };

  const storedPriceId = item.metadata?.bitlink_paused_price_id?.trim();
  const planPriceId = storedPriceId || await resolvePlanPriceId(planSlug);
  if (!planPriceId) return { error: `We couldn't determine your plan's price. ${SUPPORT_HINT}` };

  const provider = getTelecomProvider();
  await provider.reactivateLine(line.provider_line_id);

  try {
    await stripe.subscriptionItems.update(item.id, {
      price: planPriceId,
      proration_behavior: "none",
      metadata: {
        ...item.metadata,
        bitlink_paused: "",
        bitlink_paused_plan_slug: "",
        bitlink_paused_price_id: "",
      },
    });
  } catch {
    // Billing swap failed — refreeze so the customer isn't active on the pause price.
    await provider.suspendLine(line.provider_line_id, "freeze").catch(() => {});
    return { error: `We couldn't restart your billing, so the line stays paused. ${SUPPORT_HINT}` };
  }

  const admin = getAdmin();
  const resumedAt = new Date().toISOString();
  const metadata = { ...lineMeta, paused_at: null, paused_plan_slug: null, resumed_at: resumedAt };
  await admin.from("telecom_lines").update({ status: "active", metadata, updated_at: resumedAt }).eq("id", lineId);
  const subscriberUpdate = admin.from("subscribers").update({ status: "active", updated_at: resumedAt });
  if (subInfo.subscriberId) await subscriberUpdate.eq("id", subInfo.subscriberId);
  else await subscriberUpdate.eq("stripe_subscription_id", subInfo.stripeSubscriptionId);
  await logCustomerAction(user.id, "line_resumed", lineId, {
    providerLineId: line.provider_line_id,
    stripeSubscriptionId: subInfo.stripeSubscriptionId,
    planSlug,
  });

  revalidatePath("/account/lines");
  revalidatePath("/account");
  return {
    success: "Welcome back — your plan is active again. Your monthly billing restarted today.",
  };
}
