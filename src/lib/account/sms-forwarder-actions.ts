"use server";

// SMS-to-email forwarding — customer-facing. Same underlying Annatel
// capability the admin console already exposes (line-actions.ts); this is
// just the self-serve version, plus an admin notification when a customer
// turns it on themselves.
//
// Carrier-side setting (intercepts the SMS before it ever reaches the
// handset), so it works regardless of the phone's own roaming/network
// status — the reason this is worth pointing trial customers at even
// before they land in Israel.

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTelecomProvider } from "@/lib/telecom/provider.registry";
import { sendEmail } from "@/lib/email/send";
import { buildAdminSmsForwarderEnabledEmail } from "@/lib/email/templates";

export type SmsForwarderActionState = { error?: string; success?: string } | null;

const ADMIN_NOTIFY_EMAIL = "joe@bitlink.co.il";
const SUPPORT_HINT = "Please contact support on WhatsApp and we'll sort it out.";

function getAdmin() {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin client unavailable");
  return admin;
}

async function getOwnedLine(userId: string, lineId: string) {
  const admin = getAdmin();
  const { data: customer } = await admin.from("customers").select("id, full_name, email").eq("user_id", userId).maybeSingle();
  if (!customer) return null;

  const { data: line } = await admin
    .from("telecom_lines")
    .select("id, status, provider_line_id")
    .eq("id", lineId)
    .eq("customer_id", customer.id)
    .maybeSingle();
  if (!line) return null;

  return { customer, line };
}

async function resolveLineDidId(providerLineId: string): Promise<string | null> {
  const provider = getTelecomProvider();
  const detail = await provider.getLineDetail(providerLineId);
  return detail.dids[0]?.id ?? null;
}

function notifyAdmin(customerName: string, customerEmail: string, forwardTo: string, lineId: string) {
  sendEmail({
    to: ADMIN_NOTIFY_EMAIL,
    subject: `SMS-to-email enabled — ${customerName}`,
    html: buildAdminSmsForwarderEnabledEmail({ customerName, customerEmail, forwardTo, lineId }),
  }).catch(() => {
    // best-effort — a notification failure must never affect the customer's action
  });
}

export async function setupSmsForwarderAction(
  _prev: SmsForwarderActionState,
  formData: FormData,
): Promise<SmsForwarderActionState> {
  const user = await requireUser();
  const lineId = String(formData.get("lineId") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  if (!lineId || !email) return { error: "Missing required fields." };

  const owned = await getOwnedLine(user.id, lineId);
  if (!owned) return { error: "We couldn't find that line on your account." };
  const { customer, line } = owned;

  if (!line.provider_line_id) return { error: `This line isn't ready yet. ${SUPPORT_HINT}` };

  const lineDidId = await resolveLineDidId(line.provider_line_id);
  if (!lineDidId) return { error: `We couldn't find a number on this line. ${SUPPORT_HINT}` };

  try {
    const provider = getTelecomProvider();
    await provider.addLineDidSmsForwarder(line.provider_line_id, lineDidId, {
      emailRecipientAddress: email,
    });
  } catch {
    return { error: `Something went wrong setting that up. ${SUPPORT_HINT}` };
  }

  notifyAdmin(customer.full_name ?? customer.email ?? "Unknown", customer.email ?? "", email, lineId);

  revalidatePath("/account");
  revalidatePath("/account/lines");
  return { success: `SMS forwarding is on — texts to this number now also go to ${email}.` };
}

export async function removeSmsForwarderAction(
  _prev: SmsForwarderActionState,
  formData: FormData,
): Promise<SmsForwarderActionState> {
  const user = await requireUser();
  const lineId = String(formData.get("lineId") ?? "");
  const settingId = String(formData.get("settingId") ?? "");
  if (!lineId || !settingId) return { error: "Missing required fields." };

  const owned = await getOwnedLine(user.id, lineId);
  if (!owned) return { error: "We couldn't find that line on your account." };
  const { line } = owned;
  if (!line.provider_line_id) return { error: `This line isn't ready yet. ${SUPPORT_HINT}` };

  const lineDidId = await resolveLineDidId(line.provider_line_id);
  if (!lineDidId) return { error: `We couldn't find a number on this line. ${SUPPORT_HINT}` };

  try {
    const provider = getTelecomProvider();
    await provider.removeLineDidSmsForwarder(line.provider_line_id, lineDidId, settingId);
  } catch {
    return { error: `Something went wrong turning that off. ${SUPPORT_HINT}` };
  }

  revalidatePath("/account");
  revalidatePath("/account/lines");
  return { success: "SMS forwarding turned off." };
}

export async function getSmsForwarderStatus(providerLineId: string): Promise<{ id: string; email: string } | null> {
  const lineDidId = await resolveLineDidId(providerLineId);
  if (!lineDidId) return null;

  const provider = getTelecomProvider();
  const settings = await provider.listLineDidSmsForwarders(providerLineId, lineDidId);
  const active = settings[0];
  if (!active?.emailRecipientAddress) return null;
  return { id: active.id, email: active.emailRecipientAddress };
}
