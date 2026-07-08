"use server";

// eSIM compatibility check — a lightweight support ticket filed from the eSIM
// guide's "we'll confirm your model" widget. Lands in the same support inbox
// as every other request, tagged as an eSIM activation question.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";

export type EsimCheckState = { error?: string; success?: string } | null;

export async function submitEsimCheckAction(
  _prev: EsimCheckState,
  formData: FormData,
): Promise<EsimCheckState> {
  const model = String(formData.get("model") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!model) return { error: "Tell us your phone model so we can check it." };
  if (!contact) return { error: "Add a WhatsApp number or email so we can get back to you." };

  const db = createSupabaseAdminClient();
  if (!db) {
    return { error: "We couldn't submit that right now — please WhatsApp us at +972 58-793-9426." };
  }

  const isEmail = contact.includes("@");
  const message = `eSIM compatibility check requested.\nPhone model: ${model}`;

  const { data: ticket, error } = await db
    .from("support_tickets")
    .insert({
      customer_name: name || "eSIM compatibility check",
      whatsapp_number: isEmail ? contact : contact,
      email: isEmail ? contact : null,
      category: "esim_activation",
      subject: "eSIM compatibility check",
      message,
      status: "open",
      priority: "normal",
      source: "website",
    })
    .select("ticket_number")
    .single();

  if (error || !ticket?.ticket_number) {
    return { error: "Something went wrong. Please WhatsApp us directly at +972 58-793-9426." };
  }

  sendEmail({
    to: "support@bitlink.co.il",
    replyTo: contact,
    subject: `[${ticket.ticket_number}] eSIM compatibility — ${model}`,
    html: [
      `<p><strong>Ticket:</strong> ${ticket.ticket_number}</p>`,
      `<p><strong>Phone model:</strong> ${model}</p>`,
      `<p><strong>Reply to:</strong> ${contact}</p>`,
      name ? `<p><strong>Name:</strong> ${name}</p>` : "",
      `<hr/>`,
      `<p>Customer wants to confirm this device supports eSIM before ordering.</p>`,
      `<p><a href="https://bitlink.co.il/admin/support">Open in admin →</a></p>`,
    ].join(""),
  }).catch(() => {});

  return { success: "Got it — we'll confirm whether your phone works with eSIM shortly." };
}
