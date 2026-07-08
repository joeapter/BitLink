import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import { plans } from "@/lib/plans";
import { REFERRAL_CAP, REFERRAL_BONUS_GB } from "@/lib/referrals";

export { REFERRAL_CAP, REFERRAL_BONUS_GB };

type AccountDbClient =
  | Awaited<ReturnType<typeof createSupabaseServerClient>>
  | NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

export type AccountLineBilling = {
  lineId: string | null;
  stripeSubscriptionId: string;
  stripeSubscriptionItemId: string | null;
  planSlug: string;
  planName: string;
  priceCents: number;
  currency: "USD";
  subscriberStatus: string;
  subscriptionStatus: string | null;
  nextBillingDate: string | null;
};

export type AccountSalesRepCommission = {
  id: string;
  status: string;
  amountAgorot: number;
  earnedAt: string | null;
  paidAt: string | null;
  referredCustomerName: string | null;
  referredCustomerEmail: string | null;
  referredLineId: string | null;
  referredLineStatus: string | null;
};

export type AccountSalesRepSummary = {
  id: string;
  referralCode: string;
  status: string;
  totalReferrals: number;
  pendingAgorot: number;
  paidAgorot: number;
  activeReferralLines: number;
  bonusGb: number;
  commissions: AccountSalesRepCommission[];
};

async function getSalesRepSummary(db: AccountDbClient, userId: string): Promise<AccountSalesRepSummary | null> {
  const { data: rep } = await db
    .from("sales_reps")
    .select("id, referral_code, status")
    .eq("profile_id", userId)
    .maybeSingle();

  if (!rep?.id) return null;

  const { data: commissions } = await db
    .from("sales_rep_commissions")
    .select("id, status, amount_agorot, earned_at, paid_at, referred_customer_id, referred_line_id")
    .eq("sales_rep_id", rep.id)
    .order("earned_at", { ascending: false });

  const commissionList = commissions ?? [];
  const referredCustomerIds = [
    ...new Set(commissionList.map((commission) => commission.referred_customer_id as string | null).filter(Boolean) as string[]),
  ];
  const referredLineIds = [
    ...new Set(commissionList.map((commission) => commission.referred_line_id as string | null).filter(Boolean) as string[]),
  ];

  const [{ data: referredCustomers }, { data: referredLines }] = await Promise.all([
    referredCustomerIds.length
      ? db.from("customers").select("id, full_name, email").in("id", referredCustomerIds)
      : Promise.resolve({ data: [] }),
    referredLineIds.length
      ? db.from("telecom_lines").select("id, status").in("id", referredLineIds)
      : Promise.resolve({ data: [] }),
  ]);

  const customerById = new Map((referredCustomers ?? []).map((customer) => [customer.id as string, customer]));
  const lineById = new Map((referredLines ?? []).map((line) => [line.id as string, line]));
  const activeReferralLines = Math.min(
    referredLineIds.filter((lineId) => lineById.get(lineId)?.status === "active").length,
    REFERRAL_CAP,
  );

  return {
    id: rep.id as string,
    referralCode: rep.referral_code as string,
    status: rep.status as string,
    totalReferrals: commissionList.length,
    pendingAgorot: commissionList
      .filter((commission) => commission.status === "pending")
      .reduce((total, commission) => total + Number(commission.amount_agorot ?? 0), 0),
    paidAgorot: commissionList
      .filter((commission) => commission.status === "paid")
      .reduce((total, commission) => total + Number(commission.amount_agorot ?? 0), 0),
    activeReferralLines,
    bonusGb: activeReferralLines * REFERRAL_BONUS_GB,
    commissions: commissionList.map((commission) => {
      const referredCustomer = commission.referred_customer_id
        ? customerById.get(commission.referred_customer_id as string)
        : null;
      const referredLine = commission.referred_line_id
        ? lineById.get(commission.referred_line_id as string)
        : null;
      return {
        id: commission.id as string,
        status: commission.status as string,
        amountAgorot: Number(commission.amount_agorot ?? 0),
        earnedAt: (commission.earned_at ?? null) as string | null,
        paidAt: (commission.paid_at ?? null) as string | null,
        referredCustomerName: (referredCustomer?.full_name ?? null) as string | null,
        referredCustomerEmail: (referredCustomer?.email ?? null) as string | null,
        referredLineId: (commission.referred_line_id ?? null) as string | null,
        referredLineStatus: (referredLine?.status ?? null) as string | null,
      };
    }),
  };
}

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
  const salesRep = await getSalesRepSummary(db, userId);

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
      salesRep,
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
      .select("telecom_line_id, stripe_subscription_id, stripe_subscription_item_id, plan_slug, monthly_price_cents, status")
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
      stripeSubscriptionItemId: (subscriber.stripe_subscription_item_id ?? null) as string | null,
      planSlug: subscriber.plan_slug as string,
      planName: plan.name,
      priceCents: Number(subscriber.monthly_price_cents ?? plan.priceCents),
      currency: plan.currency,
      subscriberStatus: subscriber.status as string,
      subscriptionStatus: (sub?.status ?? null) as string | null,
      nextBillingDate: (sub?.current_period_end ?? null) as string | null,
    };
  });

  // The local subscriptions table rarely carries current_period_end — pull the
  // real renewal date from Stripe (it lives on the subscription ITEM in this
  // API version). Live fetch keeps it correct across renewals and pauses.
  const stripeClient = getStripe();
  if (stripeClient) {
    await Promise.all(
      lineBillings.map(async (billing) => {
        try {
          const sub = await stripeClient.subscriptions.retrieve(billing.stripeSubscriptionId);
          const item = billing.stripeSubscriptionItemId
            ? sub.items?.data?.find((subItem) => subItem.id === billing.stripeSubscriptionItemId)
            : sub.items?.data?.[0];
          const periodEnd = item?.current_period_end;
          if (periodEnd) billing.nextBillingDate = new Date(periodEnd * 1000).toISOString();
          if (sub.status) billing.subscriptionStatus = sub.status;
        } catch {
          // keep whatever the DB had
        }
      }),
    );
  }

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
    salesRep,
    referralStats: {
      activeCount,
      totalCount: referralList.length,
      bonusGb: activeCount * REFERRAL_BONUS_GB,
      cap: REFERRAL_CAP,
    },
  };
}
