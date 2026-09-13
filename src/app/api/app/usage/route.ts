import type { NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';
import { getCdrUsageBuckets } from '@/lib/cdr/usage';
import { logger } from '@/lib/logger';
import type { BalanceBucket } from '@/types/telecom';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Usage meters for the native app.
//
// This is the same two-step the portal's LineUsageMeter performs — live
// carrier balances first, CDR-derived buckets as the fallback — calling the
// same getCdrUsageBuckets(). The allowance maths (billing period, plan
// allowance, active topups folded in) is never reimplemented here, because the
// app showing a customer a different "remaining" figure than the website would
// be worse than showing none at all.
//
// One deliberate difference from the portal: the topup grants are read with
// the admin client. LineUsageMeter reads them with the user-scoped client,
// which returned nothing for non-admins until migration 042 — the bug that
// understated every meter belonging to a customer with bonus data.

const log = logger.child({ route: 'api/app/usage' });

type MeterKind = 'data' | 'voice' | 'sms' | 'other';

function classify(bucket: BalanceBucket): MeterKind {
  const type = bucket.type.toLowerCase();
  const inCategories = (needle: string) =>
    type.includes(needle) || bucket.categories.some((c) => c.toLowerCase().includes(needle));
  if (inCategories('data')) return 'data';
  if (inCategories('voice')) return 'voice';
  if (inCategories('sms')) return 'sms';
  return 'other';
}

export async function GET(request: NextRequest): Promise<Response> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return Response.json({ error: 'Unavailable.' }, { status: 503 });
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return Response.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(token);
  if (authError || !user) {
    return Response.json({ error: 'Please sign in again.' }, { status: 401 });
  }

  const lineId = request.nextUrl.searchParams.get('lineId') ?? '';
  if (!lineId) {
    return Response.json({ error: 'Missing line.' }, { status: 400 });
  }

  const { data: customer } = await admin
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!customer) {
    return Response.json({ error: "We couldn't find your BitLink account." }, { status: 404 });
  }

  const { data: line } = await admin
    .from('telecom_lines')
    .select('id, provider_line_id, metadata')
    .eq('id', lineId)
    .eq('customer_id', customer.id)
    .maybeSingle();
  if (!line) {
    return Response.json({ error: "We couldn't find that line on your account." }, { status: 404 });
  }

  const providerLineId = line.provider_line_id as string | null;
  if (!providerLineId) {
    // Provisioning hasn't finished, so there is nothing to meter yet.
    return Response.json({ meters: [], source: 'none' });
  }

  const planSlug =
    ((line.metadata ?? {}) as Record<string, unknown>).plan_slug as string | undefined ?? null;

  let balances: BalanceBucket[] = [];
  let source: 'carrier' | 'cdr' | 'none' = 'none';

  try {
    const provider = getTelecomProvider();
    balances = await provider.getBalances(providerLineId);
    if (balances.length) source = 'carrier';
  } catch {
    // Fall through to the CDR-derived meter below.
  }

  if (!balances.length) {
    const { data: grants } = await admin
      .from('line_topup_grants')
      .select('topup_id')
      .eq('line_id', lineId)
      .eq('status', 'active');
    const activeTopupIds = (grants ?? []).map((g) => g.topup_id as string);

    try {
      const cdrUsage = await getCdrUsageBuckets(admin, { providerLineId }, planSlug, activeTopupIds);
      if (cdrUsage) {
        balances = cdrUsage.buckets;
        source = 'cdr';
      }
    } catch (error) {
      log.warn(
        { userId: user.id, lineId, error: error instanceof Error ? error.message : String(error) },
        'CDR usage lookup failed',
      );
    }
  }

  // Formatting stays in the app; only the numbers and their meaning cross the
  // wire, so there is one source of truth for the maths and one for the copy.
  const meters = balances.map((bucket) => ({
    id: bucket.id,
    kind: classify(bucket),
    remaining: bucket.value,
    total: bucket.initialValue,
    used: Math.max(0, bucket.initialValue - bucket.value),
  }));

  return Response.json({ meters, source });
}
