"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";

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
    redirect(`/support?error=${messageParam("Support requests are temporarily unavailable. Please email support@bitlink.co.il.")}`);
  }

  await db.from("support_tickets").insert({
    subject,
    message: `${message}\n\nFrom: ${name || "Unknown"} <${email}>`,
    status: "open",
    priority: "normal",
  });

  // Notify support inbox
  await sendEmail({
    to: "support@bitlink.co.il",
    replyTo: email,
    subject: `[Support] ${subject}`,
    html: `<p><strong>From:</strong> ${name || "Unknown"} &lt;${email}&gt;</p><p><strong>Subject:</strong> ${subject}</p><hr/><p style="white-space:pre-wrap">${message}</p>`,
  }).catch(() => {}); // don't fail the request if email fails

  redirect(`/support?message=${messageParam("Support request received.")}`);
}
