"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function updateCarrierRateAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const raw = String(formData.get("rateAgurot") ?? "0");
  // User enters ₪ value; we store in agurot (× 100)
  const rateAgurot = Math.max(0, parseFloat(raw) * 100);

  if (!id) return;

  const admin = createSupabaseAdminClient();
  if (!admin) return;

  await admin.from("carrier_rates").update({ rate_agurot: rateAgurot, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/carrier-rates");
  revalidatePath("/admin/organizations");
}
