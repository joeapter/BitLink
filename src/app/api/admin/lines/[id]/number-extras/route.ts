import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Fetches voicemail config, SMS-forwarder settings, and aflalo history for
// ONE number on a line — loaded on demand when an admin picks that number
// from the selector, rather than upfront for every DID on every line load.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  await params; // BitLink line id isn't needed here — kept for route consistency.

  const providerLineId = request.nextUrl.searchParams.get('providerLineId') ?? '';
  const lineDidId = request.nextUrl.searchParams.get('lineDidId') ?? '';
  const number = request.nextUrl.searchParams.get('number') ?? '';
  if (!providerLineId || !lineDidId || !number) {
    return Response.json({ error: 'Missing providerLineId, lineDidId, or number.' }, { status: 400 });
  }

  const provider = getTelecomProvider();
  const [voicemails, smsForwarders, aflaloRequests] = await Promise.all([
    provider.listLineDidVoicemails(providerLineId, lineDidId).catch(() => []),
    provider.listLineDidSmsForwarders(providerLineId, lineDidId).catch(() => []),
    provider.listAflaloRequests(number).catch(() => []),
  ]);

  return Response.json({ voicemails, smsForwarders, aflaloRequests });
}
