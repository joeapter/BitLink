"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { provisioningStatuses } from "@/lib/status";

async function getWritableDb() {
  return createSupabaseAdminClient() ?? (await createSupabaseServerClient());
}

export async function updateProvisioningStatusAction(formData: FormData) {
  const { user } = await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "");

  if (!orderId || !provisioningStatuses.includes(status as never)) {
    return;
  }

  const db = await getWritableDb();
  const { data: order } = await db
    .from("orders")
    .update({ provisioning_status: status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select("*")
    .single();

  await db.from("provisioning_events").insert({
    order_id: orderId,
    customer_id: order?.customer_id ?? null,
    status,
    note: note || `Admin manually moved provisioning to ${status}.`,
    created_by: user.id,
  });

  await db.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "provisioning_status_updated",
    entity_type: "order",
    entity_id: orderId,
    metadata: { status, note },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/provisioning");
}

export async function createAdminSupportTicketAction(formData: FormData) {
  const { user } = await requireAdmin();
  const subject = String(formData.get("subject") ?? "");
  const message = String(formData.get("message") ?? "");
  const priority = String(formData.get("priority") ?? "normal");

  if (!subject || !message) return;

  const db = await getWritableDb();
  await db.from("support_tickets").insert({
    subject,
    message,
    priority,
    status: "open",
  });

  await db.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "support_ticket_created",
    entity_type: "support_ticket",
    metadata: { subject, priority },
  });

  revalidatePath("/admin/support");
}
