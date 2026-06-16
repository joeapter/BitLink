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

// ── CDR line parser ───────────────────────────────────────────────────────────
// Update column order after Annatel confirms the exact file format.
// Expected: line_id,call_type,duration_sec,data_bytes,timestamp,destination,direction

function parseLine(raw: string): Omit<CdrRow, 'telecom_line_id' | 'customer_id'> | null {
  const line = raw.trim();
  if (!line || line.startsWith('#') || line.toLowerCase().startsWith('line_id')) return null;

  const parts = line.split(',');
  if (parts.length < 6) return null;

  const [lineId, callType, durRaw, bytesRaw, tsRaw, dest, dir] = parts;
  const ts = new Date(tsRaw?.trim() ?? '');
  if (isNaN(ts.getTime())) return null;

  const ct = (callType?.trim().toLowerCase() ?? 'other');

  return {
    provider_line_id: lineId?.trim() ?? '',
    call_type: ['voice', 'sms', 'data'].includes(ct) ? ct : 'other',
    duration_sec: parseInt(durRaw ?? '0', 10) || 0,
    data_bytes: parseInt(bytesRaw ?? '0', 10) || 0,
    sms_count: ct === 'sms' ? 1 : 0,
    direction: dir?.trim() === 'outgoing' ? 'outgoing' : dir?.trim() === 'incoming' ? 'incoming' : 'unknown',
    destination: dest?.trim() || null,
    occurred_at: ts.toISOString(),
  };
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
    const lines = (file.content ?? '').split('\n');
    for (const line of lines) {
      const record = parseLine(line);
      if (record) parsed.push(record);
    }
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
        onConflict: 'telecom_line_id,occurred_at,call_type,direction',
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
