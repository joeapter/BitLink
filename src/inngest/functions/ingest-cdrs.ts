// CDR (Call Detail Record) FTP ingestion — runs every 4 hours to match
// Annatel's FTP delivery schedule.
//
// Setup required:
//   1. Ask Annatel for: FTP host, port, username, password, directory path, file format
//   2. Set env vars: ANNATEL_FTP_HOST, ANNATEL_FTP_PORT, ANNATEL_FTP_USER,
//      ANNATEL_FTP_PASS, ANNATEL_FTP_PATH
//   3. Confirm CDR file format (CSV columns) with Annatel and update parseCdrLine()
//
// CDR file format (assumed — confirm with Annatel):
//   line_id, call_type, duration_sec, data_bytes, timestamp, destination, direction
//
// Once ingested, records are aggregated into cdr_usage_daily for customer-facing
// usage displays and for monthly cost calculations.

import { inngest } from '@/inngest/client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

const log = logger.child({ fn: 'ingest-cdrs' });

// ── CDR record shape (internal, after parsing) ────────────────────────────────

interface CdrRecord {
  providerLineId: string;
  callType: 'voice' | 'sms' | 'data' | 'other';
  durationSec: number;       // voice seconds; 0 for data/sms
  dataBytes: number;         // bytes for data records; 0 for voice/sms
  smsCount: number;          // 1 for SMS records; 0 for voice/data
  occurredAt: Date;
  direction: 'outgoing' | 'incoming' | 'unknown';
  destination?: string;
  rawLine: string;
}

// ── CDR file parser — update columns once Annatel confirms file format ────────

function parseCdrLine(line: string): CdrRecord | null {
  if (!line.trim() || line.startsWith('#') || line.toLowerCase().startsWith('line_id')) return null;

  // PLACEHOLDER — real column order confirmed with Annatel before going live
  // Expected: line_id,call_type,duration_sec,data_bytes,timestamp,destination,direction
  const parts = line.split(',');
  if (parts.length < 6) return null;

  const [lineId, callType, durationRaw, dataBytesRaw, tsRaw, destination, direction] = parts;

  const ts = new Date(tsRaw?.trim() ?? '');
  if (isNaN(ts.getTime())) return null;

  const ct = (callType?.trim().toLowerCase() ?? 'other') as CdrRecord['callType'];
  const dur = parseInt(durationRaw ?? '0', 10) || 0;
  const bytes = parseInt(dataBytesRaw ?? '0', 10) || 0;

  return {
    providerLineId: lineId?.trim() ?? '',
    callType: ['voice', 'sms', 'data'].includes(ct) ? ct : 'other',
    durationSec: dur,
    dataBytes: bytes,
    smsCount: ct === 'sms' ? 1 : 0,
    occurredAt: ts,
    direction: direction?.trim() === 'outgoing' ? 'outgoing' : direction?.trim() === 'incoming' ? 'incoming' : 'unknown',
    destination: destination?.trim() || undefined,
    rawLine: line,
  };
}

// ── FTP fetch — uses Node.js net/tls; install 'basic-ftp' package if preferred ─

