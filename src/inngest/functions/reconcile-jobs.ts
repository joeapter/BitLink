// Inngest cron: polls stale SUBMITTED/SYNCING jobs every 5 minutes.
// This is the safety net for async provider flows where webhooks are missed
// or the provision-line function's 30s poll wasn't enough.

import { inngest } from '@/inngest/client';
import { logger } from '@/lib/logger';
import { reconcileStaleJobs } from '@/lib/provisioning/orchestrator';

const log = logger.child({ fn: 'reconcile-stale-jobs' });

export const reconcileJobsCron = inngest.createFunction(
  { id: 'reconcile-stale-jobs' },
  { cron: '*/5 * * * *' },
  async ({ step }) => {
    const result = await step.run('reconcile', async () => {
      return reconcileStaleJobs();
    });
    log.info(result, 'Reconciliation run complete');
    return result;
  },
);
