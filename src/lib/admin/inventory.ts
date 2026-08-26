// What's left in stock, for the admin overview.
//
// Exists because running out is silent and expensive. A depleted DID block
// completes a line with no phone number; an empty eSIM pool fails provisioning
// outright. Both have happened. The panel this feeds is meant to be glanced at,
// so every figure leads with what's FREE — the number that changes a decision —
// and thresholds turn it amber or red before it becomes an incident.
//
// The international block deserves its own line of attention: Annatel bills the
// whole allocation every month whether or not a number is attached (invoice
// 200830: 50 × ₪6 for US/CA, 25 × ₪9 for UK), so an idle number is not spare
// capacity, it's rent on nothing. That figure is surfaced deliberately.

import type { SupabaseClient } from '@supabase/supabase-js';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'admin-inventory' });

// Monthly carrier rent per international number, in agorot. From Annatel
// invoice 200830 (03/08/2026).
const DID_MONTHLY_AGOROT: Record<string, number> = { us: 600, canada: 600, uk: 900 };

// The two Israeli blocks Annatel has allocated us. Kosher numbers are only
// valid on kosher lines and vice versa — see KOSHER_DID_PREFIXES in the Annatel
// provider, which this mirrors for reporting.
const ISRAELI_BLOCKS = [
  { key: 'israeli_ordinary', label: 'Israeli numbers', prefix: '+9725551953' },
  { key: 'israeli_kosher', label: 'Israeli kosher numbers', prefix: '+9725552165' },
];

export interface InventoryBucket {
  key: string;
  label: string;
  free: number;
  total: number;
  /** Turns the tile amber / red. */
  level: 'ok' | 'low' | 'critical';
  /** Shown under the count when there's something worth saying. */
  note?: string;
}

export interface InventorySnapshot {
  numbers: InventoryBucket[];
  sims: InventoryBucket[];
  /** Monthly spend on international numbers attached to nothing, in agorot. */
  idleIntlAgorot: number;
  idleIntlCount: number;
  /** Set when part of the snapshot couldn't be read, so the UI can say so. */
  degraded: string | null;
}

function level(free: number, low: number, critical: number): InventoryBucket['level'] {
  if (free <= critical) return 'critical';
  if (free <= low) return 'low';
  return 'ok';
}

/**
 * One snapshot of everything provisioning can run out of.
 *
 * Reads our own tables for numbers (authoritative — `international_dids` tracks
 * reservation state that the carrier can't tell us) and the carrier for SIM
 * stock. A carrier failure degrades the SIM section rather than failing the
 * page: knowing the number pools is still worth the visit.
 */
export async function getInventorySnapshot(admin: SupabaseClient): Promise<InventorySnapshot> {
  const numbers: InventoryBucket[] = [];
  const sims: InventoryBucket[] = [];
  let degraded: string | null = null;

  // ── Israeli numbers ──────────────────────────────────────────────────────
  // Free = in the allocated block and not on a line that's still alive. A
  // terminated line releases its number at the carrier, so counting only live
  // lines matches what's actually attachable.
  const { data: liveLines } = await admin
    .from('telecom_lines')
    .select('metadata, status')
    .not('status', 'in', '("terminated","cancelled")');

  const liveNumbers = (liveLines ?? [])
    .map((l) => ((l.metadata ?? {}) as Record<string, unknown>).phone_number as string | undefined)
    .filter((n): n is string => Boolean(n));

  for (const block of ISRAELI_BLOCKS) {
    const used = liveNumbers.filter((n) => n.startsWith(block.prefix)).length;
    const total = 100; // Annatel allocates these in blocks of 100.
    const free = Math.max(total - used, 0);
    numbers.push({
      key: block.key,
      label: block.label,
      free,
      total,
      level: level(free, 20, 8),
    });
  }

  // ── International numbers ────────────────────────────────────────────────
  const { data: intl } = await admin.from('international_dids').select('country, status');
  const byCountry = new Map<string, { free: number; total: number }>();
  for (const row of intl ?? []) {
    const c = String(row.country);
    const entry = byCountry.get(c) ?? { free: 0, total: 0 };
    entry.total += 1;
    if (row.status === 'available') entry.free += 1;
    byCountry.set(c, entry);
  }

  let idleIntlAgorot = 0;
  let idleIntlCount = 0;
  for (const [country, { free, total }] of [...byCountry.entries()].sort()) {
    const rate = DID_MONTHLY_AGOROT[country] ?? 0;
    idleIntlAgorot += free * rate;
    idleIntlCount += free;
    numbers.push({
      key: `intl_${country}`,
      label: `${country === 'uk' ? 'UK' : country === 'us' ? 'US' : 'Canada'} numbers`,
      free,
      total,
      level: level(free, 6, 2),
      note: rate ? `₪${((free * rate) / 100).toFixed(0)}/mo idle` : undefined,
    });
  }

  // ── SIMs ─────────────────────────────────────────────────────────────────
  try {
    const provider = getTelecomProvider();
    const { esimTotal, physicalTotal } = await provider.getSimInventory();

    // Annatel reports what we HOLD, not what's spare, so consumption is counted
    // from our own lines. eSIM lines stamp esim_icc_id; physical lines only get
    // sim_icc_id when an admin assigns the card by hand, so a line created with
    // an ICCID in the order isn't counted — hence the is_esim fallback, which
    // catches every physical line however it was created.
    const liveMeta = (liveLines ?? []).map((l) => (l.metadata ?? {}) as Record<string, unknown>);
    const esimUsed = liveMeta.filter((m) => Boolean(m.esim_icc_id)).length;
    const physicalUsed = liveMeta.filter(
      (m) => m.is_esim !== true && m.is_esim !== 'true' && m.is_esim !== 1,
    ).length;

    const esimFree = Math.max(esimTotal - esimUsed, 0);
    sims.push({
      key: 'esim',
      label: 'eSIM profiles',
      free: esimFree,
      total: esimTotal,
      level: level(esimFree, 60, 20),
    });

    const physicalFree = Math.max(physicalTotal - physicalUsed, 0);
    sims.push({
      key: 'physical',
      label: 'Physical SIMs',
      free: physicalFree,
      total: physicalTotal,
      level: level(physicalFree, 25, 10),
      note: 'Every kosher line needs one',
    });
  } catch (err) {
    degraded = 'SIM stock unavailable — the carrier did not respond.';
    log.warn({ error: err instanceof Error ? err.message : String(err) }, 'SIM inventory read failed');
  }

  return { numbers, sims, idleIntlAgorot, idleIntlCount, degraded };
}
