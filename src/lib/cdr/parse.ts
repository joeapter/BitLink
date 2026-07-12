// Annatel CDR file parsing — format verified against REAL files on
// 2026-07-12 (the original parser was written against an assumed format and
// rejected every record for a month).
//
// Outgoing (cdr_bitlink_YYYYMMDDHHMM.csv.gz):
//   uid,setup_time,answer_time,tor,category,description,tenant,account,src,
//   dst,orig_country,dest_country,uom,usage,cost,rate,is_roaming,
//   is_international,call_direction
//   - timestamps are DOUBLE-QUOTED Israel wall-clock time ("2026-07-12 08:20:22")
//   - tor has a leading asterisk: *data, *voice
//   - uom is 'b' (bytes) for data, 's' (seconds) for voice
//   - account is the Annatel provider_line_id (UUID)
//   - call_direction is 'outbound' (or empty on data rows)
//
// Incoming (cdr_incoming_bitlink_*.csv.gz):
//   uid,answer_time,src,dst,usage
//   - dst is the SUBSCRIBER'S PHONE NUMBER (+972...), not the line UUID —
//     mapping to a line goes through telecom_lines.metadata->>phone_number
//   - usage is call seconds; incoming files are always voice

export interface ParsedCdr {
  uid: string;
  // outgoing: provider line UUID from `account`; incoming: subscriber phone from `dst`
  subscriberKey: string;
  subscriberKeyType: 'provider_line_id' | 'phone_number';
  call_type: string;
  duration_sec: number;
  data_bytes: number;
  sms_count: number;
  direction: string;
  destination: string | null;
  occurred_at: string;
  raw_filename: string;
}

// CSV line splitter — handles the double-quoted timestamp fields.
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  out.push(current.trim());
  return out;
}

// Israel wall-clock → UTC. File timestamps are Asia/Jerusalem local time with
// no offset marker. A fixed +03:00 would drift an hour every winter, so the
// offset is resolved per-instant via Intl (two passes converge across DST
// boundaries).
function israelOffsetMs(utcTs: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jerusalem',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcTs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - utcTs;
}

export function israelWallClockToUtc(raw: string): Date | null {
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (!m) {
    const fallback = new Date(raw);
    return isNaN(fallback.getTime()) ? null : fallback;
  }
  const [y, mo, d, h, mi, s] = m.slice(1).map(Number);
  const wallClockAsUtc = Date.UTC(y, mo - 1, d, h, mi, s);
  let ts = wallClockAsUtc;
  for (let i = 0; i < 2; i++) {
    ts = wallClockAsUtc - israelOffsetMs(ts);
  }
  return new Date(ts);
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

export function parseCdrFile(filename: string, content: string): ParsedCdr[] {
  const isIncoming = filename.includes('incoming');
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return []; // header-only or empty

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const results: ParsedCdr[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = splitCsvLine(lines[i]);
    if (parts.length < 3) continue;
    const get = (name: string): string => {
      const idx = headers.indexOf(name);
      return idx >= 0 ? (parts[idx] ?? '') : '';
    };

    const uid = get('uid');
    if (!uid) continue;

    const tsRaw = get('answer_time') || get('setup_time');
    const ts = israelWallClockToUtc(tsRaw);
    if (!ts) continue;

    const usageRaw = parseInt(get('usage') || '0', 10) || 0;

    if (isIncoming) {
      // uid,answer_time,src,dst,usage — always an inbound voice call, keyed by
      // the subscriber's phone number in dst.
      const phone = get('dst');
      if (!phone) continue;
      results.push({
        uid,
        subscriberKey: phone,
        subscriberKeyType: 'phone_number',
        call_type: 'voice',
        duration_sec: usageRaw,
        data_bytes: 0,
        sms_count: 0,
        direction: 'incoming',
        destination: get('src') || null,
        occurred_at: ts.toISOString(),
        raw_filename: filename,
      });
      continue;
    }

    const account = get('account');
    if (!account) continue;

    // tor ships with a leading asterisk (*data, *voice); uom is 'b' or 's'.
    const tor = get('tor').replace(/^\*/, '').toLowerCase();
    const uom = get('uom').toLowerCase();
    let callType: string;
    if (tor === 'data' || uom === 'b' || uom === 'byte' || uom === 'bytes') callType = 'data';
    else if (tor === 'sms' || uom === 'sms') callType = 'sms';
    else if (tor === 'voice' || tor === 'call' || uom === 's' || uom === 'sec') callType = 'voice';
    else callType = 'other';

    const cd = get('call_direction').toLowerCase();
    const direction = cd === 'inbound' || cd === 'incoming' ? 'incoming' : 'outgoing';

    results.push({
      uid,
      subscriberKey: account,
      subscriberKeyType: 'provider_line_id',
      call_type: callType,
      duration_sec: callType === 'voice' ? usageRaw : 0,
      data_bytes: callType === 'data' ? usageRaw : 0,
      sms_count: callType === 'sms' ? 1 : 0,
      direction,
      destination: get('dst') || null,
      occurred_at: ts.toISOString(),
      raw_filename: filename,
    });
  }

  return results;
}
