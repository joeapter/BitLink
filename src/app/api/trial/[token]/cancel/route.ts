// POST /api/trial/[token]/cancel
//
// Customer opt-out before the decision deadline — freezes the line right
// away and marks the trial cancelled, so the lifecycle cron never attempts
// the auto-continue charge for it.

import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { cancelTrial } from '@/lib/trial-offer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }): Promise<Response> {
  const { token } = await params;

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Temporarily unavailable, please try again shortly.' }, { status: 503 });
  }

  const { data: trial } = await admin
    .from('trial_lines')
    .select('id, status, telecom_line_id')
    .eq('token', token)
    .maybeSingle();

  if (!trial) return NextResponse.json({ error: 'Trial not found.' }, { status: 404 });
  if (trial.status !== 'active') {
    return NextResponse.json({ error: 'This trial is no longer active.' }, { status: 409 });
  }
  if (!trial.telecom_line_id) {
    return NextResponse.json({ error: 'Your line is still being set up — try again in a moment.' }, { status: 409 });
  }

  await cancelTrial(admin, { id: trial.id as string, telecom_line_id: trial.telecom_line_id as string });

  return NextResponse.json({ cancelled: true });
}
