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
        provisioningQueue: 0,
        failedPayments: 0,
      },
      recentOrders: [],
      provisioningOrders: [],
      failedOrders: [],
      referrals: [],
      portInQueue: [],
      intlNumberQueue: [],
      linesByPlan: [],
    };
  }

  const [
    customersCount,
    subscriptionsCount,
    provisioningCount,
    failedPaymentCount,
    recentOrders,
    provisioningOrders,
    failedOrders,
    referrals,
    portInLines,
    intlNumberLines,
    activeLines,
  ] = await Promise.all([
    db.from("customers").select("id", { count: "exact", head: true }),
    db.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .not("provisioning_status", "in", "(active,cancelled)"),
    db.from("orders").select("id", { count: "exact", head: true }).in("payment_status", ["failed", "unpaid"]),
    db.from("orders").select("*").order("created_at", { ascending: false }).limit(6),
    db
      .from("orders")
      .select("*")
      .not("provisioning_status", "in", "(active,cancelled)")
      .order("created_at", { ascending: true })
      .limit(8),
    db.from("orders").select("*").in("payment_status", ["failed", "unpaid"]).order("created_at", { ascending: false }).limit(6),
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

  // Filter port-in lines to only those with non-complete status
  const portInQueue = (portInLines.data ?? []).filter((l) => {
    const pi = (l.metadata as Record<string, unknown> | null)?.intl_port_in as Record<string, unknown> | undefined;
    return pi && pi.status !== 'complete';
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
      provisioningQueue: provisioningCount.count ?? 0,
      failedPayments: failedPaymentCount.count ?? 0,
    },
    recentOrders: recentOrders.data ?? [],
    provisioningOrders: provisioningOrders.data ?? [],
    failedOrders: failedOrders.data ?? [],
    referrals: referrals.data ?? [],
    portInQueue,
    intlNumberQueue,
    linesByPlan,
  };
}
