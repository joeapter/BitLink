"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { makeCustomerSalesRep } from "@/lib/referral-service";

async function getWritableDb() {
  return createSupabaseAdminClient() ?? (await createSupabaseServerClient());
}

function parseAgorot(value: FormDataEntryValue | null): number {
  const raw = String(value ?? "").replace(/[^\d.]/g, "");
  const number = Number(raw);
  if (!Number.isFinite(number) || number <= 0) return 0;
  return Math.round(number * 100);
}

export async function makeSalesRepAction(formData: FormData) {
  const { user } = await requireAdmin();
  const customerId = String(formData.get("customerId") ?? "");
  if (!customerId) return;

  const db = await getWritableDb();
  await makeCustomerSalesRep(db, { customerId, createdBy: user.id });

  revalidatePath("/admin/customers");
  revalidatePath("/admin/sales-reps");
}

export async function recordSalesRepPaymentAction(formData: FormData) {
  const { user } = await requireAdmin();
  const salesRepId = String(formData.get("salesRepId") ?? "");
  const amountAgorot = parseAgorot(formData.get("amountIls"));
  const method = String(formData.get("method") ?? "").trim() || null;
  const reference = String(formData.get("reference") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!salesRepId || amountAgorot <= 0) return;

  const db = await getWritableDb();
  const { data: payment } = await db
    .from("sales_rep_payments")
    .insert({
      sales_rep_id: salesRepId,
      amount_agorot: amountAgorot,
      currency: "ILS",
      method,
      reference,
      notes,
      created_by: user.id,
    })
    .select("id")
    .maybeSingle();

  const paymentId = payment?.id as string | undefined;
  let remaining = amountAgorot;

  if (paymentId) {
    const { data: pending } = await db
      .from("sales_rep_commissions")
      .select("id, amount_agorot")
      .eq("sales_rep_id", salesRepId)
      .eq("status", "pending")
      .order("earned_at", { ascending: true });

    for (const commission of pending ?? []) {
      const amount = Number(commission.amount_agorot ?? 0);
      if (amount <= 0 || remaining < amount) break;

      await db
        .from("sales_rep_commissions")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_id: paymentId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", commission.id);
      remaining -= amount;
    }
  }

  await db.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "sales_rep_payment_recorded",
    entity_type: "sales_rep",
    entity_id: salesRepId,
    metadata: { paymentId: paymentId ?? null, amountAgorot, method, reference, notes },
  });

  revalidatePath("/admin/sales-reps");
}
