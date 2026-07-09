import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { sampleAvailableIntlNumbers } from '@/lib/custom-orders/international-numbers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const COUNTRIES = new Set(['us', 'canada', 'uk']);

// Used by the admin custom-order builder — admin can pre-pick a number for a
// line while composing the order, before a payment link even exists.
export async function GET(request: NextRequest): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const country = request.nextUrl.searchParams.get('country') ?? '';
  if (!COUNTRIES.has(country)) {
    return Response.json({ error: 'Unsupported country.' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return Response.json({ error: 'Unavailable.' }, { status: 503 });
  }

  const numbers = await sampleAvailableIntlNumbers(admin, country as 'us' | 'canada' | 'uk');
  return Response.json({ numbers });
}
