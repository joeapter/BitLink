"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getWritableDb() {
  return createSupabaseAdminClient() ?? (await createSupabaseServerClient());
}

/** Dollars in the form → cents in the database. Never store float money. */
function parseCents(value: FormDataEntryValue | null, fallback: number): number {
  const raw = String(value ?? "").replace(/[^\d.]/g, "");
  const number = Number(raw);
  if (!Number.isFinite(number) || number <= 0) return fallback;
  return Math.round(number * 100);
}

/** Codes are stored and matched uppercase, with spaces collapsed to dashes. */
function normalizeCode(value: FormDataEntryValue | null): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 32);
}

export type RepActionState = { error?: string; success?: string } | null;

// Every write here reports what happened. The previous version threw the
// insert result away and revalidated regardless, so a rejected row looked
// exactly like a saved one — which is how a Rep was "created" against a
// production table that was missing the `email` column (migration 037 had
// never been applied) with nothing on screen to say so.
export async function createRepAction(
  _prev: RepActionState,
  formData: FormData,
): Promise<RepActionState> {
  const { user } = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const code = normalizeCode(formData.get("code"));
  if (!name) return { error: "Give the Rep a name." };
  if (!code) return { error: "Give the Rep a code — letters and numbers, e.g. RACHELI." };

  const db = await getWritableDb();
  const { error } = await db.from("affiliates").insert({
    name,
    code,
    email: String(formData.get("email") ?? "").trim() || null,
    contact: String(formData.get("contact") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    rate_basic_cents: parseCents(formData.get("rateBasic"), 500),
    rate_premium_cents: parseCents(formData.get("ratePremium"), 1000),
    created_by: user.id,
  });

  if (error) {
    // 23505 = unique violation, which here always means the code is taken.
    if (error.code === "23505") {
      return { error: `The code ${code} is already used by another Rep. Pick a different one.` };
    }
    return { error: `Could not save the Rep: ${error.message}` };
  }

  revalidatePath("/admin/reps");
  return { success: `${name} added — their link uses the code ${code}.` };
}

export async function setRepStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("repId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["active", "paused"].includes(status)) return;

  const db = await getWritableDb();
  const { error } = await db.from("affiliates").update({ status }).eq("id", id);
  if (error) throw new Error(`Could not change the Rep's status: ${error.message}`);
  revalidatePath("/admin/reps");
}

export async function recordRepPaymentAction(formData: FormData) {
  const { user } = await requireAdmin();
  const affiliateId = String(formData.get("repId") ?? "");
  const amountCents = parseCents(formData.get("amountUsd"), 0);
  if (!affiliateId || amountCents <= 0) return;

  const db = await getWritableDb();
  // A payment that silently fails to record is the worst of these to lose —
  // the money has left and nothing says it did.
  const { error } = await db.from("affiliate_payments").insert({
    affiliate_id: affiliateId,
    amount_cents: amountCents,
    method: String(formData.get("method") ?? "").trim() || null,
    reference: String(formData.get("reference") ?? "").trim() || null,
    created_by: user.id,
  });
  if (error) throw new Error(`Could not record the payment: ${error.message}`);

  revalidatePath("/admin/reps");
}
