// Centralized env config. Values are read lazily (at call time, not import time)
// so Next.js doesn't throw during build when optional vars are missing.
// Server-side only — do not import from client components.

function get(key: string, fallback?: string): string {
  const val = process.env[key];
  if (val !== undefined && val !== '') return val;
  if (fallback !== undefined) return fallback;
  return '';
}

function require(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

export const config = {
  get supabase() {
    return {
      url: get('NEXT_PUBLIC_SUPABASE_URL'),
      anonKey: get('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      serviceRoleKey: get('SUPABASE_SERVICE_ROLE_KEY'),
    };
  },
  get stripe() {
    return {
      secretKey: get('STRIPE_SECRET_KEY'),
      webhookSecret: get('STRIPE_WEBHOOK_SECRET'),
    };
  },
  get annatel() {
    return {
      apiUrl: get('ANNATEL_API_URL', 'https://business-manager.annatel.io/api'),
      apiKey: get('ANNATEL_API_KEY'),
      tenantId: get('ANNATEL_TENANT_ID'),
      webhookSecret: get('ANNATEL_WEBHOOK_SECRET'),
    };
  },
  get inngest() {
    return {
      eventKey: get('INNGEST_EVENT_KEY'),
      signingKey: get('INNGEST_SIGNING_KEY'),
    };
  },
  get sentry() {
    return {
      dsn: get('SENTRY_DSN'),
    };
  },
  get app() {
    return {
      siteUrl: get('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000'),
      nodeEnv: get('NODE_ENV', 'development'),
      isProduction: process.env.NODE_ENV === 'production',
      logLevel: get('LOG_LEVEL', 'info'),
      telecomProvider: get('TELECOM_PROVIDER', ''),
    };
  },
};

export { require as requireEnv };
