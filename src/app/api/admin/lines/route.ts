// Admin: list and create telecom lines.
// Auth: admin role required (profiles table).
//
// POST behaviour:
//   1. Validate body with Zod
//   2. Insert telecom_lines (status=draft)
//   3. Insert provisioning_jobs (status=pending, type=create_line)
//   4. If TELECOM_PROVIDER=mock: process job synchronously and return final state
//      Otherwise: fire Inngest event and return immediately — job processes async

import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { inngest } from '@/inngest/client';
import { logger } from '@/lib/logger';
import {
  createProvisioningJob,
  processProvisioningJob,
} from '@/lib/provisioning/orchestrator';

export const dynamic = 'force-dynamic';

const log = logger.child({ route: 'admin/lines' });

// ----------------------------------------------------------------
// GET — list lines
// ----------------------------------------------------------------

export async function GET(request: NextRequest): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 200);

  let query = supabase
    .from('telecom_lines')
    .select(
      `id, provider_id, provider_line_id, external_id, customer_id,
       status, is_kosher, language, created_at, updated_at`,
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    log.error({ error: error.message }, 'Failed to list telecom lines');
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data });
}

// ----------------------------------------------------------------
// POST — create line + provisioning job
// ----------------------------------------------------------------

const CreateLineSchema = z.object({
  customerId: z.string().uuid().optional(),
  planName: z.string().min(1, 'planName is required'),
  iccId: z.string().min(18).max(22).optional(),
  isKosher: z.boolean().default(false),
  language: z.string().default('he_IL'),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(request: NextRequest): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const { user } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = CreateLineSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { customerId, planName, iccId, isKosher, language, metadata } = parsed.data;

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return Response.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const externalId = crypto.randomUUID();

  // ── 1. Create line in draft ─────────────────────────────────────
  const { data: line, error: lineError } = await admin
    .from('telecom_lines')
    .insert({
      external_id: externalId,
      customer_id: customerId ?? null,
      status: 'draft',
      is_kosher: isKosher,
      language,
      metadata: metadata as never,
      created_by: user.id,
      status_transitions: [
        { status: 'draft', transitioned_at: new Date().toISOString() },
      ] as never,
    })
    .select('id, external_id, status, is_kosher, language, created_at')
    .single();

  if (lineError || !line) {
    log.error({ error: lineError?.message }, 'Failed to create telecom line');
    return Response.json({ error: 'Failed to create line' }, { status: 500 });
  }

  // ── 2. Create provisioning job — rollback line on failure ──────
  let job;
  try {
    job = await createProvisioningJob({
      lineId: line.id,
      type: 'create_line',
      payload: { externalId, planName, iccId, isKosher, metadata },
      createdBy: user.id,
    });
  } catch (err) {
    // Clean up the orphaned draft line so the DB doesn't accumulate ghost records.
    await admin.from('telecom_lines').delete().eq('id', line.id);
    log.error(
      { lineId: line.id, error: err instanceof Error ? err.message : String(err) },
      'Failed to create provisioning job — rolled back draft line',
    );
    return Response.json({ error: 'Failed to create provisioning job' }, { status: 500 });
  }

  // ── 3. Execute ──────────────────────────────────────────────────
  // Mock/test: process synchronously for immediate dev feedback.
  // Real provider: fire Inngest and return — job processes asynchronously.
  const isMock =
    process.env.TELECOM_PROVIDER === 'mock' || process.env.NODE_ENV === 'test';

  let finalJob = job;

  if (isMock) {
    try {
      await processProvisioningJob(job.id);
      // Re-fetch the updated job to return accurate state
      const { data: updatedRow } = await admin
        .from('provisioning_jobs')
        .select('id, status, provider_job_id, attempt_count, completed_at, error')
        .eq('id', job.id)
        .single();
      if (updatedRow) {
        finalJob = {
          ...job,
          status: (updatedRow.status as string).toUpperCase() as typeof job.status,
          provider_job_id: (updatedRow.provider_job_id as string | null) ?? null,
          attempt_count: updatedRow.attempt_count as number,
          completed_at: (updatedRow.completed_at as string | null) ?? null,
          error: (updatedRow.error as string | null) ?? null,
        };
      }
    } catch (err) {
      log.warn(
        { jobId: job.id, error: err instanceof Error ? err.message : String(err) },
        'Sync provisioning failed — job will retry',
      );
    }
  } else {
    try {
      await inngest.send({ name: 'provisioning/line.create', data: { jobId: job.id } });
    } catch (err) {
      log.warn(
        { jobId: job.id, error: err instanceof Error ? err.message : String(err) },
        'Failed to enqueue Inngest event — reconcile cron will recover',
      );
    }
  }

  // Re-fetch line for latest status
  const { data: finalLine } = await admin
    .from('telecom_lines')
    .select('id, external_id, status, provider_line_id, is_kosher, language, created_at, updated_at')
    .eq('id', line.id)
    .single();

  log.info(
    { lineId: line.id, jobId: job.id, externalId, jobStatus: finalJob.status },
    'Line creation request complete',
  );

  return Response.json(
    {
      data: {
        line: finalLine ?? line,
        job: {
          id: finalJob.id,
          status: finalJob.status,
          type: finalJob.type,
          provider_job_id: finalJob.provider_job_id,
          attempt_count: finalJob.attempt_count,
          completed_at: finalJob.completed_at,
          error: finalJob.error,
        },
      },
    },
    { status: 201 },
  );
}
