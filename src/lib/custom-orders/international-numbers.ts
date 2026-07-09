import type { SupabaseClient } from '@supabase/supabase-js';

export type IntlNumberOption = {
  number: string;
  region: string | null;
  city: string | null;
};

const SAMPLE_SIZE = 6;

// Shared by all three "choose a number" surfaces (payment link, admin
// builder, account add-line) — each route does its own auth check, then
// calls this for the actual inventory read. Random-sampled so repeated
// visits don't always show the same handful of the 75 ordered numbers.
export async function sampleAvailableIntlNumbers(
  admin: SupabaseClient,
  country: 'us' | 'canada' | 'uk',
): Promise<IntlNumberOption[]> {
  const { data } = await admin
    .from('international_dids')
    .select('number, region, city')
    .eq('country', country)
    .eq('status', 'available')
    .limit(50);

  const pool = (data ?? []) as IntlNumberOption[];
  const sample: IntlNumberOption[] = [];
  const used = new Set<number>();
  while (sample.length < Math.min(SAMPLE_SIZE, pool.length)) {
    const index = Math.floor(Math.random() * pool.length);
    if (used.has(index)) continue;
    used.add(index);
    sample.push(pool[index]);
  }
  return sample;
}

// Atomic available -> reserved flip, keyed on a caller-supplied token (a
// custom_line_orders.token, or a synthetic one for the account add-line
// flow) so a matching release call can only touch numbers it reserved.
// Returns false if the number was already taken by someone else.
export async function reserveIntlNumber(
  admin: SupabaseClient,
  params: { number: string; country: 'us' | 'canada' | 'uk'; reservationToken: string },
): Promise<boolean> {
  const { data } = await admin
    .from('international_dids')
    .update({ status: 'reserved', reserved_token: params.reservationToken, reserved_at: new Date().toISOString() })
    .eq('number', params.number)
    .eq('country', params.country)
    .eq('status', 'available')
    .select('number')
    .maybeSingle();
  return Boolean(data);
}

// Best-effort rollback if payment never completes (Stripe error, etc.) —
// releases only numbers reserved under this exact token.
export async function releaseIntlNumbers(
  admin: SupabaseClient,
  params: { numbers: string[]; reservationToken: string },
): Promise<void> {
  if (!params.numbers.length) return;
  await admin
    .from('international_dids')
    .update({ status: 'available', reserved_token: null, reserved_at: null })
    .in('number', params.numbers)
    .eq('reserved_token', params.reservationToken);
}
