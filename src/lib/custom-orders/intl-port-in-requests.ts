// Admin-tracked US/UK/Canada port-in requests for an already-active line.
//
// Unlike the checkout-time add-on flow, this covers a customer who already
// has a BitLink line and wants to bring an existing foreign number onto it
// later. There is no Annatel API for this — a real international port
// always requires manual coordination with the losing carrier abroad (an
// LOA, account number, transfer PIN), same as the existing /keep-your-number
// flow already tells customers to expect (3-5 business days). This module is
// pure tracking plus the "attach it once it's actually landed" step; nothing
// here emails Annatel automatically.
import type { SupabaseClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe/server';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';
import { usCanadaNumberAddOn } from '@/lib/plans';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'intl-port-in-requests' });

const PORT_FEE_CENTS = 4999;

export type IntlPortInRequest = {
  id: string;
  lineId: string;
  country: 'us' | 'canada' | 'uk';
  number: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  oneTimeFeeBillingMode: 'paid' | 'free';
  monthlyBillingMode: 'paid' | 'free';
  notes: string | null;
  createdAt: string;
  completedAt: string | null;
};

function toRequest(row: Record<string, unknown>): IntlPortInRequest {
  return {
    id: row.id as string,
    lineId: row.line_id as string,
    country: row.country as 'us' | 'canada' | 'uk',
    number: row.number as string,
    status: row.status as IntlPortInRequest['status'],
    oneTimeFeeBillingMode: row.one_time_fee_billing_mode as 'paid' | 'free',
    monthlyBillingMode: row.monthly_billing_mode as 'paid' | 'free',
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    completedAt: (row.completed_at as string | null) ?? null,
  };
}

export async function listIntlPortInRequests(admin: SupabaseClient, lineId: string): Promise<IntlPortInRequest[]> {
  const { data } = await admin
    .from('intl_port_in_requests')
    .select('*')
    .eq('line_id', lineId)
    .order('created_at', { ascending: false });
  return (data ?? []).map(toRequest);
}

export async function createIntlPortInRequest(params: {
  admin: SupabaseClient;
  lineId: string;
  country: 'us' | 'canada' | 'uk';
  number: string;
  oneTimeFeeBillingMode: 'paid' | 'free';
  monthlyBillingMode: 'paid' | 'free';
  actorUserId?: string | null;
}): Promise<{ success?: string; error?: string }> {
  const { admin, lineId, country, number, oneTimeFeeBillingMode, monthlyBillingMode, actorUserId } = params;
  const { error } = await admin.from('intl_port_in_requests').insert({
    line_id: lineId,
    country,
    number,
    one_time_fee_billing_mode: oneTimeFeeBillingMode,
    monthly_billing_mode: monthlyBillingMode,
    created_by: actorUserId ?? null,
  });
  if (error) return { error: error.message };
  return { success: `Port-in request tracked for ${number}. Remember: still needs the manual email to Annatel.` };
}

export async function setIntlPortInStatus(
  admin: SupabaseClient,
  requestId: string,
  status: 'in_progress' | 'cancelled',
): Promise<{ success?: string; error?: string }> {
  const { error } = await admin
    .from('intl_port_in_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', requestId);
  if (error) return { error: error.message };
  return { success: true as unknown as string };
}

