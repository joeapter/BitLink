"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function db() {
  const client = createSupabaseAdminClient();
  if (!client) throw new Error("DB unavailable");
  return client;
}

export async function updateTicketStatusAction(ticketId: string, status: string) {
  await requireAdmin();
  await db().from("support_tickets").update({ status }).eq("id", ticketId);
  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);
}

export async function updateTicketPriorityAction(ticketId: string, priority: string) {
  await requireAdmin();
  await db().from("support_tickets").update({ priority }).eq("id", ticketId);
  revalidatePath(`/admin/support/${ticketId}`);
}

export async function addTicketNoteAction(formData: FormData) {
  await requireAdmin();
  const ticketId = String(formData.get("ticketId") ?? "");
  const body     = String(formData.get("body")     ?? "").trim();
  if (!ticketId || !body) return;

  await db().from("support_messages").insert({
    ticket_id: ticketId,
    direction: "internal",
    channel:   "note",
    body,
  });
  revalidatePath(`/admin/support/${ticketId}`);
}

export async function useMacroAction(formData: FormData) {
  await requireAdmin();
  const macroId  = String(formData.get("macroId")  ?? "");
  const ticketId = String(formData.get("ticketId") ?? "");
  if (!macroId) return;

  await db().rpc("increment_macro_usage", { macro_id: macroId }).then(() => null).catch(() => null);
  // Fallback if RPC not available — direct update
  const { data } = await db().from("support_macros").select("usage_count").eq("id", macroId).single();
  if (data) {
    await db().from("support_macros").update({ usage_count: (data.usage_count ?? 0) + 1 }).eq("id", macroId);
  }

  if (ticketId) revalidatePath(`/admin/support/${ticketId}`);
}

export async function createMacroAction(formData: FormData) {
  await requireAdmin();
  const title    = String(formData.get("title")    ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const body     = String(formData.get("body")      ?? "").trim();
  if (!title || !body) return;

  await db().from("support_macros").insert({
    title,
    category: category || null,
    body,
    active: true,
  });
  revalidatePath("/admin/support/macros");
}

export async function toggleMacroAction(formData: FormData) {
  await requireAdmin();
  const macroId = String(formData.get("macroId") ?? "");
  const active  = formData.get("active") === "true";
  if (!macroId) return;

  await db().from("support_macros").update({ active: !active }).eq("id", macroId);
  revalidatePath("/admin/support/macros");
}

export async function deleteMacroAction(formData: FormData) {
  await requireAdmin();
  const macroId = String(formData.get("macroId") ?? "");
  if (!macroId) return;

  await db().from("support_macros").delete().eq("id", macroId);
  revalidatePath("/admin/support/macros");
}
