"use server";

// Manual review-request email, fired per-customer from the admin customer
// list. Deliberately NOT automated (e.g. N days after activation): while the
// Google Business Profile is new, Joe confirms the customer is happy first —
// unhappy customers get support, not a review link. Sent-state lives in
// audit_logs (action: review_request_sent), so there's no schema change and
// the button can show when a customer was already asked.

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { buildReviewRequestEmail } from "@/lib/email/templates";

const GOOGLE_REVIEW_URL = "https://g.page/r/CYVEKuteftFeEBM/review";

export async function sendReviewRequestAction(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();
  const customerId = String(formData.get("customerId") ?? "");
  if (!customerId) return;

  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin client unavailable");

  const { data: customer } = await admin
    .from("customers")
    .select("id, full_name, email")
    .eq("id", customerId)
    .single();
  if (!customer?.email) return;

  const sent = await sendEmail({
    to: customer.email,
    subject: "Would you share a quick review of BitLink?",
    html: buildReviewRequestEmail({
      fullName: (customer.full_name as string | null) ?? "there",
      reviewUrl: GOOGLE_REVIEW_URL,
    }),
  });

  if (sent) {
    try {
      await admin.from("audit_logs").insert({
        actor_user_id: user.id,
        action: "review_request_sent",
        entity_type: "customer",
        entity_id: customerId,
        metadata: { to: customer.email },
      });
    } catch {
      // audit failure is non-fatal; the email already went out
    }
  }

  revalidatePath("/admin/customers");
}
