// Inngest cron: daily sweep of active trials — sends the pick-a-plan
// reminder around day 21, a final charge warning ~2 days before the
// deadline, and auto-continues on Basic (real charge) at the deadline by
// default, falling back to a freeze only if that charge fails. Runs
// regardless of the trial-offer kill switch — trials already in flight
// finish on their own terms either way.

import { inngest } from '@/inngest/client';
import { logger } from '@/lib/logger';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { processTrialLifecycle } from '@/lib/trial-offer';

const log = logger.child({ fn: 'trial-offer-lifecycle' });

export const trialOfferLifecycleCron = inngest.createFunction(
  { id: 'trial-offer-lifecycle' },
  { cron: 'TZ=UTC 0 8 * * *' },
  async ({ step }) => {
    const result = await step.run('sweep', async () => {
      const admin = createSupabaseAdminClient();
      if (!admin) return { reminded: 0, finalWarned: 0, autoContinued: 0, autoContinueFailed: 0 };
      return processTrialLifecycle(admin);
    });
    log.info(result, 'Trial offer lifecycle sweep complete');
    return result;
  },
);
