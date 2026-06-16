"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";

function errorParam(msg: string) {
  return `/support?error=${encodeURIComponent(msg)}`;
}

export async function createPublicSupportTicketAction(formData: FormData) {
  const name         = String(formData.get("name")         ?? "").trim();
  const whatsapp     = String(formData.get("whatsapp")     ?? "").trim();
  const bitlinkPhone = String(formData.get("bitlink_phone") ?? "").trim();
  const email        = String(formData.get("email")        ?? "").trim();
  const category     = String(formData.get("category")     ?? "other").trim();
  const message      = String(formData.get("message")      ?? "").trim();

  if (!name || !whatsapp || !message || !category) {
    redirect(errorParam("Please fill in your name, WhatsApp number, issue type, and details."));
  }

  const db = createSupabaseAdminClient();
  if (!db) {
    redirect(errorParam("Support is temporarily unavailable. Please WhatsApp us directly at +972 58-793-9426."));
  }

  const { data: ticket, error } = await db
    .from("support_tickets")
    .insert({
      customer_name:   name,
      whatsapp_number: whatsapp,
      bitlink_phone:   bitlinkPhone || null,
      email:           email || null,
      category,
      subject:         category,
      message,
      status:          "open",
      priority:        "normal",
      source:          "website",
    })
    .select("ticket_number")
    .single();

  if (error || !ticket?.ticket_number) {
    redirect(errorParam("Something went wrong. Please try again or WhatsApp us directly."));
  }

  // Notify support inbox — fire and forget
  sendEmail({
    to: "support@bitlink.co.il",
    replyTo: email || whatsapp,
    subject: `[${ticket.ticket_number}] ${category} — ${name}`,
    html: [
      `<p><strong>Ticket:</strong> ${ticket.ticket_number}</p>`,
      `<p><strong>Name:</strong> ${name}</p>`,
      `<p><strong>WhatsApp:</strong> ${whatsapp}</p>`,
      bitlinkPhone ? `<p><strong>BitLink number:</strong> ${bitlinkPhone}</p>` : "",
      email ? `<p><strong>Email:</strong> ${email}</p>` : "",
      `<p><strong>Category:</strong> ${category}</p>`,
      `<hr/>`,
      `<p style="white-space:pre-wrap">${message}</p>`,
      `<hr/>`,
      `<p><a href="https://bitlink.co.il/admin/support">Open in admin →</a></p>`,
    ].join(""),
  }).catch(() => {});

  redirect(`/support/ticket/${ticket.ticket_number}`);
}
