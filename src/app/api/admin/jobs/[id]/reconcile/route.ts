// Admin: manually trigger reconciliation for a single provisioning job.
// Useful when a webhook was missed and the cron hasn't run yet.

import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { reconcileJob } from '@/lib/provisioning/orchestrator';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const log = logger.child({ route: 'admin/jobs/[id]/reconcile' });

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const { id } = await params;

  let result;
  try {
    result = await reconcileJob(id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error({ jobId: id, error: msg }, 'Reconcile failed');
    return Response.json({ error: msg }, { status: 500 });
  }

  log.info({ jobId: id, result }, 'Manual reconcile complete');
  return Response.json({ data: result });
}
