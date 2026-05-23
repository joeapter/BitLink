// Annatel HTTP client with automatic provider_sync_logs recording.
// Every outbound call is logged regardless of success/failure —
// this is the audit trail for all provider interactions.

import { logger } from '@/lib/logger';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const log = logger.child({ module: 'annatel-client' });

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
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
    const { method = 'GET', body, headers = {} } = options;
    const url = `${this.apiUrl}${path}`;
    const start = Date.now();
    let responseBody: unknown = null;
    let httpStatus = 0;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'X-Tenant-Id': this.tenantId,
          ...headers,
        },
        body: body != null ? JSON.stringify(body) : undefined,
      });

      httpStatus = response.status;
      responseBody = await response.json().catch(() => null);
      const duration = Date.now() - start;

      await this.logCall({
        operation: `${method} ${path}`,
        requestPayload: body ?? null,
        responsePayload: responseBody,
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
        operation: `${method} ${path}`,
        requestPayload: body ?? null,
        responsePayload: null,
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

  private async logCall(data: {
    operation: string;
    requestPayload: unknown;
    responsePayload: unknown;
    httpStatus: number;
    durationMs: number;
    succeeded: boolean;
    error: string | null;
  }): Promise<void> {
    try {
      const admin = createSupabaseAdminClient();
      if (!admin) return;
      await admin.from('provider_sync_logs').insert({
        provider_id: 'annatel',
        operation: data.operation,
        request_payload: data.requestPayload as never,
        response_payload: data.responsePayload as never,
        http_status: data.httpStatus || null,
        duration_ms: data.durationMs,
        succeeded: data.succeeded,
        error: data.error,
      });
    } catch {
      // Logging failure must never break the main request flow.
    }
  }
}
