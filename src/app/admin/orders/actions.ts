"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function markDeliveryShippedAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const admin = createSupabaseAdminClient();
  if (!admin) return;

  await admin
    .from("physical_sim_deliveries")
    .update({ status: "shipped", shipped_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/orders");
}

export async function markDeliveryDeliveredAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const admin = createSupabaseAdminClient();
  if (!admin) return;

  await admin
    .from("physical_sim_deliveries")
    .update({ status: "delivered", delivered_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/orders");
}
