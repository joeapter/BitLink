// What is actually deployed right now.
//
// Exists because "the build went green" and "the change is live on the domain"
// are different claims, and confusing them once cost a day of debugging the
// wrong thing (2026-08-25: a duplicate Vercel project meant deployment ages
// were misread and a shipped fix was reported as not shipped). Rather than
// reason about dashboards, projects, and deployment ages, ask the site.
//
//   curl -s https://www.bitlink.co.il/api/version
//
// Compare `commit` against `git rev-parse HEAD`. If they match, what's in the
// working tree is what customers are running. If they don't, the deploy hasn't
// landed yet — no inference required.
//
// Public on purpose: it exposes a commit SHA and nothing else. No secrets, no
// customer data, no configuration values — only whether flags are present, so
// a missing env var is diagnosable without ever revealing what it contains.

export const dynamic = 'force-dynamic';

export function GET(): Response {
  const body = {
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local',
    commitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null,
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    deployedAt: process.env.VERCEL_DEPLOYMENT_ID ? undefined : null,
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    environment: process.env.VERCEL_ENV ?? 'development',
    // Presence only — never the values. Lets a misconfigured deploy be spotted
    // from outside without leaking anything.
    config: {
      stripe: Boolean(process.env.STRIPE_SECRET_KEY),
      stripeWebhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      annatel: Boolean(process.env.ANNATEL_API_KEY),
      supabase: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      kosherPlusPromoCoupon: Boolean(process.env.STRIPE_COUPON_KOSHER_PLUS_INTRO),
    },
  };
  return Response.json(body, {
    headers: { 'cache-control': 'no-store, max-age=0' },
  });
}
