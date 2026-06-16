// Durable Inngest function for async line provisioning.
//
// Flow:
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

    // Fire notification event if line successfully provisioned
    if (result.status === 'COMPLETED') {
      try {
        const admin = createSupabaseAdminClient();
        if (admin) {
          const { data: job } = await admin
            .from('provisioning_jobs')
            .select('line_id, provider_job_id')
            .eq('id', jobId)
            .single();

          if (job?.line_id) {
            const { data: line } = await admin
              .from('telecom_lines')
              .select('provider_line_id')
              .eq('id', job.line_id)
              .single();

            if (line?.provider_line_id) {
              await inngest.send({
                name: 'provisioning/line.completed',
                data: { lineId: job.line_id, providerLineId: line.provider_line_id, jobId },
              });
            }
          }
        }
      } catch (err) {
        log.warn({ error: String(err) }, 'Failed to dispatch provisioning/line.completed');
      }
    }

    return { jobId, ...result };
  },
);
