// GET /api/admin/dids
//
// Returns the tenant's DID number bank from Annatel (GET /api/dids).
// Supports pagination via ?page=N&pageSize=N query params.
// Admin role required.

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const log = logger.child({ route: 'admin/dids' });

export async function GET(request: NextRequest): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(500, Math.max(1, parseInt(searchParams.get('pageSize') ?? '100', 10)));

  const provider = getTelecomProvider();

  try {
    const result = await provider.listTenantDids(page, pageSize);
    log.info({ page, pageSize, total: result.meta.total }, 'DID bank fetched');
    return NextResponse.json(result);
  } catch (err) {
    log.error({ error: err instanceof Error ? err.message : String(err) }, 'Failed to fetch DID bank');
    return NextResponse.json({ error: 'Failed to fetch DID bank' }, { status: 502 });
  }
}
