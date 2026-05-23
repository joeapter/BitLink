// Operational debugging queries for provider_sync_logs.
// Use these to diagnose provider failures, trace async job flows,
// and reconstruct exactly what was sent/received for any telecom interaction.

import type { SupabaseClient } from '@supabase/supabase-js';

export interface ProviderSyncLog {
  id: string;
  providerId: string;
  operation: string;
  requestUrl: string | null;
  requestMethod: string | null;
  requestHeaders: Record<string, string> | null;
  requestBody: unknown;
  responseBody: unknown;
  responseHeaders: Record<string, string> | null;
  httpStatus: number | null;
  durationMs: number | null;
  succeeded: boolean;
  error: string | null;
  correlationId: string | null;
  providerJobId: string | null;
  telecomLineId: string | null;
  provisioningJobId: string | null;
  createdAt: string;
}

function rowToLog(row: Record<string, unknown>): ProviderSyncLog {
  return {
    id: row.id as string,
    providerId: row.provider_id as string,
    operation: row.operation as string,
    requestUrl: (row.request_url ?? null) as string | null,
    requestMethod: (row.request_method ?? null) as string | null,
    requestHeaders: (row.request_headers ?? null) as Record<string, string> | null,
    requestBody: row.request_payload ?? null,
    responseBody: row.response_payload ?? null,
    responseHeaders: (row.response_headers ?? null) as Record<string, string> | null,
    httpStatus: (row.http_status ?? null) as number | null,
    durationMs: (row.duration_ms ?? null) as number | null,
    succeeded: row.succeeded as boolean,
    error: (row.error ?? null) as string | null,
    correlationId: (row.correlation_id ?? null) as string | null,
    providerJobId: (row.provider_job_id ?? null) as string | null,
    telecomLineId: (row.telecom_line_id ?? null) as string | null,
    provisioningJobId: (row.provisioning_job_id ?? null) as string | null,
    createdAt: row.created_at as string,
  };
}

/** All provider HTTP calls made while processing a provisioning job. */
export async function getLogsByProvisioningJob(
  admin: SupabaseClient,
  provisioningJobId: string,
  limit = 50,
): Promise<ProviderSyncLog[]> {
  const { data, error } = await admin
    .from('provider_sync_logs')
    .select('*')
    .eq('provisioning_job_id', provisioningJobId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw new Error(`Failed to fetch logs by provisioning job: ${error.message}`);
  return (data ?? []).map((row) => rowToLog(row as unknown as Record<string, unknown>));
}

/** All provider HTTP calls for a specific provider-side job ID (e.g. Annatel bur_...). */
export async function getLogsByProviderJob(
  admin: SupabaseClient,
  providerJobId: string,
): Promise<ProviderSyncLog[]> {
  const { data, error } = await admin
    .from('provider_sync_logs')
    .select('*')
    .eq('provider_job_id', providerJobId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Failed to fetch logs by provider job: ${error.message}`);
  return (data ?? []).map((row) => rowToLog(row as unknown as Record<string, unknown>));
}

/** Full history of provider HTTP calls for a telecom line, newest first. */
export async function getLogsByTelecomLine(
  admin: SupabaseClient,
  telecomLineId: string,
  limit = 100,
): Promise<ProviderSyncLog[]> {
  const { data, error } = await admin
    .from('provider_sync_logs')
    .select('*')
    .eq('telecom_line_id', telecomLineId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to fetch logs by telecom line: ${error.message}`);
  return (data ?? []).map((row) => rowToLog(row as unknown as Record<string, unknown>));
}

/** All HTTP calls within a single orchestrator operation (same correlationId). */
export async function getLogsByCorrelation(
  admin: SupabaseClient,
  correlationId: string,
): Promise<ProviderSyncLog[]> {
  const { data, error } = await admin
    .from('provider_sync_logs')
    .select('*')
    .eq('correlation_id', correlationId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Failed to fetch logs by correlation: ${error.message}`);
  return (data ?? []).map((row) => rowToLog(row as unknown as Record<string, unknown>));
}

/** Recent provider failures — for support triage and on-call debugging. */
export async function getRecentFailures(
  admin: SupabaseClient,
  options: { providerId?: string; limit?: number } = {},
): Promise<ProviderSyncLog[]> {
  let query = admin
    .from('provider_sync_logs')
    .select('*')
    .eq('succeeded', false)
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (options.providerId) {
    query = query.eq('provider_id', options.providerId);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch recent failures: ${error.message}`);
  return (data ?? []).map((row) => rowToLog(row as unknown as Record<string, unknown>));
}
