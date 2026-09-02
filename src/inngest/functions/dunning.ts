// Inngest cron: daily failed-payment sweep — day-1 notice, day-7 warning,
// day-10 hold, and recovery detection for anyone who has since paid.
//
// 09:00 UTC (noon Israel) rather than the small hours: everything this sends
// asks the customer to go and pay something, and a billing email that lands at
// 3am reads as more alarming than it is. It also puts any failure in the log
// while someone is awake to see it.
//
// Idempotent by construction — each rung fires only when its dunning_* stamp
// is null — so a retry or a double-run cannot email anyone twice.

import { inngest } from '@/inngest/client';
import { logger } from '@/lib/logger';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { processDunning } from '@/lib/billing/dunning';

const log = logger.child({ fn: 'dunning' });

export const dunningCron = inngest.createFunction(
  { id: 'dunning-sweep' },
  { cron: 'TZ=UTC 0 9 * * *' },
  async ({ step }) => {
    const result = await step.run('sweep', async () => {
      const admin = createSupabaseAdminClient();
      if (!admin) return { notified: 0, warned: 0, suspended: 0, recovered: 0, skipped: 0 };
      return processDunning(admin);
    });
    log.info(result, 'Dunning sweep complete');
    return result;
  },
);
