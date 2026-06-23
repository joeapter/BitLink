"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function generateOrgCode(): string {
  return `ORG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function createOrganizationAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "other");
  const contactName = String(formData.get("contactName") ?? "").trim() || null;
  const contactEmail = String(formData.get("contactEmail") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) redirect("/admin/organizations/new?error=Name+is+required");

  const admin = createSupabaseAdminClient();
  if (!admin) redirect("/admin/organizations/new?error=Database+unavailable");

  const { error } = await admin.from("organizations").insert({
    name,
    type,
    referral_code: generateOrgCode(),
    contact_name: contactName,
    contact_email: contactEmail,
    notes,
    active: true,
  });

  if (error) {
    redirect(`/admin/organizations/new?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin/organizations");
}

export async function updateOrganizationAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "other");
  const contactName = String(formData.get("contactName") ?? "").trim() || null;
  const contactEmail = String(formData.get("contactEmail") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const active = formData.get("active") === "true";

  if (!id || !name) redirect(`/admin/organizations/${id}?error=Invalid+data`);

  const admin = createSupabaseAdminClient();
  if (!admin) redirect(`/admin/organizations/${id}?error=Database+unavailable`);

  const { error } = await admin
    .from("organizations")
    .update({ name, type, contact_name: contactName, contact_email: contactEmail, notes, active })
    .eq("id", id);

  if (error) {
    redirect(`/admin/organizations/${id}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/admin/organizations/${id}?success=Saved`);
}
