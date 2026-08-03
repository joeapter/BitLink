"use server";

import { revalidatePath } from "next/cache";
import { setTrialOfferEnabled } from "@/lib/settings";

// Fixed list of pages carrying trial-offer promo copy — kept in sync with
// wherever <TrialOfferPromo> is actually placed. Revalidating just these
// (rather than a full redeploy) is what makes the kill switch instant even
// though those pages are otherwise statically generated.
const TRIAL_PROMO_PATHS = [
  "/trial",
  "/plans",
  "/israeli-phone-plans-for-students",
  "/israeli-phone-plans-for-olim",
  "/guides/gap-year-israel-phone-plan",
  "/guides/gap-year-israel-first-two-weeks",
];

export async function setTrialOfferEnabledAction(formData: FormData) {
  const enabled = formData.get("enabled") === "true";
  await setTrialOfferEnabled(enabled);
  for (const path of TRIAL_PROMO_PATHS) {
    revalidatePath(path);
  }
  revalidatePath("/admin/settings");
}
