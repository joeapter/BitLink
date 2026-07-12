// POST /api/cdrs/ingest
//
// Receives CDR file payloads from the VPS relay agent (vps-relay/cdr-relay.js,
// which pulls Annatel's FTP every 4 hours). Authenticated via the
// CDRS_INGEST_SECRET header — only the VPS knows this key.
//
// Body: { files: Array<{ name: string; content: string }> }
//   content is the raw decompressed CDR file text (UTF-8)
//
// Parsing lives in lib/cdr/parse.ts (format verified against real files).
// Line mapping: outgoing records carry the Annatel provider line UUID in
// `account`; incoming records only carry the subscriber's phone number, which
// is matched against telecom_lines.metadata->>phone_number.

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { parseCdrFile, normalizePhone, type ParsedCdr } from '@/lib/cdr/parse';
import { sendEmail } from '@/lib/email/send';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const log = logger.child({ route: 'cdrs/ingest' });

interface CdrFile {
  name: string;
  content: string;
}

interface IngestBody {
  files: CdrFile[];
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function POST(request: NextRequest): Promise<Response> {
  // Authenticate the VPS relay
  const secret = request.headers.get('x-cdrs-secret');
  const expected = process.env.CDRS_INGEST_SECRET;

  if (!expected) {
    log.error('CDRS_INGEST_SECRET not set — CDR ingest endpoint is disabled');
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  if (!secret || secret !== expected) {
    log.warn({ ip: request.headers.get('x-forwarded-for') }, 'CDR ingest: unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: IngestBody;
  try {
    body = (await request.json()) as IngestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!Array.isArray(body?.files) || !body.files.length) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    log.error('Supabase admin client unavailable');
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const parsed: ParsedCdr[] = [];
  for (const file of body.files) {
    parsed.push(...parseCdrFile(file.name, file.content ?? ''));
  }

  if (!parsed.length) {
    // Header-only files parsing to zero is normal. Files WITH data rows all
    // parsing to zero means the format changed again — that exact failure ran
    // silently for a month once (relay marks files processed regardless), so
    // this time it emails immediately instead of only logging.
    const filesWithDataRows = body.files.filter(
      (f) => (f.content ?? '').split('\n').filter((l) => l.trim()).length > 1,
    );
    if (filesWithDataRows.length > 0) {
      log.error({ files: filesWithDataRows.map((f) => f.name).slice(0, 5) }, 'CDR files contained data rows but ZERO records parsed — format change?');
      await sendEmail({
        to: 'joe@bitlink.co.il',
        subject: '⚠ CDR ingest: files have data but nothing parsed',
        html: [
          `<p>The CDR relay delivered <b>${filesWithDataRows.length}</b> file(s) containing data rows, but the parser produced <b>zero</b> records — Annatel's file format may have changed.</p>`,
          `<p>Example files: ${filesWithDataRows.slice(0, 3).map((f) => f.name).join(', ')}</p>`,
          `<p>Usage data is NOT being recorded until this is fixed. (The relay marks files processed regardless, but re-ingestion is safe — records dedup on uid.)</p>`,
        ].join(''),
      }).catch(() => {});
    }
    return NextResponse.json({ received: body.files.length, stored: 0, message: 'No parseable records' });
  }

  // Resolve lines both ways (see header comment).
  const providerIds = [
    ...new Set(parsed.filter((r) => r.subscriberKeyType === 'provider_line_id').map((r) => r.subscriberKey)),
  ];
  const phoneKeys = [
    ...new Set(parsed.filter((r) => r.subscriberKeyType === 'phone_number').map((r) => normalizePhone(r.subscriberKey))),
  ];

  type LineRef = { id: string; customerId: string | null; providerLineId: string | null };
  const byProviderId = new Map<string, LineRef>();
  const byPhone = new Map<string, LineRef>();

  if (providerIds.length) {
    const { data } = await admin
      .from('telecom_lines')
      .select('id, provider_line_id, customer_id')
      .in('provider_line_id', providerIds);
    for (const l of data ?? []) {
      byProviderId.set(l.provider_line_id as string, {
        id: l.id as string,
        customerId: (l.customer_id ?? null) as string | null,
        providerLineId: l.provider_line_id as string,
      });
    }
  }

  if (phoneKeys.length) {
    // Phone numbers live in jsonb metadata, so fetch candidates and match in
    // memory — line count is small and this avoids a jsonb-expression index.
    const { data } = await admin
      .from('telecom_lines')
      .select('id, provider_line_id, customer_id, metadata')
      .not('metadata->>phone_number', 'is', null);
    for (const l of data ?? []) {
      const phone = normalizePhone(String((l.metadata as Record<string, unknown>)?.phone_number ?? ''));
      if (!phone) continue;
      byPhone.set(phone, {
        id: l.id as string,
        customerId: (l.customer_id ?? null) as string | null,
        providerLineId: (l.provider_line_id ?? null) as string | null,
      });
    }
  }

  const rows = parsed.map((r) => {
    const line =
      r.subscriberKeyType === 'provider_line_id'
        ? byProviderId.get(r.subscriberKey)
        : byPhone.get(normalizePhone(r.subscriberKey));
    return {
      uid: r.uid,
      telecom_line_id: line?.id ?? null,
      customer_id: line?.customerId ?? null,
      provider_line_id: line?.providerLineId ?? r.subscriberKey,
      call_type: r.call_type,
      duration_sec: r.duration_sec,
      data_bytes: r.data_bytes,
      sms_count: r.sms_count,
      direction: r.direction,
      destination: r.destination,
      occurred_at: r.occurred_at,
      raw_filename: r.raw_filename,
    };
  });

  const unmapped = rows.filter((r) => !r.telecom_line_id).length;

  let stored = 0;
  let errors = 0;
  for (const batch of chunk(rows, 500)) {
    const { error } = await admin
      .from('cdr_records')
      .upsert(batch, { onConflict: 'uid', ignoreDuplicates: true });

    if (error) {
      log.warn({ error: error.message }, 'CDR batch upsert partial error');
      errors++;
    } else {
      stored += batch.length;
    }
  }

  log.info({ files: body.files.length, parsed: parsed.length, stored, unmapped, errors }, 'CDR ingest complete');

  return NextResponse.json({
    received: body.files.length,
    parsed: parsed.length,
    stored,
    unmapped,
    errors,
  });
}
