// Monthly recurring topup grants (admin-gifted or admin-arranged, free or
// paid — see grant-topup.ts). Idempotent by (grant, month); runs daily so a
// grant created mid-month is applied the same day rather than waiting.

import { inngest } from "@/inngest/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { processMonthlyTopupGrants } from "@/lib/topups/grant-topup";
import { logger } from "@/lib/logger";

const log = logger.child({ fn: "topup-grants" });

export const topupGrantsCron = inngest.createFunction(
  { id: "topup-grants-monthly" },
  { cron: "30 5 * * *" },
  async ({ step }) => {
    const result = await step.run("process-monthly-topup-grants", async () => {
      const admin = createSupabaseAdminClient();
      if (!admin) return { skipped: true, reason: "no_admin_client" };
      return processMonthlyTopupGrants(admin);
    });

    log.info(result, "Monthly topup grant run complete");
    return result;
  },
);
