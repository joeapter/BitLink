// Repository for subscribers — the domain bridge between Stripe billing
// and telecom line lifecycle.

import type { SupabaseClient } from '@supabase/supabase-js';

export interface Subscriber {
  id: string;
  customerId: string | null;
  stripeSubscriptionId: string;
  stripeSubscriptionItemId: string | null;
  stripeCustomerId: string;
  planSlug: string;
  monthlyPriceCents: number | null;
  telecomLineId: string | null;
  provisioningJobId: string | null;
  originatingStripeEventId: string | null;
  status: string;
  correlationId: string | null;
  activatedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function rowToSubscriber(row: Record<string, unknown>): Subscriber {
  return {
    id: row.id as string,
    customerId: (row.customer_id ?? null) as string | null,
    stripeSubscriptionId: row.stripe_subscription_id as string,
    stripeSubscriptionItemId: (row.stripe_subscription_item_id ?? null) as string | null,
    stripeCustomerId: row.stripe_customer_id as string,
    planSlug: row.plan_slug as string,
    monthlyPriceCents: (row.monthly_price_cents ?? null) as number | null,
    telecomLineId: (row.telecom_line_id ?? null) as string | null,
    provisioningJobId: (row.provisioning_job_id ?? null) as string | null,
    originatingStripeEventId: (row.originating_stripe_event_id ?? null) as string | null,
    status: row.status as string,
    correlationId: (row.correlation_id ?? null) as string | null,
    activatedAt: (row.activated_at ?? null) as string | null,
    cancelledAt: (row.cancelled_at ?? null) as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export interface CreateSubscriberInput {
  customerId?: string | null;
  stripeSubscriptionId: string;
  stripeSubscriptionItemId?: string | null;
  stripeCustomerId: string;
  planSlug: string;
  monthlyPriceCents?: number | null;
  originatingStripeEventId?: string | null;
  correlationId?: string | null;
  status?: string;
}

export async function createSubscriber(
  admin: SupabaseClient,
  input: CreateSubscriberInput,
): Promise<Subscriber> {
  const { data, error } = await admin
    .from('subscribers')
    .insert({
      customer_id: input.customerId ?? null,
      stripe_subscription_id: input.stripeSubscriptionId,
      stripe_subscription_item_id: input.stripeSubscriptionItemId ?? null,
      stripe_customer_id: input.stripeCustomerId,
      plan_slug: input.planSlug,
      monthly_price_cents: input.monthlyPriceCents ?? null,
      originating_stripe_event_id: input.originatingStripeEventId ?? null,
      correlation_id: input.correlationId ?? null,
      status: input.status ?? 'pending',
    })
    .select('*')
    .single();
  if (error || !data) throw new Error(`Failed to create subscriber: ${error?.message}`);
  return rowToSubscriber(data as unknown as Record<string, unknown>);
}

export async function getSubscriberByStripeSubscription(
  admin: SupabaseClient,
  stripeSubscriptionId: string,
): Promise<Subscriber | null> {
  const { data, error } = await admin
    .from('subscribers')
    .select('*')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch subscriber: ${error.message}`);
  if (!data) return null;
  return rowToSubscriber(data as unknown as Record<string, unknown>);
}

export async function getSubscribersByStripeSubscription(
  admin: SupabaseClient,
  stripeSubscriptionId: string,
): Promise<Subscriber[]> {
  const { data, error } = await admin
    .from('subscribers')
    .select('*')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Failed to fetch subscribers: ${error.message}`);
  return (data ?? []).map((row) => rowToSubscriber(row as unknown as Record<string, unknown>));
}

export async function getSubscriberByStripeSubscriptionItem(
  admin: SupabaseClient,
  stripeSubscriptionItemId: string,
): Promise<Subscriber | null> {
  const { data, error } = await admin
    .from('subscribers')
    .select('*')
    .eq('stripe_subscription_item_id', stripeSubscriptionItemId)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch subscriber item: ${error.message}`);
  if (!data) return null;
  return rowToSubscriber(data as unknown as Record<string, unknown>);
}

export async function updateSubscriber(
  admin: SupabaseClient,
  id: string,
  updates: {
    status?: string;
    telecomLineId?: string | null;
    provisioningJobId?: string | null;
    stripeSubscriptionItemId?: string | null;
    monthlyPriceCents?: number | null;
    activatedAt?: string | null;
    cancelledAt?: string | null;
  },
): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.status !== undefined) patch.status = updates.status;
  if ('telecomLineId' in updates) patch.telecom_line_id = updates.telecomLineId;
  if ('provisioningJobId' in updates) patch.provisioning_job_id = updates.provisioningJobId;
  if ('stripeSubscriptionItemId' in updates) patch.stripe_subscription_item_id = updates.stripeSubscriptionItemId;
  if ('monthlyPriceCents' in updates) patch.monthly_price_cents = updates.monthlyPriceCents;
  if ('activatedAt' in updates) patch.activated_at = updates.activatedAt;
  if ('cancelledAt' in updates) patch.cancelled_at = updates.cancelledAt;

  const { error } = await admin
    .from('subscribers')
    .update(patch as never)
    .eq('id', id);
  if (error) throw new Error(`Failed to update subscriber: ${error.message}`);
}
