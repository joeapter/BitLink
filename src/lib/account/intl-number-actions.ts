"use server";

// Self-serve "add a US/CA/UK number to an existing line" — always billed
// (prorated this month, folded into the line's regular monthly charge going
// forward). The admin-side equivalent additionally supports giving the
// number for free; this one hardcodes billingMode: 'paid'.

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { addIntlNumberToLine, type AddIntlNumberResult } from "@/lib/custom-orders/international-numbers";

export type AccountAddIntlNumberState = AddIntlNumberResult | null;

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

export async function addIntlNumberToLineAccountAction(
  _prev: AccountAddIntlNumberState,
  formData: FormData,
): Promise<AccountAddIntlNumberState> {
  const user = await requireUser();
  const lineId = String(formData.get("lineId") ?? "");
  const country = String(formData.get("country") ?? "") as "us" | "canada" | "uk";
  const number = String(formData.get("number") ?? "");

  if (!lineId || !number || !["us", "canada", "uk"].includes(country)) {
    return { error: "Choose a number before continuing." };
  }

  const owned = await getOwnedLine(user.id, lineId);
  if (!owned) return { error: "We couldn't find that line on your account." };

  const admin = getAdmin();
  const result = await addIntlNumberToLine({
    admin,
    lineId,
    country,
    number,
    billingMode: "paid",
    actorUserId: user.id,
  });

  revalidatePath("/account/lines");
  revalidatePath("/account");
  return result;
}
