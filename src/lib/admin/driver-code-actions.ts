"use server";

// Claim a pre-printed driver referral card for a specific driver, from the
// phone, at the airport. Attribution works before the claim (checkout stores
// the raw code in customers.referred_by) — claiming just attaches the human
// so Joe knows who to pay 30 shekel per activated line.

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ClaimDriverCodeState = { success?: string; error?: string } | null;

export async function claimDriverCodeAction(
  _prev: ClaimDriverCodeState,
  formData: FormData,
): Promise<ClaimDriverCodeState> {
  await requireAdmin();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const driverName = String(formData.get("driverName") ?? "").trim();
  const driverPhone = String(formData.get("driverPhone") ?? "").trim();
  const driverEmail = String(formData.get("driverEmail") ?? "").trim();

  if (!code || !driverName) return { error: "Code and driver name are required." };

  const admin = createSupabaseAdminClient();
  if (!admin) return { error: "Database unavailable." };

  const { data: row } = await admin.from("driver_codes").select("id, claimed_at, driver_name").eq("code", code).maybeSingle();
  if (!row) return { error: `Code ${code} doesn't exist.` };
  if (row.claimed_at) return { error: `${code} is already claimed by ${row.driver_name ?? "someone"}.` };

  await admin
    .from("driver_codes")
    .update({
      driver_name: driverName,
      driver_phone: driverPhone || null,
      driver_email: driverEmail || null,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  revalidatePath("/admin/drivers");
  return { success: `${code} → ${driverName}. Hand them the stack.` };
}
