// Provider registry — resolves the active TelecomProvider singleton.
// Business logic always calls getTelecomProvider() rather than instantiating
// a provider directly, so switching providers requires a single env var change.

import type { TelecomProvider } from './provider.interface';

let _provider: TelecomProvider | null = null;

export function getTelecomProvider(): TelecomProvider {
  if (_provider) return _provider;

  const useMock =
    process.env.NODE_ENV === 'test' || process.env.TELECOM_PROVIDER === 'mock';

  if (useMock) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MockTelecomProvider } = require('./mock/mock-provider') as {
      MockTelecomProvider: new () => TelecomProvider;
    };
    _provider = new MockTelecomProvider();
    return _provider;
  }

  // Dynamic requires keep the Annatel client out of the mock/test bundle.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { AnnatelApiClient } = require('./annatel/client') as {
    AnnatelApiClient: new (url: string, key: string, tenantId: string) => unknown;
  };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { AnnatelProvider } = require('./annatel/provider') as {
    AnnatelProvider: new (client: unknown, secret: string) => TelecomProvider;
  };

  // ANNATEL_API_URL currently arrives with a trailing newline, and every
  // request_url in provider_sync_logs has carried that newline ever since.
  // Live calls survive it only by luck: the WHATWG URL parser strips CR, LF
  // and tab from a URL, so fetch() quietly repairs it. A one-off script
  // reading the .env file with a naive parser gets the two-character sequence
  // "\n" instead, which is NOT stripped — it lands in the path and Annatel
  // answers 403, which reads exactly like a bad key (2026-09-19: an hour lost
  // to this). Normalising here fixes the logs too, and covers a trailing slash
  // while we are at it, since every caller supplies a leading one.
  const apiUrl = (process.env.ANNATEL_API_URL ?? 'https://business-manager.annatel.io')
    .replace(/\\n/g, '')
    .trim()
    .replace(/\/+$/, '');
  const apiKey = (process.env.ANNATEL_API_KEY ?? '').trim();
  const tenantId = (process.env.ANNATEL_TENANT_ID ?? '').trim();
  const webhookSecret = (process.env.ANNATEL_WEBHOOK_SECRET ?? '').trim();

  const client = new AnnatelApiClient(apiUrl, apiKey, tenantId);
  _provider = new AnnatelProvider(client, webhookSecret);
  return _provider;
}

/** Override the provider — useful in tests to inject a mock instance. */
export function setTelecomProvider(provider: TelecomProvider): void {
  _provider = provider;
}

/** Reset the singleton — useful between tests. */
export function resetTelecomProvider(): void {
  _provider = null;
}
