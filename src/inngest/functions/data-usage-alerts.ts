// Data usage warning emails — runs 30 minutes after each 4-hourly CDR ingest
// so alerts follow fresh usage data. BitLink has no overage billing (data
// pauses at the cap), so the job's whole purpose is making sure that's never
// a surprise: 80% heads-up and 95% almost-out emails with the reset date and
// self-serve topup options. Idempotent per line/month/level (see
// lib/usage-alerts.ts).

import { inngest } from "@/inngest/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { processDataUsageAlerts } from "@/lib/usage-alerts";
import { logger } from "@/lib/logger";

const log = logger.child({ fn: "data-usage-alerts" });

export const dataUsageAlertsCron = inngest.createFunction(
  { id: "data-usage-alerts" },
  { cron: "TZ=UTC 30 */4 * * *" },
  async ({ step }) => {
    const result = await step.run("process-data-usage-alerts", async () => {
      const admin = createSupabaseAdminClient();
      if (!admin) return { skipped: true, reason: "no_admin_client" };
      return processDataUsageAlerts(admin);
    });

    log.info(result, "Data usage alert run complete");
    return result;
  },
);
