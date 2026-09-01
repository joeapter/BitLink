import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { getPlan } from "@/lib/plans";

export async function getAdminDb() {
  const admin = createSupabaseAdminClient();
  if (admin) return admin;
  if (!hasSupabasePublicEnv()) return null;
  return createSupabaseServerClient();
}

export async function getAdminOverview() {
  const db = await getAdminDb();
  if (!db) {
    return {
      metrics: {
        activeCustomers: 0,
        activeSubscriptions: 0,
        activeTrials: 0,
        provisioningQueue: 0,
        failedPayments: 0,
      },
      recentOrders: [],
      provisioningOrders: [],
      pastDue: [],
      referrals: [],
      portInQueue: [],
      intlNumberQueue: [],
      linesByPlan: [],
    };
  }

  const [
    customersCount,
    subscriptionsCount,
    activeTrialsCount,
    provisioningCount,
    failedPaymentCount,
    recentOrders,
    provisioningOrders,
    pastDue,
    referrals,
    portInLines,
    intlNumberLines,
    activeLines,
  ] = await Promise.all([
    db.from("customers").select("id", { count: "exact", head: true }),
    // `subscribers` is canonical. The legacy `subscriptions` table is stale and
    // under-reported this tile by 3 (19 vs 22) — same trap that hit the org
    // profit report in Jul 2026.
    db.from("subscribers").select("id", { count: "exact", head: true }).eq("status", "active"),
    db.from("trial_lines").select("id", { count: "exact", head: true }).eq("status", "active"),
    db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .not("provisioning_status", "in", "(active,cancelled)"),
    // Failed payments live on `subscribers`, NOT on `orders`. An order row is
    // written once at checkout and always with payment_status 'paid' — no code
    // path ever writes 'failed' or 'unpaid' — and a renewal that declines weeks
    // later never creates an order at all. This tile counted orders and so read
    // 0 permanently, hiding three genuinely past-due customers for ten days.
    // handlePaymentFailed (process-stripe-event) is what actually records a
    // failure, by flipping the subscriber to 'suspended'.
    db.from("subscribers").select("id", { count: "exact", head: true }).eq("status", "suspended"),
    db.from("orders").select("*").order("created_at", { ascending: false }).limit(6),
    db
      .from("orders")
      .select("*")
      .not("provisioning_status", "in", "(active,cancelled)")
      .order("created_at", { ascending: true })
      .limit(8),
    // Who is past due, not just how many — the count alone doesn't tell you
    // who to chase. updated_at is when handlePaymentFailed suspended them,
    // which is the closest thing we store to "failing since".
    db
      .from("subscribers")
      .select("id, plan_slug, telecom_line_id, stripe_subscription_id, updated_at, customers(full_name, email)")
      .eq("status", "suspended")
      .order("updated_at", { ascending: true })
      .limit(10),
    db.from("referrals").select("*").order("created_at", { ascending: false }).limit(6),
    db
      .from("telecom_lines")
      .select("id, metadata, customers(full_name, email)")
      .not("metadata->intl_port_in", "is", null)
      .not("metadata->>intl_port_in", "is", null)
      .order("created_at", { ascending: false })
      .limit(20),
    db
      .from("telecom_lines")
      .select("id, metadata, customers(full_name, email)")
      .not("metadata->intl_number", "is", null)
      .not("metadata->>intl_number", "is", null)
      .order("created_at", { ascending: false })
      .limit(20),
    db.from("telecom_lines").select("metadata").eq("status", "active"),
  ]);

  // Filter port-in lines to only those still needing action (drop
  // finished/cancelled ones — completeIntlPortInRequest stamps 'completed').
  const portInQueue = (portInLines.data ?? []).filter((l) => {
    const pi = (l.metadata as Record<string, unknown> | null)?.intl_port_in as Record<string, unknown> | undefined;
    const done = ['complete', 'completed', 'cancelled'].includes(String(pi?.status));
    return pi && !done;
  });

  // New (non-port) intl number requests still waiting on manual fulfillment —
  // normal flow now picks + reserves a number before payment, so this should
  // stay empty except for pre-picker legacy orders or a picker failure.
  const intlNumberQueue = (intlNumberLines.data ?? []).filter((l) => {
    const n = (l.metadata as Record<string, unknown> | null)?.intl_number as Record<string, unknown> | undefined;
    return n && n.status === 'awaiting_fulfillment';
  });

  const planCounts = new Map<string, number>();
  for (const line of activeLines.data ?? []) {
    const planSlug = (line.metadata as Record<string, unknown> | null)?.plan_slug as string | undefined;
    const name = planSlug ? getPlan(planSlug).name : 'Unknown plan';
    planCounts.set(name, (planCounts.get(name) ?? 0) + 1);
  }
  const linesByPlan = [...planCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    metrics: {
      activeCustomers: customersCount.count ?? 0,
      activeSubscriptions: subscriptionsCount.count ?? 0,
      activeTrials: activeTrialsCount.count ?? 0,
      provisioningQueue: provisioningCount.count ?? 0,
      failedPayments: failedPaymentCount.count ?? 0,
    },
    recentOrders: recentOrders.data ?? [],
    provisioningOrders: provisioningOrders.data ?? [],
    pastDue: pastDue.data ?? [],
    referrals: referrals.data ?? [],
    portInQueue,
    intlNumberQueue,
    linesByPlan,
  };
}
