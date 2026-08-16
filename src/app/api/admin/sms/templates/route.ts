// Admin: list and create SMS templates.
// Auth: admin role required (profiles table).

import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const log = logger.child({ route: 'admin/sms/templates' });

export async function GET(): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return Response.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const { data, error } = await admin
    .from('sms_templates')
    .select('id, name, body, created_at, updated_at')
    .order('created_at', { ascending: true });

  if (error) {
    log.error({ error: error.message }, 'Failed to list sms_templates');
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data });
}

const TemplateSchema = z.object({
  name: z.string().min(1).max(120),
  body: z.string().min(1).max(1000),
});

export async function POST(request: NextRequest): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const { user } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = TemplateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return Response.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const { data, error } = await admin
    .from('sms_templates')
    .insert({ name: parsed.data.name, body: parsed.data.body, created_by: user.id })
    .select('id, name, body, created_at, updated_at')
    .single();

  if (error) {
    log.error({ error: error.message }, 'Failed to create sms_template');
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data }, { status: 201 });
}
