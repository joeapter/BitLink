// Admin: get a single provisioning job by ID.
// Used to poll job status after POST /api/admin/lines.

import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const log = logger.child({ route: 'admin/jobs/[id]' });

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const { id } = await params;

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return Response.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const { data, error } = await admin
    .from('provisioning_jobs')
    .select(
      `id, line_id, provider_job_id, idempotency_key, type, status,
       attempt_count, max_attempts, payload, result, error,
       next_retry_at, status_transitions, created_at, updated_at, completed_at`,
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    log.warn({ jobId: id, error: error?.message }, 'Job not found');
    return Response.json({ error: 'Job not found' }, { status: 404 });
  }

  return Response.json({ data });
}
