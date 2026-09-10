// Custom, per-customer monthly price override — a retention lever, not a
// plan change. The line's carrier plan and product features are completely
// untouched; only what Stripe bills changes. Built for the case where a
// customer would otherwise cancel (or already asked for something cheaper)
// and a lower price keeps them, rather than for public/advertised pricing.
//
// Deliberately separate from changeLinePlan (line-plan-change.ts): that
// function swaps between real named plans (Basic, Student 5G, ...) and
// moves the carrier-side plan along with billing. This only ever touches
// the Stripe subscription item's price — there is no "custom plan" on the
// carrier side to keep in sync, which is what makes a one-off dollar amount
// safe to expose here without duplicating the plan-change machinery.

import type { SupabaseClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe/server';

export type CustomPriceResult = { success?: string; error?: string };

async function getSubscriberForLine(admin: SupabaseClient, lineId: string) {
  const { data } = await admin
    .from('subscribers')
    .select('id, stripe_subscription_id, monthly_price_cents')
    .eq('telecom_line_id', lineId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function setCustomLinePrice(params: {
  admin: SupabaseClient;
  lineId: string;
  newPriceCents: number;
  reason: string;
  applyImmediately: boolean;
  actorUserId?: string | null;
}): Promise<CustomPriceResult> {
  const { admin, lineId, newPriceCents, reason } = params;

  if (!Number.isFinite(newPriceCents) || newPriceCents < 0) {
    return { error: 'Enter a valid amount.' };
  }
  if (!reason.trim()) {
    return { error: 'A reason is required — this overrides a published price, and six months from now nobody will remember why without one.' };
  }

  const subscriber = await getSubscriberForLine(admin, lineId);
  if (!subscriber?.stripe_subscription_id) {
    return { error: 'No active Stripe subscription is linked to this line.' };
  }

  const stripe = getStripe();
  if (!stripe) return { error: 'Stripe is not configured.' };

  const subscription = await stripe.subscriptions.retrieve(subscriber.stripe_subscription_id);
  const item = subscription.items.data[0];
  if (!item) return { error: 'Could not find the subscription item to update.' };

  const previousPriceCents = subscriber.monthly_price_cents ?? item.price.unit_amount ?? 0;
  const currency = item.price.currency;
  // Reuse the existing product (e.g. "BitLink Basic") rather than minting a
  // new one — this is still that plan, just at a negotiated price. Keeps
  // Stripe's own product-level reporting meaningful instead of scattering a
  // stray product per discount.
  const productId = typeof item.price.product === 'string' ? item.price.product : item.price.product.id;

  try {
    await stripe.subscriptionItems.update(item.id, {
      price_data: {
        currency,
        product: productId,
        unit_amount: newPriceCents,
        recurring: { interval: 'month' },
      },
      proration_behavior: params.applyImmediately ? 'create_prorations' : 'none',
      metadata: {
        ...item.metadata,
        custom_price_reason: reason,
        custom_price_set_at: new Date().toISOString(),
        custom_price_previous_cents: String(previousPriceCents),
      },
    });
  } catch (err) {
    return {
      error: err instanceof Error ? `Stripe rejected the change: ${err.message}` : 'Stripe rejected the change.',
    };
  }

  await admin
    .from('subscribers')
    .update({ monthly_price_cents: newPriceCents, updated_at: new Date().toISOString() })
    .eq('id', subscriber.id);

  if (params.actorUserId) {
    try {
      await admin.from('audit_logs').insert({
        actor_user_id: params.actorUserId,
        action: 'line_custom_price_set',
        entity_type: 'telecom_line',
        entity_id: lineId,
        metadata: {
          previousPriceCents,
          newPriceCents,
          reason,
          appliedImmediately: params.applyImmediately,
          stripeSubscriptionId: subscriber.stripe_subscription_id,
        },
      });
    } catch {
      // audit failure is non-fatal
    }
  }

  const from = (previousPriceCents / 100).toFixed(2);
  const to = (newPriceCents / 100).toFixed(2);
  return {
    success: params.applyImmediately
      ? `Price changed from $${from} to $${to}/month, effective now — Stripe will prorate this cycle.`
      : `Price changed from $${from} to $${to}/month, effective next renewal. This month's bill is unaffected.`,
  };
}
