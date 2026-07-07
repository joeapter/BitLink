// POST /api/port-auth/start — triggers the port-in ownership SMS.
//
// Sends (via the telecom provider) an SMS verification code to the Israeli
// number the customer wants to port. Public by design: it runs BEFORE payment
// in both checkout flows. Abuse is bounded — only valid Israeli mobiles are
// accepted, an existing pending/completed authentication is reused instead of
// re-triggering, and the provider rate-limits per number.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';
import { normalizeIsraeliMobile } from '@/lib/utils';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const log = logger.child({ route: 'port-auth/start' });

const bodySchema = z.object({
  number: z.string().min(8).max(20),
  resend: z.boolean().default(false),
});

export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const normalized = normalizeIsraeliMobile(parsed.data.number);
  if (!normalized) {
    return NextResponse.json(
      { error: 'That does not look like a valid Israeli mobile number.' },
      { status: 400 },
    );
  }

  try {
    const provider = getTelecomProvider();
    const existing = await provider.getNumberAuthenticationStatus(normalized);

    if (existing === 'completed') {
      return NextResponse.json({ status: 'completed', number: normalized });
    }
    if (existing === 'pending' && !parsed.data.resend) {
      return NextResponse.json({ status: 'pending', number: normalized, alreadySent: true });
    }

    await provider.createNumberAuthentication(normalized);
    log.info({ number: normalized }, 'Port-in verification SMS triggered');
    return NextResponse.json({ status: 'pending', number: normalized });
  } catch (err) {
    log.error({ error: String(err), number: normalized }, 'Failed to start number authentication');
    return NextResponse.json(
      { error: 'We could not send the verification code right now. Please try again in a minute.' },
      { status: 502 },
    );
  }
}
