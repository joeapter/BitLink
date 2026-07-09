// Durable Inngest function for async line provisioning.
//
// Flow:
//   0. If the job carries a future next_retry_at (set by an explicit admin
//      retry's exponential backoff), sleep until that moment first — this is
//      what makes the "Scheduled" time shown in admin an honest promise
//      instead of a value that's overwritten within milliseconds.
//   1. process-job: PENDING → SUBMITTED → SYNCING → (COMPLETED if sync provider)
//   2. If SYNCING (async provider): sleep 30s then poll provider once
//      The reconcile cron picks up anything still stuck after that.
//
// Concurrency key on jobId prevents duplicate executions for the same job.
// Retries (3×) handle transient provider errors; each step.run is memoized.

import { inngest } from '@/inngest/client';
import { logger } from '@/lib/logger';
import { processProvisioningJob, reconcileJob } from '@/lib/provisioning/orchestrator';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const log = logger.child({ fn: 'provision-line' });

export const provisionLine = inngest.createFunction(
  {
    id: 'provision-line',
    retries: 3,
    concurrency: {
      limit: 1,
      key: 'event.data.jobId',
    },
  },
  { event: 'provisioning/line.create' },
  async ({ event, step }) => {
    const { jobId } = event.data as { jobId: string };
    log.info({ jobId }, 'Provisioning job picked up');

    const scheduledFor = await step.run('check-schedule', async () => {
      const admin = createSupabaseAdminClient();
      if (!admin) return null;
      const { data } = await admin
        .from('provisioning_jobs')
        .select('status, next_retry_at')
        .eq('id', jobId)
        .maybeSingle();
      if (data?.status !== 'pending' || !data.next_retry_at) return null;
      return new Date(data.next_retry_at).getTime() > Date.now() ? data.next_retry_at : null;
    });

    if (scheduledFor) {
      log.info({ jobId, scheduledFor }, 'Honoring retry backoff — sleeping until scheduled time');
      await step.sleepUntil('respect-retry-backoff', scheduledFor);
    }

    const result = await step.run('process-job', async () => {
      return processProvisioningJob(jobId);
    });

    if (result.skipped) {
      log.info({ jobId, status: result.status }, 'Job already processed — skipping');
      return { jobId, skipped: true, status: result.status };
    }

    // Async provider: wait then poll; reconcile cron handles anything still stuck
    if (result.status === 'SYNCING') {
      log.info({ jobId, providerJobId: result.providerJobId }, 'Waiting for async provider');
      await step.sleep('wait-for-provider', '30s');

      const reconcileResult = await step.run('reconcile-job', async () => {
        return reconcileJob(jobId);
      });

      log.info({ jobId, status: reconcileResult.status }, 'Post-sleep reconcile complete');
      return { jobId, ...reconcileResult };
    }

    log.info({ jobId, status: result.status }, 'Provision complete');

    // provisioning/line.completed is dispatched from completeJob() in the
    // orchestrator — the single choke point shared by this path, the
    // reconcile cron, and the Annatel webhook.

    return { jobId, ...result };
  },
);
