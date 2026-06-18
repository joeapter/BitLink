import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

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
  ]);

  // Filter port-in lines to only those with non-complete status
  const portInQueue = (portInLines.data ?? []).filter((l) => {
    const pi = (l.metadata as Record<string, unknown> | null)?.intl_port_in as Record<string, unknown> | undefined;
    return pi && pi.status !== 'complete';
  });

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
  };
}
