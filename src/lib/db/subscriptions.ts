// Repository for the subscriptions table — Stripe subscription state tracking.
// Handles the upsert pattern required by Stripe's at-least-once event delivery.

import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

export interface SubscriptionRecord {
  id: string;
  customerId: string | null;
  planId: string | null;
  stripeSubscriptionId: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

type StripeSub = Stripe.Subscription & {
  // Legacy top-level fields (pre-2026-04-22 API). In 2026-04-22.dahlia these moved to
  // SubscriptionItem level — use getSubPeriod() instead of accessing these directly.
  current_period_start?: number;
  current_period_end?: number;
};

function getSubPeriod(sub: StripeSub): { start: number | null; end: number | null } {
  // In API 2026-04-22.dahlia period dates are on the first subscription item, not the sub root.
  const item = sub.items?.data?.[0] as (Stripe.SubscriptionItem & { current_period_start?: number; current_period_end?: number }) | undefined;
  const start = item?.current_period_start ?? sub.current_period_start ?? null;
  const end = item?.current_period_end ?? sub.current_period_end ?? null;
  return { start: start ?? null, end: end ?? null };
}

function rowToRecord(row: Record<string, unknown>): SubscriptionRecord {
  return {
    id: row.id as string,
    customerId: (row.customer_id ?? null) as string | null,
    planId: (row.plan_id ?? null) as string | null,
    stripeSubscriptionId: row.stripe_subscription_id as string,
    status: row.status as string,
    currentPeriodStart: (row.current_period_start ?? null) as string | null,
    currentPeriodEnd: (row.current_period_end ?? null) as string | null,
    cancelAtPeriodEnd: (row.cancel_at_period_end ?? false) as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function buildPeriodFields(sub: StripeSub): Record<string, unknown> {
  const { start, end } = getSubPeriod(sub);
  return {
    status: sub.status,
    cancel_at_period_end: sub.cancel_at_period_end,
    current_period_start: start ? new Date(start * 1000).toISOString() : null,
    current_period_end: end ? new Date(end * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  };
}

/** Create-or-update based on stripe_subscription_id. */
export async function upsertSubscription(
  admin: SupabaseClient,
  customerId: string | null,
  stripeSubscription: Stripe.Subscription,
): Promise<SubscriptionRecord> {
  const sub = stripeSubscription as StripeSub;
  const now = new Date().toISOString();

  const { data: existing } = await admin
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', sub.id)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await admin
      .from('subscriptions')
      .update({ ...buildPeriodFields(sub), customer_id: customerId } as never)
      .eq('id', existing.id)
      .select('*')
      .single();
    if (error || !data) throw new Error(`Failed to update subscription: ${error?.message}`);
    return rowToRecord(data as unknown as Record<string, unknown>);
  }

  const { data, error } = await admin
    .from('subscriptions')
    .insert({
      customer_id: customerId,
      stripe_subscription_id: sub.id,
      created_at: now,
      ...buildPeriodFields(sub),
    } as never)
    .select('*')
    .single();
  if (error || !data) throw new Error(`Failed to create subscription: ${error?.message}`);
  return rowToRecord(data as unknown as Record<string, unknown>);
}

export async function getSubscriptionByStripeId(
  admin: SupabaseClient,
  stripeSubscriptionId: string,
): Promise<SubscriptionRecord | null> {
  const { data, error } = await admin
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch subscription: ${error.message}`);
  if (!data) return null;
  return rowToRecord(data as unknown as Record<string, unknown>);
}

export async function updateSubscriptionFromStripe(
  admin: SupabaseClient,
  stripeSubscription: Stripe.Subscription,
): Promise<void> {
  const sub = stripeSubscription as StripeSub;
  const { error } = await admin
    .from('subscriptions')
    .update(buildPeriodFields(sub) as never)
    .eq('stripe_subscription_id', sub.id);
  if (error) throw new Error(`Failed to update subscription: ${error.message}`);
}
