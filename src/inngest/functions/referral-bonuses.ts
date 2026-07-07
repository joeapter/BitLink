// Monthly sales-rep referral data bonuses.
//
// Idempotent by (rep, beneficiary line, referred line, month). The job runs
// daily so a newly-active referred line can qualify during the same month,
// while already-applied grants are skipped.

import { inngest } from "@/inngest/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { processMonthlyReferralBonuses } from "@/lib/referral-service";
import { logger } from "@/lib/logger";

const log = logger.child({ fn: "referral-bonuses" });

export const referralBonusesCron = inngest.createFunction(
  { id: "referral-bonuses-monthly" },
  { cron: "15 5 * * *" },
  async ({ step }) => {
    const result = await step.run("process-monthly-referral-bonuses", async () => {
      const admin = createSupabaseAdminClient();
      if (!admin) return { skipped: true, reason: "no_admin_client" };
      return processMonthlyReferralBonuses(admin);
    });

    log.info(result, "Referral bonus run complete");
    return result;
  },
);
