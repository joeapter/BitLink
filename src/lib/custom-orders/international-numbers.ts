import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/server';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';
import { usCanadaNumberAddOn } from '@/lib/plans';
import { sendEmail } from '@/lib/email/send';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'add-intl-number' });

export type IntlNumberOption = {
  number: string;
  region: string | null;
  city: string | null;
  // Set when this number was previously on a line and released back to
  // inventory. Customer surfaces never see these until RELEASED_QUIET_DAYS
  // has passed; admin surfaces show them at the bottom, stamped.
  releasedAt?: string | null;
};

const SAMPLE_SIZE = 6;
// Released numbers stay off customer-facing pickers for this long.
const RELEASED_QUIET_DAYS = 90;

// Shared by all three "choose a number" surfaces (payment link, admin
// builder, account add-line) — each route does its own auth check, then
// calls this for the actual inventory read. Random-sampled so repeated
// visits don't always show the same handful of the 75 ordered numbers.
export async function sampleAvailableIntlNumbers(
  admin: SupabaseClient,
  country: 'us' | 'canada' | 'uk',
  opts?: { audience?: 'customer' | 'admin' },
): Promise<IntlNumberOption[]> {
  const audience = opts?.audience ?? 'customer';
  const { data } = await admin
    .from('international_dids')
    .select('number, region, city, released_at')
    .eq('country', country)
    .eq('status', 'available')
    .limit(100);

  const rows: IntlNumberOption[] = ((data ?? []) as Array<{ number: string; region: string | null; city: string | null; released_at: string | null }>).map(
    (r) => ({ number: r.number, region: r.region, city: r.city, releasedAt: r.released_at ?? null }),
  );
  const fresh = rows.filter((r) => !r.releasedAt);
  const released = rows
    .filter((r) => Boolean(r.releasedAt))
    .sort((a, b) => String(a.releasedAt).localeCompare(String(b.releasedAt)));

  const pickRandom = (pool: IntlNumberOption[], count: number): IntlNumberOption[] => {
    const sample: IntlNumberOption[] = [];
    const used = new Set<number>();
    while (sample.length < Math.min(count, pool.length)) {
      const index = Math.floor(Math.random() * pool.length);
      if (used.has(index)) continue;
      used.add(index);
      sample.push(pool[index]);
    }
    return sample;
  };

  if (audience === 'customer') {
    const cutoff = Date.now() - RELEASED_QUIET_DAYS * 24 * 60 * 60 * 1000;
    const pool = [
      ...fresh,
      ...released.filter((r) => new Date(String(r.releasedAt)).getTime() < cutoff),
    ];
    return pickRandom(pool, SAMPLE_SIZE);
  }

  // Admin: a fresh random sample first, then EVERY released number at the
  // bottom (oldest release first), each carrying releasedAt for the stamp.
  return [...pickRandom(fresh, SAMPLE_SIZE), ...released];
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

async function getSubscriberForLine(admin: SupabaseClient, lineId: string) {
  const { data } = await admin
    .from('subscribers')
    .select('id, stripe_subscription_id, stripe_subscription_item_id, monthly_price_cents')
    .eq('telecom_line_id', lineId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as {
    id: string;
    stripe_subscription_id: string | null;
    stripe_subscription_item_id: string | null;
    monthly_price_cents: number | null;
  } | null;
}

async function findSubscriptionItem(stripe: Stripe, stripeSubscriptionId: string, itemId: string | null) {
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  return itemId
    ? subscription.items.data.find((item) => item.id === itemId) ?? null
    : subscription.items.data[0] ?? null;
}

export type AddIntlNumberResult = { success?: string; error?: string };

// Adds a US/CA/UK number to a line that's already active — distinct from the
// at-creation-time flow in provision-lines.ts. The carrier attach happens
// immediately (the line already exists on Annatel, no provisioning job to
// wait for); billing, if any, bumps the SAME subscription item's price_data
// rather than creating a second line item, so it stays "one line, one
// price, one pause/cancel target" and rides the line's existing renewal date.
export async function addIntlNumberToLine(params: {
  admin: SupabaseClient;
  lineId: string;
  country: 'us' | 'canada' | 'uk';
  number: string;
  billingMode: 'paid' | 'free';
  actorUserId?: string | null;
  // Admin-only escape hatch: attach ALONGSIDE an existing international
  // number instead of refusing. The primary intl_number metadata is left
  // untouched; secondaries accumulate in intl_numbers_extra. Annatel's DID
  // endpoint has collection semantics (POST appends, each DID releases
  // independently), so nothing is replaced at the carrier.
  allowSecondary?: boolean;
}): Promise<AddIntlNumberResult> {
  const { admin, lineId, country, number, billingMode } = params;

  const { data: line } = await admin
    .from('telecom_lines')
    .select('id, status, provider_line_id, metadata')
    .eq('id', lineId)
    .maybeSingle();

  if (!line) return { error: 'Line not found.' };
  if (!line.provider_line_id) return { error: 'This line is not active with the carrier yet.' };
  if (!['active', 'suspended'].includes(String(line.status))) {
    return { error: 'Only an active line can get an international number.' };
  }

  const meta = (line.metadata ?? {}) as Record<string, unknown>;
  const existingIntl = meta.intl_number as Record<string, unknown> | undefined;
  const isSecondary = Boolean(existingIntl && ['reserved', 'assigned'].includes(String(existingIntl.status)));
  if (isSecondary && !params.allowSecondary) {
    return { error: 'This line already has an international number.' };
  }

  const reservationToken = `line_${lineId}`;
  const reserved = await reserveIntlNumber(admin, { number, country, reservationToken });
  if (!reserved) return { error: 'That number was just taken — pick another.' };

  const provider = getTelecomProvider();
  try {
    await provider.assignDid(line.provider_line_id as string, number);
  } catch (err) {
    await releaseIntlNumbers(admin, { numbers: [number], reservationToken });
    return {
      error: err instanceof Error ? `Could not attach that number: ${err.message}` : 'Could not attach that number.',
    };
  }

  const now = new Date().toISOString();
  await admin
    .from('international_dids')
    .update({ status: 'assigned', assigned_line_id: lineId, assigned_at: now })
    .eq('number', number);

  // Billing happens AFTER the carrier attach succeeds — if the customer is
  // going to have the number either way, they should never be charged for
  // one that failed to attach. A billing failure after a successful attach
  // is the safer direction to fail in: surfaced loudly below, not silently.
  let billingNote: string | null = null;
  if (billingMode === 'paid') {
    const subscriber = await getSubscriberForLine(admin, lineId);
    const stripe = subscriber?.stripe_subscription_id ? getStripe() : null;
    if (!subscriber?.stripe_subscription_id || !stripe) {
      billingNote = 'No Stripe subscription is linked to this line — add the $9.99/mo charge manually.';
    } else {
      try {
        // Guard against double-billing: if the subscription already carries a
        // standalone intl-addon item (e.g. bought at checkout) that isn't yet
        // matched by a paid number, that item covers THIS attach — folding
        // another $9.99 into the line item would charge twice. (Found live on
        // Joe's own subscription, Jul 2026.)
        const allItems = await stripe.subscriptionItems.list({
          subscription: subscriber.stripe_subscription_id,
          limit: 20,
        });
        const addonPriceId = process.env.STRIPE_PRICE_US_CANADA_ADDON?.trim();
        const standaloneAddonItems = allItems.data.filter(
          (i) => i.price.id === addonPriceId || i.price.metadata?.type === 'intl_number_addon',
        );
        if (standaloneAddonItems.length > 0) {
          const paidAssigned = [
            ...(existingIntl && String(existingIntl.status) === 'assigned' && String(existingIntl.billing_mode) === 'paid' ? [existingIntl] : []),
            ...(Array.isArray(meta.intl_numbers_extra)
              ? (meta.intl_numbers_extra as Array<Record<string, unknown>>).filter(
                  (e) => String(e.status) === 'assigned' && String(e.billing_mode) === 'paid',
                )
              : []),
          ].length;
          if (standaloneAddonItems.length > paidAssigned) {
            billingNote = `Covered by the existing $9.99 add-on item already on the subscription (${standaloneAddonItems[0].id}) — no additional charge added.`;
          }
        }

        if (billingNote) {
          // Skip the fold; the standalone item is the billing for this number.
        } else {
        const item = await findSubscriptionItem(stripe, subscriber.stripe_subscription_id, subscriber.stripe_subscription_item_id);
        if (!item) throw new Error('Could not find the Stripe subscription item for this line.');
        const productId = typeof item.price.product === 'string' ? item.price.product : item.price.product.id;
        const currentTotal = Number(subscriber.monthly_price_cents ?? item.price.unit_amount ?? 0);
        const newTotal = currentTotal + usCanadaNumberAddOn.priceCents;
        await stripe.subscriptionItems.update(item.id, {
          price_data: { currency: 'usd', unit_amount: newTotal, recurring: { interval: 'month' }, product: productId },
          proration_behavior: 'create_prorations',
          metadata: {
            ...item.metadata,
            bitlink_intl_addon: '1',
            bitlink_intl_addon_count: String(Number(item.metadata?.bitlink_intl_addon_count ?? (item.metadata?.bitlink_intl_addon === '1' ? '1' : '0')) + 1),
            bitlink_intl_addon_added_at: now,
          },
        });
        await admin.from('subscribers').update({ monthly_price_cents: newTotal, updated_at: now }).eq('id', subscriber.id);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        billingNote = `The number is live, but billing could not be updated automatically. Add the $${(usCanadaNumberAddOn.priceCents / 100).toFixed(2)}/mo charge manually.`;
        log.error({ lineId, number, error: errMsg }, 'Intl add-on attached but billing update failed');
        await sendEmail({
          to: 'joe@bitlink.co.il',
          subject: `⚠ Intl number attached but billing NOT updated — line ${lineId}`,
          html: [
            `<p>Number <b>${number}</b> was attached to line <b>${lineId}</b>, but the Stripe billing update failed.</p>`,
            `<p><b>Error:</b> ${errMsg}</p>`,
            `<p><a href="https://www.bitlink.co.il/admin/lines/${lineId}">Open the line in admin</a> to add the charge manually.</p>`,
          ].join(''),
        }).catch(() => {});
      }
    }
  }

  await admin
    .from('telecom_lines')
    .update({
      metadata: {
        ...meta,
        ...(isSecondary
          ? {
              intl_numbers_extra: [
                ...(Array.isArray(meta.intl_numbers_extra) ? (meta.intl_numbers_extra as Array<Record<string, unknown>>) : []),
                { country, source: 'new', number, status: 'assigned', assigned_at: now, billing_mode: billingMode },
              ],
            }
          : {
              intl_number: {
                country,
                source: 'new',
                number,
                status: 'assigned',
                assigned_at: now,
                billing_mode: billingMode,
              },
            }),
      },
      updated_at: now,
    })
    .eq('id', lineId);

  try {
    await admin.from('audit_logs').insert({
      actor_user_id: params.actorUserId ?? null,
      action: 'intl_number_added',
      entity_type: 'telecom_line',
      entity_id: lineId,
      metadata: { number, country, billingMode, secondary: isSecondary },
    });
  } catch {
    // audit failure is non-fatal
  }

  const successMessage =
    billingMode === 'free'
      ? `Added ${number} at no charge.`
      : billingNote
        ? `Added ${number}. ${billingNote}`
        : `Added ${number} — this month prorated, billed together with the line going forward.`;

  return { success: successMessage };
}

export type RemoveIntlNumberResult = { success?: string; error?: string };

// Releases an international number from a line back into inventory — admin
// console only. Annatel returns released DIDs to the pool (confirmed by
// Annatel, Jul 2026); released_at is stamped so pickers quarantine the number
// from customers for RELEASED_QUIET_DAYS and admins can see when it was last
// in use. If the number was billed, the $9.99/mo comes back off the same
// subscription item.
export async function removeIntlNumberFromLine(params: {
  admin: SupabaseClient;
  lineId: string;
  number: string;
  actorUserId?: string | null;
}): Promise<RemoveIntlNumberResult> {
  const { admin, lineId, number } = params;

  const { data: line } = await admin
    .from('telecom_lines')
    .select('id, status, provider_line_id, metadata')
    .eq('id', lineId)
    .maybeSingle();
  if (!line?.provider_line_id) return { error: 'Line not found or not active with the carrier.' };

  const meta = (line.metadata ?? {}) as Record<string, unknown>;
  const primary = meta.intl_number as Record<string, unknown> | undefined;
  const extras = Array.isArray(meta.intl_numbers_extra)
    ? (meta.intl_numbers_extra as Array<Record<string, unknown>>)
    : [];
  const isPrimary = primary?.number === number && String(primary?.status) === 'assigned';
  const extraIndex = extras.findIndex((e) => e.number === number && String(e.status) === 'assigned');
  if (!isPrimary && extraIndex === -1) return { error: 'That number is not assigned to this line.' };
  const entry = (isPrimary ? primary! : extras[extraIndex]) as Record<string, unknown>;

  const provider = getTelecomProvider();
  try {
    await provider.releaseDid(line.provider_line_id as string, number);
  } catch (err) {
    return { error: err instanceof Error ? `Carrier release failed: ${err.message}` : 'Carrier release failed.' };
  }

  const now = new Date().toISOString();
  await admin
    .from('international_dids')
    .update({
      status: 'available',
      assigned_line_id: null,
      assigned_at: null,
      released_at: now,
      released_from_line_id: lineId,
    })
    .eq('number', number);

  let billingNote: string | null = null;
  if (String(entry.billing_mode) === 'paid') {
    const subscriber = await getSubscriberForLine(admin, lineId);
    const stripe = subscriber?.stripe_subscription_id ? getStripe() : null;
    if (!subscriber?.stripe_subscription_id || !stripe) {
      billingNote = 'No Stripe subscription linked — remove the $9.99/mo charge manually if one exists.';
    } else {
      try {
        const item = await findSubscriptionItem(stripe, subscriber.stripe_subscription_id, subscriber.stripe_subscription_item_id);
        if (!item) throw new Error('Could not find the Stripe subscription item for this line.');
        const productId = typeof item.price.product === 'string' ? item.price.product : item.price.product.id;
        const currentTotal = Number(subscriber.monthly_price_cents ?? item.price.unit_amount ?? 0);
        const newTotal = Math.max(0, currentTotal - usCanadaNumberAddOn.priceCents);
        await stripe.subscriptionItems.update(item.id, {
          price_data: { currency: 'usd', unit_amount: newTotal, recurring: { interval: 'month' }, product: productId },
          proration_behavior: 'create_prorations',
          metadata: { ...item.metadata, bitlink_intl_addon_removed_at: now },
        });
        await admin.from('subscribers').update({ monthly_price_cents: newTotal, updated_at: now }).eq('id', subscriber.id);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        billingNote = 'The number was released, but billing could not be reduced automatically — adjust the subscription manually.';
        log.error({ lineId, number, error: errMsg }, 'Intl number released but billing reduction failed');
      }
    }
  }

  const removedEntry = { ...entry, status: 'removed', removed_at: now };
  await admin
    .from('telecom_lines')
    .update({
      metadata: {
        ...meta,
        ...(isPrimary
          ? { intl_number: removedEntry }
          : { intl_numbers_extra: extras.map((e, i) => (i === extraIndex ? removedEntry : e)) }),
      },
      updated_at: now,
    })
    .eq('id', lineId);

  try {
    await admin.from('audit_logs').insert({
      actor_user_id: params.actorUserId ?? null,
      action: 'intl_number_removed',
      entity_type: 'telecom_line',
      entity_id: lineId,
      metadata: { number, wasPrimary: isPrimary, billingMode: entry.billing_mode ?? null },
    });
  } catch {
    // audit failure is non-fatal
  }

  return { success: `${number} released back to inventory.${billingNote ? ` ${billingNote}` : ''}` };
}
