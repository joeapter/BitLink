import type { NextRequest } from 'next/server';
import { sampleAvailableIntlNumbers } from '@/lib/custom-orders/international-numbers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const COUNTRIES = new Set(['us', 'canada', 'uk']);

// Scoped to a draft payment link so random tokens can't be used to browse
// the whole inventory. Numbers stay 'available' until the checkout route
// atomically reserves one at payment time.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await params;
  const country = request.nextUrl.searchParams.get('country') ?? '';

  if (!COUNTRIES.has(country)) {
    return Response.json({ error: 'Unsupported country.' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return Response.json({ error: 'Unavailable.' }, { status: 503 });
  }

  const { data: order } = await admin
    .from('custom_line_orders')
    .select('id, status')
    .eq('token', token)
    .maybeSingle();

  if (!order || order.status !== 'draft') {
    return Response.json({ error: 'Payment link not found.' }, { status: 404 });
  }

  const numbers = await sampleAvailableIntlNumbers(admin, country as 'us' | 'canada' | 'uk');
  return Response.json({ numbers });
}
