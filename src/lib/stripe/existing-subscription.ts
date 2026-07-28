import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';

// Finds a customer's active/trialing Stripe subscription, if any — used to
// decide whether a new line can be added directly to existing billing
// (prorated, no new payment link) instead of starting a fresh checkout.
// Checks the local `subscriptions` table first (cheap, no Stripe call) and
// only hits Stripe to confirm live status once a candidate is found.
export async function getActiveStripeSubscription(
  admin: SupabaseClient,
  stripe: Stripe,
  customerId: string,
): Promise<Stripe.Subscription | null> {
  const { data: subscriptionRow } = await admin
    .from('subscriptions')
    .select('stripe_subscription_id, status')
    .eq('customer_id', customerId)
    .not('stripe_subscription_id', 'is', null)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const stripeSubscriptionId = subscriptionRow?.stripe_subscription_id as string | undefined;
  if (!stripeSubscriptionId) return null;

  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  return ['active', 'trialing'].includes(subscription.status) ? subscription : null;
}
