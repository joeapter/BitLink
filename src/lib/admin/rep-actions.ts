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

export async function createRepAction(formData: FormData) {
  const { user } = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const code = normalizeCode(formData.get("code"));
  if (!name || !code) return;

  const db = await getWritableDb();
  await db.from("affiliates").insert({
    name,
    code,
    email: String(formData.get("email") ?? "").trim() || null,
    contact: String(formData.get("contact") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    rate_basic_cents: parseCents(formData.get("rateBasic"), 500),
    rate_premium_cents: parseCents(formData.get("ratePremium"), 1000),
    created_by: user.id,
  });

  revalidatePath("/admin/reps");
}

export async function setRepStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("repId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["active", "paused"].includes(status)) return;

  const db = await getWritableDb();
  await db.from("affiliates").update({ status }).eq("id", id);
  revalidatePath("/admin/reps");
}

export async function recordRepPaymentAction(formData: FormData) {
  const { user } = await requireAdmin();
  const affiliateId = String(formData.get("repId") ?? "");
  const amountCents = parseCents(formData.get("amountUsd"), 0);
  if (!affiliateId || amountCents <= 0) return;

  const db = await getWritableDb();
  await db.from("affiliate_payments").insert({
    affiliate_id: affiliateId,
    amount_cents: amountCents,
    method: String(formData.get("method") ?? "").trim() || null,
    reference: String(formData.get("reference") ?? "").trim() || null,
    created_by: user.id,
  });

  revalidatePath("/admin/reps");
}
