"use server";

// Archive — soft-hide a customer from the default list (e.g. someone who
// signed up but never activated) without touching their data. Fully
// reversible, and archived customers stay searchable/reachable for
// re-engagement/marketing — nothing is deleted, no Stripe/Annatel side
// effects, so there's no need to gate this on active lines or subscriptions
// the way an actual delete would.

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function getAdmin() {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin client unavailable");
  return admin;
}

export async function archiveCustomersAction(customerIds: string[]): Promise<{ count: number }> {
  const { user } = await requireAdmin();
  if (!customerIds.length) return { count: 0 };
  const admin = getAdmin();

  const { data } = await admin
    .from("customers")
    .update({ archived_at: new Date().toISOString() })
    .in("id", customerIds)
    .select("id");

  for (const id of (data ?? []).map((row) => row.id as string)) {
    try {
      await admin
        .from("audit_logs")
        .insert({ actor_user_id: user.id, action: "customer_archived", entity_type: "customer", entity_id: id, metadata: {} });
    } catch {
      // audit failure is non-fatal
    }
  }

  revalidatePath("/admin/customers");
  return { count: data?.length ?? 0 };
}

export async function unarchiveCustomersAction(customerIds: string[]): Promise<{ count: number }> {
  const { user } = await requireAdmin();
  if (!customerIds.length) return { count: 0 };
  const admin = getAdmin();

  const { data } = await admin
    .from("customers")
    .update({ archived_at: null })
    .in("id", customerIds)
    .select("id");

  for (const id of (data ?? []).map((row) => row.id as string)) {
    try {
      await admin
        .from("audit_logs")
        .insert({ actor_user_id: user.id, action: "customer_unarchived", entity_type: "customer", entity_id: id, metadata: {} });
    } catch {
      // audit failure is non-fatal
    }
  }

  revalidatePath("/admin/customers");
  return { count: data?.length ?? 0 };
}
