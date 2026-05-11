import { createSupabaseServerClient } from "@/lib/supabase/server";
import { plans } from "@/lib/plans";

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
    };
  }

  const [{ data: subscription }, { data: order }, { data: provisioningEvents }, { data: supportTickets }, { data: referrals }] =
    await Promise.all([
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

  return {
    customer,
    subscription,
    order,
    planName,
    planSlug,
    provisioningEvents: provisioningEvents ?? [],
    supportTickets: supportTickets ?? [],
    referrals: referrals ?? [],
  };
}
