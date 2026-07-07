// POST /api/port-auth/verify — verifies the port-in ownership SMS code.
//
// A successful verification marks the number's authentication as completed at
// the provider (valid for 15 days), which is what checkout enforcement and the
// provisioning create-request both require.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';
import { normalizeIsraeliMobile } from '@/lib/utils';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const log = logger.child({ route: 'port-auth/verify' });

const bodySchema = z.object({
  number: z.string().min(8).max(20),
  code: z.string().regex(/^\d{4,8}$/, 'Code must be 4-8 digits'),
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
    return NextResponse.json({ error: 'Enter the code from the SMS.' }, { status: 400 });
  }

  const normalized = normalizeIsraeliMobile(parsed.data.number);
  if (!normalized) {
    return NextResponse.json({ error: 'Invalid number.' }, { status: 400 });
  }

  try {
    const provider = getTelecomProvider();
    const verified = await provider.verifyNumberAuthentication(normalized, parsed.data.code);
    if (!verified) {
      return NextResponse.json(
        { verified: false, error: 'That code did not match. Check the SMS and try again.' },
        { status: 422 },
      );
    }
    log.info({ number: normalized }, 'Port-in number verified');
    return NextResponse.json({ verified: true, number: normalized });
  } catch (err) {
    log.error({ error: String(err), number: normalized }, 'Verification failed');
    return NextResponse.json(
      { verified: false, error: 'Verification failed. Please try again.' },
      { status: 502 },
    );
  }
}
