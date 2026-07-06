import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { plans } from "@/lib/plans";
import { REFERRAL_CAP, REFERRAL_BONUS_GB } from "@/lib/referrals";

export { REFERRAL_CAP, REFERRAL_BONUS_GB };

type AccountDbClient =
  | Awaited<ReturnType<typeof createSupabaseServerClient>>
  | NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

export type AccountLineBilling = {
  lineId: string | null;
  stripeSubscriptionId: string;
  planSlug: string;
  planName: string;
  priceCents: number;
  currency: "USD";
  subscriberStatus: string;
  subscriptionStatus: string | null;
  nextBillingDate: string | null;
};

export async function resolveAccountCustomer(
  db: AccountDbClient,
  userId: string,
  userEmail?: string | null,
) {
  const { data: linkedCustomer } = await db.from("customers").select("*").eq("user_id", userId).maybeSingle();
  if (linkedCustomer) return linkedCustomer;

  let email = userEmail?.trim() ?? "";
  if (!email) {
    const { data: profile } = await db.from("profiles").select("email").eq("id", userId).maybeSingle();
    email = (profile?.email as string | null | undefined)?.trim() ?? "";
  }
  if (!email) return null;

  const { data: emailCustomer } = await db
    .from("customers")
    .select("*")
    .ilike("email", email)
    .maybeSingle();

  if (!emailCustomer) return null;

  const existingUserId = (emailCustomer.user_id ?? null) as string | null;
  if (existingUserId && existingUserId !== userId) return null;
  if (existingUserId === userId) return emailCustomer;

  const { data: claimedCustomer } = await db
    .from("customers")
    .update({ user_id: userId, updated_at: new Date().toISOString() })
    .eq("id", emailCustomer.id)
    .is("user_id", null)
    .select("*")
    .maybeSingle();

  return claimedCustomer ?? emailCustomer;
}

export async function getAccountSnapshot(userId: string, userEmail?: string | null) {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const db = admin ?? supabase;

  const customer = await resolveAccountCustomer(db, userId, userEmail);

  if (!customer) {
    return {
      customer: null,
      subscription: null,
      subscriptions: [],
      order: null,
      planName: "No active plan",
      planSlug: null,
      provisioningEvents: [],
      supportTickets: [],
      referrals: [],
      lines: [],
      lineBillings: [] as AccountLineBilling[],
      referralStats: { activeCount: 0, totalCount: 0, bonusGb: 0, cap: REFERRAL_CAP },
    };
  }

  const [
    { data: subscriptions },
    { data: order },
    { data: provisioningEvents },
    { data: supportTickets },
    { data: referrals },
    { data: lines },
    { data: subscribers },
  ] = await Promise.all([
    db
      .from("subscriptions")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(50),
    db
      .from("orders")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from("provisioning_events")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(12),
    db
      .from("support_tickets")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false }),
    db
      .from("referrals")
      .select("*")
      .eq("referrer_customer_id", customer.id)
      .order("created_at", { ascending: false }),
    db
      .from("telecom_lines")
      .select("id, external_id, status, provider_line_id, is_kosher, language, metadata, created_at, updated_at")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false }),
    db
      .from("subscribers")
      .select("telecom_line_id, stripe_subscription_id, plan_slug, status")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false }),
  ]);

  const subscriptionList = subscriptions ?? [];
  const subscription = subscriptionList[0] ?? null;
  const subscriptionByStripeId = new Map(
    subscriptionList.map((sub) => [sub.stripe_subscription_id as string, sub]),
  );

  const lineBillings: AccountLineBilling[] = (subscribers ?? []).map((subscriber) => {
    const plan = plans.find((p) => p.slug === subscriber.plan_slug) ?? plans[1];
    const sub = subscriptionByStripeId.get(subscriber.stripe_subscription_id as string);
    return {
      lineId: (subscriber.telecom_line_id ?? null) as string | null,
      stripeSubscriptionId: subscriber.stripe_subscription_id as string,
      planSlug: subscriber.plan_slug as string,
      planName: plan.name,
      priceCents: plan.priceCents,
      currency: plan.currency,
      subscriberStatus: subscriber.status as string,
      subscriptionStatus: (sub?.status ?? null) as string | null,
      nextBillingDate: (sub?.current_period_end ?? null) as string | null,
    };
  });

  let planName = "No active plan";
  let planSlug: string | null = null;
  const planId = subscription?.plan_id ?? order?.plan_id;

  if (planId) {
    const { data: planRow } = await supabase.from("plans").select("name, slug").eq("id", planId).maybeSingle();
    planName = planRow?.name ?? planName;
    planSlug = planRow?.slug ?? null;
  } else if (order?.stripe_checkout_session_id) {
    planName = plans[1].name;
    planSlug = plans[1].slug;
  }

  const referralList = referrals ?? [];
  const activeCount = Math.min(referralList.filter((r) => r.status === "active").length, REFERRAL_CAP);

  return {
    customer,
    subscription,
    subscriptions: subscriptionList,
    order,
    planName,
    planSlug,
    provisioningEvents: provisioningEvents ?? [],
    supportTickets: supportTickets ?? [],
    referrals: referralList,
    lines: lines ?? [],
    lineBillings,
    referralStats: {
      activeCount,
      totalCount: referralList.length,
      bonusGb: activeCount * REFERRAL_BONUS_GB,
      cap: REFERRAL_CAP,
    },
  };
}
