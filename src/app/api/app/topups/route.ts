import type { NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { grantTopup } from '@/lib/topups/grant-topup';
import { getTopUpsForPlan } from '@/lib/topups';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Self-serve topup purchase for the native mobile app.
//
// The website buys a topup through a server action authenticated by a session
// cookie (lib/account/topup-actions.ts). The app has no cookie — it holds a
// Supabase access token — so this route is the same purchase behind bearer
// auth. It deliberately calls the same grantTopup() the web and admin paths
// use rather than reimplementing anything: every rule about which topups a
// line may receive (carrier-provisioned line, active status, kosher match)
// lives there and stays in one place.
//
// Apple note: this charges the customer's own card rather than using in-app
// purchase, which is what guideline 3.1.3(e) requires — mobile data on a real
// SIM is a service consumed outside the app, so IAP is not permitted for it.

const log = logger.child({ route: 'api/app/topups' });

type Body = { lineId?: unknown; topupId?: unknown };

export async function POST(request: NextRequest): Promise<Response> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return Response.json({ error: 'Top-ups are temporarily unavailable.' }, { status: 503 });
  }

  // Bearer token, not a cookie. Verified against Supabase rather than decoded
  // locally, so a forged or expired token cannot buy anything.
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

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const lineId = typeof body.lineId === 'string' ? body.lineId : '';
  const topupId = typeof body.topupId === 'string' ? body.topupId : '';
  if (!lineId || !topupId) {
    return Response.json({ error: 'Choose a top-up before continuing.' }, { status: 400 });
  }

  // Ownership is resolved from the verified token, never from the request
  // body: the caller says which line, and we confirm that line belongs to the
  // customer record linked to this login before any charge happens.
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
    .select('id, is_kosher')
    .eq('id', lineId)
    .eq('customer_id', customer.id)
    .maybeSingle();
  if (!line) {
    return Response.json({ error: "We couldn't find that line on your account." }, { status: 404 });
  }

  // grantTopup enforces this too, but rejecting here keeps a kosher/non-kosher
  // mismatch from ever reaching the carrier call.
  const allowed = getTopUpsForPlan(Boolean(line.is_kosher)).some((t) => t.id === topupId);
  if (!allowed) {
    return Response.json({ error: 'That top-up is not available for this line.' }, { status: 400 });
  }

  const result = await grantTopup({
    admin,
    lineId,
    topupId,
    frequency: 'once',
    billingMode: 'paid',
    source: 'self_serve',
    actorUserId: user.id,
  });

  if (result.error) {
    log.warn({ userId: user.id, lineId, topupId, error: result.error }, 'App topup purchase failed');
    return Response.json({ error: result.error }, { status: 400 });
  }

  log.info({ userId: user.id, lineId, topupId }, 'App topup purchased');
  return Response.json({ success: result.success ?? 'Top-up added.' });
}
