// Admin: update or delete a single SMS template.
// Auth: admin role required (profiles table).

import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const log = logger.child({ route: 'admin/sms/templates/[id]' });

const PatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  body: z.string().min(1).max(1000).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success || (!parsed.data.name && !parsed.data.body)) {
    return Response.json({ error: 'Provide a name and/or body' }, { status: 422 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return Response.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const { data, error } = await admin
    .from('sms_templates')
    .update(parsed.data)
    .eq('id', id)
    .select('id, name, body, created_at, updated_at')
    .maybeSingle();

  if (error) {
    log.error({ id, error: error.message }, 'Failed to update sms_template');
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!data) return Response.json({ error: 'Template not found' }, { status: 404 });

  return Response.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const { id } = await params;

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return Response.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const { error } = await admin.from('sms_templates').delete().eq('id', id);
  if (error) {
    log.error({ id, error: error.message }, 'Failed to delete sms_template');
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data: { deleted: true } });
}