// The number has actually landed with Annatel (confirmed manually, outside
// this system, after the losing carrier releases it). Attaches it to the
// line and bills according to the request's saved choices.
export async function completeIntlPortInRequest(
  admin: SupabaseClient,
  requestId: string,
): Promise<{ success?: string; error?: string }> {
  const { data: reqRow } = await admin.from('intl_port_in_requests').select('*').eq('id', requestId).maybeSingle();
  if (!reqRow) return { error: 'Port-in request not found.' };
  const request = toRequest(reqRow);
  if (request.status === 'completed') return { error: 'Already completed.' };

  const { data: line } = await admin
    .from('telecom_lines')
    .select('id, provider_line_id, metadata')
    .eq('id', request.lineId)
    .maybeSingle();
  if (!line?.provider_line_id) return { error: 'Line not found or not active with the carrier.' };

  const provider = getTelecomProvider();
  try {
    await provider.assignDid(line.provider_line_id as string, request.number);
  } catch (err) {
    return { error: err instanceof Error ? `Could not attach the number: ${err.message}` : 'Could not attach the number.' };
  }

  const now = new Date().toISOString();
  let billingNote: string | null = null;

  // Monthly add-on rate — same subscription-item fold used by the existing
  // international-number add-on, with the same double-billing guard.
  if (request.monthlyBillingMode === 'paid') {
    const { data: subscriber } = await admin
      .from('subscribers')
      .select('id, stripe_subscription_id, stripe_subscription_item_id, monthly_price_cents')
      .eq('telecom_line_id', request.lineId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const stripe = subscriber?.stripe_subscription_id ? getStripe() : null;
    if (!subscriber?.stripe_subscription_id || !stripe) {
      billingNote = 'No Stripe subscription linked — add the $9.99/mo charge manually if needed.';
    } else {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriber.stripe_subscription_id);
        const allItems = subscription.items.data;
        const addonPriceId = process.env.STRIPE_PRICE_US_CANADA_ADDON?.trim();
        const alreadyHasAddonItem = allItems.some(
          (i) => i.price.id === addonPriceId || i.price.metadata?.type === 'intl_number_addon',
        );
        if (!alreadyHasAddonItem) {
          const item = subscriber.stripe_subscription_item_id
            ? allItems.find((i) => i.id === subscriber.stripe_subscription_item_id)
            : allItems[0];
          if (!item) throw new Error('Could not find the Stripe subscription item for this line.');
          const productId = typeof item.price.product === 'string' ? item.price.product : item.price.product.id;
          const currentTotal = Number(subscriber.monthly_price_cents ?? item.price.unit_amount ?? 0);
          const newTotal = currentTotal + usCanadaNumberAddOn.priceCents;
          await stripe.subscriptionItems.update(item.id, {
            price_data: { currency: 'usd', unit_amount: newTotal, recurring: { interval: 'month' }, product: productId },
            proration_behavior: 'create_prorations',
            metadata: { ...item.metadata, bitlink_intl_addon: '1', bitlink_intl_addon_added_at: now },
          });
          await admin.from('subscribers').update({ monthly_price_cents: newTotal, updated_at: now }).eq('id', subscriber.id);
        }
      } catch (err) {
        billingNote = 'Number attached, but the $9.99/mo add-on could not be billed automatically.';
        log.error({ requestId, error: err instanceof Error ? err.message : String(err) }, 'Monthly billing fold failed');
      }
    }
  }

  // One-time port fee — a separate, one-off invoice, not a subscription
  // change. Failure here doesn't block the port itself.
  if (request.oneTimeFeeBillingMode === 'paid') {
    const { data: subscriber } = await admin
      .from('subscribers')
      .select('stripe_subscription_id')
      .eq('telecom_line_id', request.lineId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const stripe = subscriber?.stripe_subscription_id ? getStripe() : null;
    if (!subscriber?.stripe_subscription_id || !stripe) {
      billingNote = `${billingNote ?? ''} Could not charge the $49.99 port fee — no subscription on file, charge manually.`.trim();
    } else {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriber.stripe_subscription_id);
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
        await stripe.invoiceItems.create({
          customer: customerId,
          amount: PORT_FEE_CENTS,
          currency: 'usd',
          description: `Port-in fee — ${request.number}`,
        });
        const invoice = await stripe.invoices.create({ customer: customerId, auto_advance: true });
        if (invoice.id) await stripe.invoices.finalizeInvoice(invoice.id);
      } catch (err) {
        billingNote = `${billingNote ?? ''} Could not charge the $49.99 port fee automatically — charge it manually.`.trim();
        log.error({ requestId, error: err instanceof Error ? err.message : String(err) }, 'One-time port fee charge failed');
      }
    }
  }

  await admin
    .from('intl_port_in_requests')
    .update({ status: 'completed', completed_at: now, updated_at: now })
    .eq('id', requestId);

  const meta = (line.metadata ?? {}) as Record<string, unknown>;
  const existingIntl = meta.intl_number as Record<string, unknown> | undefined;
  const isSecondary = Boolean(existingIntl && ['reserved', 'assigned'].includes(String(existingIntl.status)));
  await admin
    .from('telecom_lines')
    .update({
      metadata: {
        ...meta,
        ...(isSecondary
          ? {
              intl_numbers_extra: [
                ...(Array.isArray(meta.intl_numbers_extra) ? (meta.intl_numbers_extra as Array<Record<string, unknown>>) : []),
                { country: request.country, source: 'port', number: request.number, status: 'assigned', assigned_at: now, billing_mode: request.monthlyBillingMode },
              ],
            }
          : {
              intl_number: {
                country: request.country,
                source: 'port',
                number: request.number,
                status: 'assigned',
                assigned_at: now,
                billing_mode: request.monthlyBillingMode,
              },
            }),
      },
      updated_at: now,
    })
    .eq('id', request.lineId);

  return { success: `${request.number} attached.${billingNote ? ` ${billingNote}` : ''}` };
}
