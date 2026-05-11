"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function messageParam(message: string) {
  return encodeURIComponent(message);
}

export async function createPublicSupportTicketAction(formData: FormData) {
  const subject = String(formData.get("subject") ?? "");
  const message = String(formData.get("message") ?? "");
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");

  if (!subject || !message || !email) {
    redirect(`/support?error=${messageParam("Please include your email, subject, and message.")}`);
  }

  const db = createSupabaseAdminClient();
  if (!db) {
    redirect(`/support?error=${messageParam("Support ticket storage is not configured yet.")}`);
  }

  await db.from("support_tickets").insert({
    subject,
    message: `${message}\n\nFrom: ${name || "Unknown"} <${email}>`,
    status: "open",
    priority: "normal",
  });

  redirect(`/support?message=${messageParam("Support request received.")}`);
}
