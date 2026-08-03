// POST /api/trial/[token]/decide
//
// Converts a trial into a real paid plan: creates a real Stripe subscription
// off-session on the card saved at trial signup (no new checkout needed),
// links it to the existing trial line, and marks the trial converted.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { convertTrialToPlan } from '@/lib/trial-offer';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const log = logger.child({ route: 'trial/decide' });

const bodySchema = z.object({
  planSlug: z.enum(['basic', 'student-5g', 'max-5g']),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }): Promise<Response> {
  const { token } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Pick a valid plan.' }, { status: 400 });
  }
  const { planSlug } = parsed.data;

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Temporarily unavailable, please try again shortly.' }, { status: 503 });
  }

  const { data: trial } = await admin
    .from('trial_lines')
    .select('id, status, telecom_line_id, customer_id, stripe_customer_id')
    .eq('token', token)
    .maybeSingle();

  if (!trial) {
    return NextResponse.json({ error: 'Trial not found.' }, { status: 404 });
  }
  if (trial.status !== 'active') {
    return NextResponse.json({ error: 'This trial is no longer open for a decision.' }, { status: 409 });
  }
  if (!trial.telecom_line_id) {
    return NextResponse.json({ error: 'Your line is still being set up — try again in a moment.' }, { status: 409 });
  }

  const result = await convertTrialToPlan(
    admin,
    {
      id: trial.id as string,
      telecom_line_id: trial.telecom_line_id as string,
      customer_id: trial.customer_id as string,
      stripe_customer_id: trial.stripe_customer_id as string,
    },
    planSlug,
  );

  if (!result.success) {
    log.error({ token, planSlug, error: result.error }, 'Trial conversion failed');
    return NextResponse.json(
      { error: 'Your card on file was declined. Message us on WhatsApp and we’ll help you sort it out.' },
      { status: 402 },
    );
  }

  return NextResponse.json({ converted: true });
}
