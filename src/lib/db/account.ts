import { createSupabaseServerClient } from "@/lib/supabase/server";
import { plans } from "@/lib/plans";
import { REFERRAL_CAP, REFERRAL_BONUS_GB } from "@/lib/referrals";

export { REFERRAL_CAP, REFERRAL_BONUS_GB };

export async function getAccountSnapshot(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: customer } = await supabase.from("customers").select("*").eq("user_id", userId).maybeSingle();

  if (!customer) {
    return {
      customer: null,
      subscription: null,
      order: null,
      planName: "No active plan",
      planSlug: null,
      provisioningEvents: [],
      supportTickets: [],
      referrals: [],
      lines: [],
      referralStats: { activeCount: 0, totalCount: 0, bonusGb: 0, cap: REFERRAL_CAP },
    };
  }

  const [
    { data: subscription },
    { data: order },
    { data: provisioningEvents },
    { data: supportTickets },
    { data: referrals },
    { data: lines },
  ] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("orders")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("provisioning_events")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("support_tickets")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("referrals")
      .select("*")
      .eq("referrer_customer_id", customer.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("telecom_lines")
      .select("id, external_id, status, provider_line_id, is_kosher, language, metadata, created_at, updated_at")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false }),
  ]);

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
    order,
    planName,
    planSlug,
    provisioningEvents: provisioningEvents ?? [],
    supportTickets: supportTickets ?? [],
    referrals: referralList,
    lines: lines ?? [],
    referralStats: {
      activeCount,
      totalCount: referralList.length,
      bonusGb: activeCount * REFERRAL_BONUS_GB,
      cap: REFERRAL_CAP,
    },
  };
}
