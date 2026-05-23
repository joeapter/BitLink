import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ProvisioningJob,
  ProvisioningJobStatus,
  StatusTransition,
} from '@/lib/provisioning/state-machines/provisioning-job';

function rowToJob(row: Record<string, unknown>): ProvisioningJob {
  return {
    id: row.id as string,
    line_id: (row.line_id ?? null) as string | null,
    provider_job_id: (row.provider_job_id ?? null) as string | null,
    idempotency_key: row.idempotency_key as string,
    type: row.type as string,
    status: (row.status as string).toUpperCase() as ProvisioningJobStatus,
    attempt_count: (row.attempt_count as number) ?? 0,
    max_attempts: (row.max_attempts as number) ?? 3,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    result: (row.result ?? null) as Record<string, unknown> | null,
    error: (row.error ?? null) as string | null,
    next_retry_at: (row.next_retry_at ?? null) as string | null,
    status_transitions: ((row.status_transitions as unknown) ?? []) as StatusTransition[],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    completed_at: (row.completed_at ?? null) as string | null,
    created_by: (row.created_by ?? null) as string | null,
  };
}

export async function getJob(
  admin: SupabaseClient,
  id: string,
): Promise<ProvisioningJob | null> {
  const { data, error } = await admin
    .from('provisioning_jobs')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return rowToJob(data as unknown as Record<string, unknown>);
}

export interface CreateJobInput {
  lineId: string;
  type: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  maxAttempts?: number;
  createdBy?: string | null;
}

export async function createJob(
  admin: SupabaseClient,
  input: CreateJobInput,
): Promise<ProvisioningJob> {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('provisioning_jobs')
    .insert({
      line_id: input.lineId,
      type: input.type,
      payload: input.payload as never,
      idempotency_key: input.idempotencyKey,
      status: 'pending',
      attempt_count: 0,
      max_attempts: input.maxAttempts ?? 3,
      created_by: input.createdBy ?? null,
      status_transitions: [{ status: 'pending', transitioned_at: now }] as never,
    })
    .select('*')
    .single();
  if (error || !data) {
    throw new Error(`Failed to create provisioning job: ${error?.message ?? 'no data returned'}`);
  }
  return rowToJob(data as unknown as Record<string, unknown>);
}

export async function updateJob(
  admin: SupabaseClient,
  id: string,
  updates: {
    status?: string;
    status_transitions?: StatusTransition[];
    provider_job_id?: string | null;
    result?: Record<string, unknown> | null;
    error?: string | null;
    attempt_count?: number;
    next_retry_at?: string | null;
    completed_at?: string | null;
    updated_at?: string;
  },
): Promise<void> {
  const patch: Record<string, unknown> = {
    updated_at: updates.updated_at ?? new Date().toISOString(),
  };
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.status_transitions !== undefined) {
    patch.status_transitions = updates.status_transitions as never;
  }
  if ('provider_job_id' in updates) patch.provider_job_id = updates.provider_job_id;
  if ('result' in updates) patch.result = updates.result as never;
  if ('error' in updates) patch.error = updates.error;
  if (updates.attempt_count !== undefined) patch.attempt_count = updates.attempt_count;
  if ('next_retry_at' in updates) patch.next_retry_at = updates.next_retry_at;
  if ('completed_at' in updates) patch.completed_at = updates.completed_at;

  const { error } = await admin
    .from('provisioning_jobs')
    .update(patch as never)
    .eq('id', id);
  if (error) throw new Error(`Failed to update job ${id}: ${error.message}`);
}

export async function getStaleJobs(
  admin: SupabaseClient,
  olderThanMinutes: number,
): Promise<ProvisioningJob[]> {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from('provisioning_jobs')
    .select('*')
    .in('status', ['submitted', 'syncing'])
    .lt('updated_at', cutoff)
    .limit(50);
  if (error) throw new Error(`Failed to fetch stale jobs: ${error.message}`);
  return (data ?? []).map((row) => rowToJob(row as unknown as Record<string, unknown>));
}
