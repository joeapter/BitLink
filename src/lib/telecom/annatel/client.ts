// Annatel HTTP client with automatic provider_sync_logs recording.
// Every outbound call is logged regardless of success/failure —
// this is the audit trail for all provider interactions.
//
// Correlation context (correlationId, provisioningJobId, telecomLineId) is read
// from AsyncLocalStorage set by withProviderContext() in the orchestrator.
// Auth headers are redacted before persistence.

import { logger } from '@/lib/logger';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getProviderContext, redactHeaders } from '@/lib/telecom/provider-context';

const log = logger.child({ module: 'annatel-client' });

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

interface LogCallData {
  url: string;
  method: string;
  path: string;
  requestHeaders: Record<string, string>;
  requestBody: unknown;
  responseBody: unknown;
  responseHeaders: Record<string, string>;
  httpStatus: number;
  durationMs: number;
  succeeded: boolean;
  error: string | null;
}

export class AnnatelApiError extends Error {
  constructor(
    public readonly httpStatus: number,
    public readonly path: string,
    public readonly responseBody: unknown,
  ) {
    super(`Annatel API error ${httpStatus} on ${path}`);
    this.name = 'AnnatelApiError';
  }
}

export class AnnatelApiClient {
  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string,
    private readonly tenantId: string,
  ) {}

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers: extraHeaders = {} } = options;
    const url = `${this.apiUrl}${path}`;
    const start = Date.now();

    const outgoingHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      ...(this.tenantId ? { 'X-Tenant-Id': this.tenantId } : {}),
      ...extraHeaders,
    };

    let responseBody: unknown = null;
    let httpStatus = 0;
    const responseHeaders: Record<string, string> = {};

    try {
      const response = await fetch(url, {
        method,
        headers: outgoingHeaders,
        body: body != null ? JSON.stringify(body) : undefined,
      });

      httpStatus = response.status;
      responseBody = await response.json().catch(() => null);
      response.headers.forEach((value, key) => { responseHeaders[key] = value; });

      const duration = Date.now() - start;

      await this.logCall({
        url,
        method,
        path,
        requestHeaders: outgoingHeaders,
        requestBody: body ?? null,
        responseBody,
        responseHeaders,
        httpStatus,
        durationMs: duration,
        succeeded: response.ok,
        error: response.ok ? null : `HTTP ${response.status}`,
      });

      if (!response.ok) {
        log.error({ path, method, status: httpStatus, duration }, 'Annatel API error');
        throw new AnnatelApiError(httpStatus, path, responseBody);
      }

      log.info({ path, method, status: httpStatus, duration }, 'Annatel API call succeeded');
      return responseBody as T;
    } catch (err) {
      if (err instanceof AnnatelApiError) throw err;

      const duration = Date.now() - start;
      const message = err instanceof Error ? err.message : 'network error';
      await this.logCall({
        url,
        method,
        path,
        requestHeaders: outgoingHeaders,
        requestBody: body ?? null,
        responseBody: null,
        responseHeaders: {},
        httpStatus: 0,
        durationMs: duration,
        succeeded: false,
        error: message,
      });
      log.error({ path, method, error: message }, 'Annatel API network error');
      throw err;
    }
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body });
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body });
  }

  private async logCall(data: LogCallData): Promise<void> {
    try {
      const admin = createSupabaseAdminClient();
      if (!admin) return;

      const ctx = getProviderContext();

      await admin.from('provider_sync_logs').insert({
        provider_id: 'annatel',
        operation: `${data.method} ${data.path}`,
        request_url: data.url,
        request_method: data.method,
        request_headers: redactHeaders(data.requestHeaders) as never,
        request_payload: data.requestBody as never,
        response_payload: data.responseBody as never,
        response_headers: redactHeaders(data.responseHeaders) as never,
        http_status: data.httpStatus || null,
        duration_ms: data.durationMs,
        succeeded: data.succeeded,
        error: data.error,
        correlation_id: ctx?.correlationId ?? null,
        telecom_line_id: ctx?.telecomLineId ?? null,
        provisioning_job_id: ctx?.provisioningJobId ?? null,
      });
    } catch {
      // Logging failure must never break the main request flow.
    }
  }
}
