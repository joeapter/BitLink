// Israeli DID recycling.
//
// International numbers have had this since they were introduced: a released_at
// stamp on international_dids, released numbers demoted rather than blocked,
// and the oldest released one reused when nothing fresh is left
// (RELEASED_QUIET_DAYS in custom-orders/international-numbers.ts).
//
// Israeli numbers never had any of it. They live only in
// telecom_lines.metadata.phone_number, and provisioning excluded EVERY line
// carrying one regardless of status — so a terminated line kept its number out
// of the pool permanently. By Sept 2026 that was 13 of a 100-number block, a
// third of the apparent headroom, growing with every termination.
//
// This gives the Israeli pool the same behaviour: on termination the number
// moves to released_phone_number with a timestamp, live lines still block their
// numbers outright, and a released number comes back oldest-first once nothing
// fresh remains. Demotion, not a block — same as international.

import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'did-release' });

/**
 * Move a terminated line's number out of active holding and into the released
 * pool. Idempotent: a line that has already been released, or never had a
 * number, is left alone.
 *
 * Call this wherever a line is terminated. Leaving phone_number in place is
 * what quietly shrinks the pool, and nothing else reads it once the line is
 * dead — the number history stays in released_phone_number.
 */
export async function releaseLineNumber(
  admin: SupabaseClient,
  lineId: string,
): Promise<{ released: string | null }> {
  const { data: line } = await admin
    .from('telecom_lines')
    .select('metadata')
    .eq('id', lineId)
    .maybeSingle();

  const metadata = (line?.metadata ?? {}) as Record<string, unknown>;
  const number = metadata.phone_number as string | undefined;
  if (!number) return { released: null };

  const now = new Date().toISOString();
  const { phone_number: _dropped, ...rest } = metadata;

  await admin
    .from('telecom_lines')
    .update({
      metadata: { ...rest, released_phone_number: number, released_at: now },
      updated_at: now,
    })
    .eq('id', lineId);

  log.info({ lineId, number }, 'Number released back to the pool');
  return { released: number };
}

/**
 * Numbers held by lines that are still alive. These are hard-excluded from
 * provisioning — unlike released ones, they are genuinely in use.
 *
 * Everything except a terminated line counts as holding its number: a draft or
 * failed line may have had a DID assigned before it fell over, and handing that
 * number to someone else would double-book it at the carrier.
 */
export async function collectUsedNumbers(admin: SupabaseClient): Promise<string[]> {
  const { data } = await admin
    .from('telecom_lines')
    .select('metadata, status')
    .not('metadata->>phone_number', 'is', null)
    .neq('status', 'terminated');

  return (data ?? [])
    .map((l) => (l.metadata as Record<string, unknown>)?.phone_number as string | undefined)
    .filter((n): n is string => Boolean(n));
}

/**
 * Previously-used numbers, oldest release first — the order they should be
 * handed back out in, so a number gets the longest possible rest before it is
 * reissued to someone new.
 */
export async function collectReleasedNumbers(admin: SupabaseClient): Promise<string[]> {
  const { data } = await admin
    .from('telecom_lines')
    .select('metadata')
    .not('metadata->>released_phone_number', 'is', null)
    .order('metadata->>released_at', { ascending: true });

  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const row of data ?? []) {
    const number = (row.metadata as Record<string, unknown>)?.released_phone_number as string | undefined;
    if (!number || seen.has(number)) continue;
    // A number released, reissued and released again appears twice; the first
    // (oldest) entry is the one that decides its place in the queue.
    seen.add(number);
    ordered.push(number);
  }
  return ordered;
}
