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

  const apiUrl = process.env.ANNATEL_API_URL ?? 'https://business-manager.annatel.io/api';
  const apiKey = process.env.ANNATEL_API_KEY ?? '';
  const tenantId = process.env.ANNATEL_TENANT_ID ?? '';
  const webhookSecret = process.env.ANNATEL_WEBHOOK_SECRET ?? '';

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
