import type { NextRequest } from 'next/server';
import { sampleAvailableIntlNumbers } from '@/lib/custom-orders/international-numbers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const COUNTRIES = new Set(['us', 'canada', 'uk']);

// Used by the self-serve "add a line" form in the customer portal.
export async function GET(request: NextRequest): Promise<Response> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Please sign in.' }, { status: 401 });
  }

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