async function fetchCdrFiles(): Promise<string[]> {
  const host = process.env.ANNATEL_FTP_HOST;
  const user = process.env.ANNATEL_FTP_USER;
  const pass = process.env.ANNATEL_FTP_PASS;

  if (!host || !user || !pass) {
    log.warn('ANNATEL_FTP_* env vars not set — CDR ingestion skipped');
    return [];
  }

  // Dynamic import so the FTP client is only loaded when credentials are present.
  // Install with: npm install basic-ftp
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type FtpModule = { Client: new () => any };
    const dynImport = Function('m', 'return import(m)') as (m: string) => Promise<FtpModule>;
    const ftp = await dynImport('basic-ftp').catch(() => null);
    if (!ftp) {
      log.error('basic-ftp not installed — run: npm install basic-ftp');
      return [];
    }

    const client = new ftp.Client();
    client.ftp.verbose = false;

    await client.access({
      host,
      port: parseInt(process.env.ANNATEL_FTP_PORT ?? '21', 10),
      user,
      password: pass,
      secure: process.env.ANNATEL_FTP_SECURE === 'true',
    });

    const remotePath = process.env.ANNATEL_FTP_PATH ?? '/cdrs';
    const list = await client.list(remotePath);

    const files: string[] = [];
    for (const entry of list) {
      if (!entry.name.endsWith('.csv') && !entry.name.endsWith('.txt')) continue;

      const chunks: Buffer[] = [];
      const { Writable } = await import('stream');
      const writable = new Writable({
        write(chunk, _enc, cb) { chunks.push(chunk); cb(); },
      });

      await client.downloadTo(writable, `${remotePath}/${entry.name}`);
      files.push(Buffer.concat(chunks).toString('utf8'));
    }

    client.close();
    return files;
  } catch (err) {
    log.error({ error: err instanceof Error ? err.message : String(err) }, 'FTP fetch failed');
    return [];
  }
}

// ── Main Inngest function ─────────────────────────────────────────────────────

export const ingestCdrs = inngest.createFunction(
  {
    id: 'ingest-cdrs',
    retries: 2,
  },
  { cron: 'TZ=UTC 0 */4 * * *' }, // every 4 hours
  async ({ step }) => {
    const admin = createSupabaseAdminClient();
    if (!admin) {
      log.error('Supabase admin client unavailable');
      return { skipped: true, reason: 'no_admin_client' };
    }

    const ftpConfigured = !!(process.env.ANNATEL_FTP_HOST && process.env.ANNATEL_FTP_USER);
    if (!ftpConfigured) {
      log.info('FTP not configured — skipping CDR ingestion (set ANNATEL_FTP_* env vars)');
      return { skipped: true, reason: 'ftp_not_configured' };
    }

    // Step 1: fetch files
    const files = await step.run('fetch-cdr-files', fetchCdrFiles);

    if (!files.length) {
      log.info('No CDR files found');
      return { processed: 0 };
    }

    // Step 2: parse + store
    const result = await step.run('store-cdrs', async () => {
      let total = 0;
      let skipped = 0;

      for (const fileContent of files) {
        const lines = fileContent.split('\n');
        const records: CdrRecord[] = [];

        for (const line of lines) {
          const record = parseCdrLine(line);
          if (record) records.push(record);
        }

        if (!records.length) continue;

        // Look up telecom_line internal IDs from provider_line_ids
        const providerIds = [...new Set(records.map((r) => r.providerLineId))];
        const { data: lineRows } = await admin
          .from('telecom_lines')
          .select('id, provider_line_id, customer_id')
          .in('provider_line_id', providerIds);

        const lineMap = new Map(
          (lineRows ?? []).map((l) => [l.provider_line_id, { id: l.id, customerId: l.customer_id }]),
        );

        for (const batch of chunk(records, 500)) {
          const rows = batch.flatMap((r) => {
            const line = lineMap.get(r.providerLineId);
            if (!line) { skipped++; return []; }
            return [{
              telecom_line_id: line.id,
              customer_id: line.customerId,
              provider_line_id: r.providerLineId,
              call_type: r.callType,
              duration_sec: r.durationSec,
              data_bytes: r.dataBytes,
              sms_count: r.smsCount,
              direction: r.direction,
              destination: r.destination ?? null,
              occurred_at: r.occurredAt.toISOString(),
            }];
          });

          if (!rows.length) continue;

          const { error } = await admin
            .from('cdr_records')
            .upsert(rows, { onConflict: 'telecom_line_id,occurred_at,call_type,direction', ignoreDuplicates: true });

          if (error) {
            log.warn({ error: error.message }, 'CDR batch upsert error');
          } else {
            total += rows.length;
          }
        }
      }

      return { total, skipped };
    });

    log.info(result, 'CDR ingestion complete');
    return result;
  },
);

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
