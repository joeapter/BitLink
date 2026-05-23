// Admin: explicitly retry a FAILED provisioning job.
// Resets job to PENDING and re-enqueues via Inngest.
// Caller is responsible for exponential backoff via next_retry_at.

import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { retryProvisioningJob } from '@/lib/provisioning/orchestrator';
import { inngest } from '@/inngest/client';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const log = logger.child({ route: 'admin/jobs/[id]/retry' });

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const { id } = await params;

  let job;
  try {
    job = await retryProvisioningJob(id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn({ jobId: id, error: msg }, 'Retry rejected');
    return Response.json({ error: msg }, { status: 400 });
  }

  try {
    await inngest.send({ name: 'provisioning/line.create', data: { jobId: job.id } });
  } catch (err) {
    log.warn(
      { jobId: job.id, error: err instanceof Error ? err.message : String(err) },
      'Failed to enqueue retry — reconcile cron will recover',
    );
  }

  log.info({ jobId: job.id }, 'Job queued for retry');
  return Response.json({
    data: {
      id: job.id,
      status: job.status,
      attempt_count: job.attempt_count,
      next_retry_at: job.next_retry_at,
    },
  });
}
