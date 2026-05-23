// Per-operation context for provider HTTP calls.
// Uses AsyncLocalStorage so context propagates through all awaits within a
// withProviderContext() callback — no method-signature threading required.
// Multiple HTTP calls inside one provider operation (e.g. reactivateLine: GET then DELETE)
// automatically share the same correlationId.

import { AsyncLocalStorage } from 'async_hooks';

export interface ProviderCallContext {
  /** UUID generated once per orchestrator operation; groups all HTTP calls in that operation. */
  correlationId: string;
  /** provisioning_jobs.id driving this call, if any. */
  provisioningJobId?: string;
  /** telecom_lines.id involved, if any. */
  telecomLineId?: string;
}

const _store = new AsyncLocalStorage<ProviderCallContext>();

export function withProviderContext<T>(
  ctx: ProviderCallContext,
  fn: () => Promise<T>,
): Promise<T> {
  return _store.run(ctx, fn);
}

export function getProviderContext(): ProviderCallContext | undefined {
  return _store.getStore();
}

// ── Sensitive header redaction ────────────────────────────────────────────────

const SENSITIVE_HEADERS = new Set([
  'authorization',
  'x-api-key',
  'x-auth-token',
  'x-secret',
  'cookie',
  'set-cookie',
  'proxy-authorization',
]);

export function redactHeaders(
  headers: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [
      k,
      SENSITIVE_HEADERS.has(k.toLowerCase()) ? '[redacted]' : v,
    ]),
  );
}
