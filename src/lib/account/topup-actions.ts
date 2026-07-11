"use server";

// Self-serve topup purchase — always a one-time paid charge against the
// customer's saved payment method (no free or recurring self-serve option;
// admin handles gifts and recurring monthly grants from the admin console).

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { grantTopup, type GrantTopupResult } from "@/lib/topups/grant-topup";

export type AccountBuyTopupState = GrantTopupResult | null;

function getAdmin() {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin client unavailable");
  return admin;
}

async function getOwnedLine(userId: string, lineId: string) {
  const admin = getAdmin();
  const { data: customer } = await admin.from("customers").select("id").eq("user_id", userId).maybeSingle();
  if (!customer) return null;

  const { data: line } = await admin
    .from("telecom_lines")
    .select("id")
    .eq("id", lineId)
    .eq("customer_id", customer.id)
    .maybeSingle();
  return line ? true : null;
}

export async function buyTopupAccountAction(
  _prev: AccountBuyTopupState,
  formData: FormData,
): Promise<AccountBuyTopupState> {
  const user = await requireUser();
  const lineId = String(formData.get("lineId") ?? "");
  const topupId = String(formData.get("topupId") ?? "");
  if (!lineId || !topupId) return { error: "Choose a topup before continuing." };

  const owned = await getOwnedLine(user.id, lineId);
  if (!owned) return { error: "We couldn't find that line on your account." };

  const admin = getAdmin();
  const result = await grantTopup({
    admin,
    lineId,
    topupId,
    frequency: "once",
    billingMode: "paid",
    source: "self_serve",
    actorUserId: user.id,
  });

  revalidatePath("/account/lines");
  return result;
}
