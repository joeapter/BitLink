"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/server";
import { changeLinePlan, type PlanChangeResult } from "@/lib/line-plan-change";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AccountPlanChangeState = PlanChangeResult | null;

function getAdmin() {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin client unavailable");
  return admin;
}

export async function changeAccountLinePlanAction(
  _prev: AccountPlanChangeState,
  formData: FormData,
): Promise<AccountPlanChangeState> {
  const user = await requireUser();
  const lineId = String(formData.get("lineId") ?? "");
  const newPlanSlug = String(formData.get("newPlanSlug") ?? "");
  if (!lineId || !newPlanSlug) return { error: "Choose a plan first." };

  const admin = getAdmin();
  const { data: customer } = await admin
    .from("customers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!customer?.id) return { error: "We couldn't find your BitLink account." };

  const { data: line } = await admin
    .from("telecom_lines")
    .select("id, status")
    .eq("id", lineId)
    .eq("customer_id", customer.id)
    .maybeSingle();
  if (!line?.id) return { error: "We couldn't find that line on your account." };
  if (line.status !== "active") return { error: "Only active lines can change plans." };

  const result = await changeLinePlan({
    admin,
    lineId,
    newPlanSlug,
    billingMode: "paid",
    actorUserId: user.id,
  });

  revalidatePath("/account");
  revalidatePath("/account/lines");
  revalidatePath("/account/billing");
  return result;
}
