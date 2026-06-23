"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function updatePlanCostAction(formData: FormData) {
  const planId = String(formData.get("planId") ?? "");
  const rawCost = String(formData.get("costAgurot") ?? "0");
  const costAgurot = Math.max(0, Math.round(parseFloat(rawCost) * 100));

  if (!planId) return;

  const admin = createSupabaseAdminClient();
  if (!admin) return;

  await admin.from("plans").update({ cost_agurot: costAgurot }).eq("id", planId);
  revalidatePath("/admin/plans");
}
