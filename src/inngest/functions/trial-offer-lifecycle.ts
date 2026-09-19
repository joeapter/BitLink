// Inngest cron: daily sweep of active trials — sends the pick-a-plan
// reminder around day 21, a final charge warning ~2 days before the
// deadline, and auto-continues on Basic (real charge) at the deadline by
// default. A declined charge starts the retry ladder (card retried every
// 2 days for a month, one warning, then termination), which this same
// daily sweep drives. Runs regardless of the trial-offer kill switch —
// trials already in flight finish on their own terms either way.
//
// Daily is the right cadence even though the retry interval is 2 days: the
// ladder is driven by dates on the row, not by how often the sweep runs, so a
// daily pass simply picks up whatever has come due.

import { inngest } from '@/inngest/client';
import { logger } from '@/lib/logger';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { processTrialLifecycle, type TrialLifecycleResult } from '@/lib/trial-offer';

const log = logger.child({ fn: 'trial-offer-lifecycle' });

const NOTHING_DONE: TrialLifecycleResult = {
  reminded: 0,
  finalWarned: 0,
  autoContinued: 0,
  autoContinueFailed: 0,
  strandedClosed: 0,
  retried: 0,
  recovered: 0,
  frozen: 0,
  terminationWarned: 0,
  terminated: 0,
};

export const trialOfferLifecycleCron = inngest.createFunction(
  { id: 'trial-offer-lifecycle' },
  { cron: 'TZ=UTC 0 8 * * *' },
  async ({ step }) => {
    const result = await step.run('sweep', async () => {
      const admin = createSupabaseAdminClient();
      if (!admin) return NOTHING_DONE;
      return processTrialLifecycle(admin);
    });
    log.info(result, 'Trial offer lifecycle sweep complete');
    return result;
  },
);
