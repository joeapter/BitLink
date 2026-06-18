// POST /api/cdrs/ingest
//
// Receives CDR file payloads from the VPS relay agent.
// Authenticated via CDRS_INGEST_SECRET header — only the VPS knows this key.
//
// Body: { files: Array<{ name: string; content: string }> }
//   content is the raw CDR file text (UTF-8)
//
// The VPS relay script pulls from Annatel FTP every 4 hours and POSTs here.
// This endpoint stores records to cdr_records and fires Inngest for aggregation.

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const log = logger.child({ route: 'cdrs/ingest' });

interface CdrFile {
  name: string;
  content: string; // raw CSV text
}

interface IngestBody {
  files: CdrFile[];
}

interface CdrRow {
  telecom_line_id: string | null;
  customer_id: string | null;
  provider_line_id: string;
  call_type: string;
  duration_sec: number;
  data_bytes: number;
  sms_count: number;
  direction: string;
  destination: string | null;
  occurred_at: string;
}

// ── CDR file parser ───────────────────────────────────────────────────────────
// Annatel delivers two file types per run:
//   cdr_bitlink_YYYYMMDDHHII.csv.gz          — outgoing (all TOR types)
//   cdr_incoming_bitlink_YYYYMMDDHHII.csv.gz — incoming calls
//
// Outgoing columns: uid,setup_time,answer_time,tor,category,description,
//   tenant,account,src,dst,orig_country,dest_country,uom,usage,cost,rate,
//   is_roaming,is_international,call_direction
//
// Incoming columns: uid,answer_time,src,dst,usage

function parseCdrFile(
  filename: string,
  content: string,
): Omit<CdrRow, 'telecom_line_id' | 'customer_id'>[] {
  const isIncoming = filename.includes('incoming');
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return []; // header-only or empty

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const get = (row: string[], name: string): string => {
    const i = headers.indexOf(name);
    return i >= 0 ? (row[i]?.trim() ?? '') : '';
  };

  const results: Omit<CdrRow, 'telecom_line_id' | 'customer_id'>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 3) continue;

    // Timestamp: prefer answer_time, fall back to setup_time
    const tsRaw = get(parts, 'answer_time') || get(parts, 'setup_time');
    const ts = new Date(tsRaw);
    if (isNaN(ts.getTime())) continue;

    // Subscriber line ID:
    //   outgoing → account field (Annatel's customer account identifier)
    //   incoming → dst (the BitLink subscriber being called)
    const subscriberId = isIncoming ? get(parts, 'dst') : get(parts, 'account');
    if (!subscriberId) continue;

    // Call type from tor (type of record) or uom
    const tor = get(parts, 'tor').toLowerCase();
    const uom = get(parts, 'uom').toLowerCase();
    let callType: string;
    if (tor === 'voice' || tor === 'call' || uom === 'sec') callType = 'voice';
    else if (tor === 'data' || uom === 'byte' || uom === 'bytes' || uom === 'kb' || uom === 'mb') callType = 'data';
    else if (tor === 'sms' || uom === 'sms') callType = 'sms';
    else callType = isIncoming ? 'voice' : 'other'; // incoming-only file is always voice

    const usageRaw = parseInt(get(parts, 'usage') || '0', 10) || 0;

    // Direction: incoming file is always incoming; outgoing file check call_direction column
    let direction: string;
    if (isIncoming) {
      direction = 'incoming';
    } else {
      const cd = get(parts, 'call_direction').toLowerCase();
      direction = cd === 'incoming' ? 'incoming' : 'outgoing';
    }

    results.push({
      provider_line_id: subscriberId,
      call_type: callType,
      duration_sec: callType === 'voice' ? usageRaw : 0,
      data_bytes: callType === 'data' ? usageRaw : 0,
      sms_count: callType === 'sms' ? 1 : 0,
      direction,
      destination: isIncoming ? get(parts, 'src') || null : get(parts, 'dst') || null,
      occurred_at: ts.toISOString(),
    });
  }

  return results;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ── Route handler ─────────────────────────────────────────────────────────────

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

  // Parse all CDR records from all files
  const parsed: Omit<CdrRow, 'telecom_line_id' | 'customer_id'>[] = [];
  for (const file of body.files) {
    const records = parseCdrFile(file.name, file.content ?? '');
    parsed.push(...records);
  }

  if (!parsed.length) {
    return NextResponse.json({ received: body.files.length, stored: 0, message: 'No parseable records' });
  }

  // Resolve provider_line_id → internal telecom_line id + customer_id
  const providerIds = [...new Set(parsed.map((r) => r.provider_line_id))];
  const { data: lineRows } = await admin
    .from('telecom_lines')
    .select('id, provider_line_id, customer_id')
    .in('provider_line_id', providerIds);

  const lineMap = new Map(
    (lineRows ?? []).map((l) => [
      l.provider_line_id as string,
      { id: l.id as string, customerId: l.customer_id as string | null },
    ]),
  );

  // Build full rows with internal IDs
  const rows: CdrRow[] = parsed.flatMap((r) => {
    const line = lineMap.get(r.provider_line_id);
    return [{
      ...r,
      telecom_line_id: line?.id ?? null,
      customer_id: line?.customerId ?? null,
    }];
  });

  // Batch upsert (idempotent on line+timestamp+type+direction)
  let stored = 0;
  let errors = 0;
  for (const batch of chunk(rows, 500)) {
    const { error } = await admin
      .from('cdr_records')
      .upsert(batch, {
        onConflict: 'provider_line_id,occurred_at,call_type,direction',
        ignoreDuplicates: true,
      });

    if (error) {
      log.warn({ error: error.message }, 'CDR batch upsert partial error');
      errors++;
    } else {
      stored += batch.length;
    }
  }

  log.info({ files: body.files.length, parsed: parsed.length, stored, errors }, 'CDR ingest complete');

  return NextResponse.json({
    received: body.files.length,
    parsed: parsed.length,
    stored,
    errors,
  });
}
