// Admin: send SMS to customers and list the send log.
// Auth: admin role required (profiles table).
//
// POST behaviour:
//   1. Validate body with Zod (message + recipient list, 500 max)
//   2. Re-check sms_opt_out server-side — the composer already filters, but
//      the flag may have changed since the page loaded
//   3. Per recipient: substitute {name}/{link} placeholders, normalize the
//      number to E.164, send via Twilio, and log the outcome to sms_messages
//   4. Return per-recipient results so the UI can show exactly what happened

import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isSmsConfigured, normalizeToE164, sendSms } from '@/lib/sms/send';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const log = logger.child({ route: 'admin/sms' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitlink.co.il';

// ----------------------------------------------------------------
// GET — recent send log
// ----------------------------------------------------------------

export async function GET(): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return Response.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const { data, error } = await admin
    .from('sms_messages')
    .select('id, customer_id, to_number, body, campaign, status, error, created_at, customers(full_name)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    log.error({ error: error.message }, 'Failed to list sms_messages');
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data });
}

// ----------------------------------------------------------------
// POST — send a message to selected recipients
// ----------------------------------------------------------------

const SendSchema = z.object({
  body: z.string().min(1).max(1000),
  campaign: z.string().max(80).optional(),
  // 'device' (default): the console handed the message to the Messages app on
  // Joe's phone via an sms: link — nothing is sent server-side, we only log it.
  // 'gateway': actually send through the configured SMS provider.
  channel: z.enum(['device', 'gateway']).default('device'),
  recipients: z
    .array(
      z.object({
        customerId: z.string().uuid().nullable(),
        to: z.string().min(9),
        name: z.string().nullable().optional(),
        referralCode: z.string().nullable().optional(),
      }),
    )
    .min(1)
    .max(500),
});

function personalize(
  template: string,
  recipient: { name?: string | null; referralCode?: string | null },
): string {
  const firstName = recipient.name?.trim().split(/\s+/)[0] ?? '';
  const link = recipient.referralCode
    ? `${SITE_URL}/signup?referral=${recipient.referralCode}`
    : SITE_URL;
  return template
    .replaceAll('{name}', firstName || 'there')
    .replaceAll('{link}', link);
}

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

  const parsed = SendSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // Only the gateway channel needs a configured provider — device sends go
  // out from Joe's own phone and just get logged here.
  if (parsed.data.channel === 'gateway' && !isSmsConfigured()) {
    return Response.json(
      { error: 'No SMS gateway is configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM.' },
      { status: 503 },
    );
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return Response.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // Re-check opt-outs against the DB, not just the payload
  const customerIds = parsed.data.recipients
    .map((r) => r.customerId)
    .filter((id): id is string => Boolean(id));
  const optedOut = new Set<string>();
  if (customerIds.length) {
    const { data: optOutRows } = await admin
      .from('customers')
      .select('id')
      .in('id', customerIds)
      .eq('sms_opt_out', true);
    for (const row of optOutRows ?? []) optedOut.add(row.id as string);
  }

  const isDevice = parsed.data.channel === 'device';

  const results: Array<{
    to: string;
    customerId: string | null;
    status: 'opened' | 'sent' | 'failed' | 'skipped';
    error?: string;
  }> = [];

  for (const recipient of parsed.data.recipients) {
    if (recipient.customerId && optedOut.has(recipient.customerId)) {
      results.push({ to: recipient.to, customerId: recipient.customerId, status: 'skipped', error: 'Customer opted out' });
      continue;
    }

    const e164 = normalizeToE164(recipient.to);
    const message = personalize(parsed.data.body, recipient);

    if (!e164) {
      results.push({ to: recipient.to, customerId: recipient.customerId, status: 'failed', error: 'Invalid phone number' });
      await admin.from('sms_messages').insert({
        customer_id: recipient.customerId,
        to_number: recipient.to,
        body: message,
        campaign: parsed.data.campaign ?? null,
        status: 'failed',
        provider: isDevice ? 'device' : 'twilio',
        error: 'Invalid phone number',
        created_by: user.id,
      });
      continue;
    }

    // Device channel: the phone does the sending — record the handoff only.
    if (isDevice) {
      results.push({ to: e164, customerId: recipient.customerId, status: 'opened' });
      await admin.from('sms_messages').insert({
        customer_id: recipient.customerId,
        to_number: e164,
        body: message,
        campaign: parsed.data.campaign ?? null,
        status: 'opened',
        provider: 'device',
        created_by: user.id,
      });
      continue;
    }

    try {
      const sent = await sendSms(e164, message);
      results.push({ to: e164, customerId: recipient.customerId, status: 'sent' });
      await admin.from('sms_messages').insert({
        customer_id: recipient.customerId,
        to_number: e164,
        body: message,
        campaign: parsed.data.campaign ?? null,
        status: 'sent',
        provider: 'twilio',
        provider_message_id: sent.sid,
        created_by: user.id,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      results.push({ to: e164, customerId: recipient.customerId, status: 'failed', error: errorMessage });
      await admin.from('sms_messages').insert({
        customer_id: recipient.customerId,
        to_number: e164,
        body: message,
        campaign: parsed.data.campaign ?? null,
        status: 'failed',
        provider: 'twilio',
        error: errorMessage,
        created_by: user.id,
      });
    }
  }

  const handledCount = results.filter((r) => r.status === 'sent' || r.status === 'opened').length;
  log.info(
    { total: results.length, handled: handledCount, channel: parsed.data.channel, campaign: parsed.data.campaign },
    'Admin SMS batch complete',
  );

  return Response.json({ data: { results, sent: handledCount, total: results.length } });
}
