// Generic app_settings key-value store. Currently backs the trial-offer kill
// switch — the one place a flag needs to change behavior instantly (new
// signups + on-page promo copy) without a redeploy.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const TRIAL_OFFER_KEY = "trial_offer_enabled";

export async function isTrialOfferEnabled(): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (!admin) return false;

  const { data } = await admin
    .from("app_settings")
    .select("value")
    .eq("key", TRIAL_OFFER_KEY)
    .maybeSingle();

  // Fail closed — if the setting is missing or unreadable, treat the offer
  // as off rather than silently signing people up for a program that can't
  // be confirmed as active.
  return data?.value === true;
}

export async function setTrialOfferEnabled(enabled: boolean, actorUserId?: string | null): Promise<void> {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin client unavailable");

  await admin.from("app_settings").upsert({
    key: TRIAL_OFFER_KEY,
    value: enabled,
    updated_at: new Date().toISOString(),
    updated_by: actorUserId ?? null,
  });
}
