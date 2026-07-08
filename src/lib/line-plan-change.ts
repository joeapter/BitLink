import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { getAnnatelPlanName, getPlan, getStripePriceId, plans, type PlanSlug } from '@/lib/plans';
import { getStripe } from '@/lib/stripe/server';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';

export type PlanChangeBillingMode = 'paid' | 'carrier_only';

export type PlanChangeResult = {
  success?: string;
  error?: string;
};

type AdminClient = SupabaseClient;

type SubscriberForPlanChange = {
  id: string;
  stripe_subscription_id: string;
  stripe_subscription_item_id: string | null;
  plan_slug: string;
  monthly_price_cents: number | null;
};

function isPlanSlug(value: string): value is PlanSlug {
  return plans.some((plan) => plan.slug === value);
}

async function getPlanBilling(admin: AdminClient, planSlug: PlanSlug) {
  const plan = getPlan(planSlug);
  const { data: planRow } = await admin
    .from('plans')
    .select('id, stripe_price_id, monthly_price_cents')
    .eq('slug', planSlug)
    .maybeSingle();

  return {
    plan,
    planId: (planRow?.id ?? null) as string | null,
    priceId: ((planRow?.stripe_price_id as string | null | undefined) ?? getStripePriceId(plan)).trim(),
    priceCents: Number(planRow?.monthly_price_cents ?? plan.priceCents),
  };
}

async function getSubscriberForLine(admin: AdminClient, lineId: string): Promise<SubscriberForPlanChange | null> {
  const { data } = await admin
    .from('subscribers')
    .select('id, stripe_subscription_id, stripe_subscription_item_id, plan_slug, monthly_price_cents')
    .eq('telecom_line_id', lineId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as SubscriberForPlanChange | null) ?? null;
}

async function getSubscriptionItem(
  stripe: Stripe,
  subscriber: SubscriberForPlanChange,
) {
  const subscription = await stripe.subscriptions.retrieve(subscriber.stripe_subscription_id);
  return subscriber.stripe_subscription_item_id
    ? subscription.items.data.find((item) => item.id === subscriber.stripe_subscription_item_id) ?? null
    : subscription.items.data[0] ?? null;
}

async function logPlanChange(
  admin: AdminClient,
  actorUserId: string | null | undefined,
  lineId: string,
  metadata: Record<string, unknown>,
) {
  if (!actorUserId) return;
  await admin.from('audit_logs').insert({
    actor_user_id: actorUserId,
    action: 'line_plan_changed',
    entity_type: 'telecom_line',
    entity_id: lineId,
    metadata,
  });
}

export async function changeLinePlan(params: {
  admin: AdminClient;
  lineId: string;
  newPlanSlug: string;
  billingMode: PlanChangeBillingMode;
  actorUserId?: string | null;
  linePlanId?: string | null;
}): Promise<PlanChangeResult> {
  const { admin, lineId, billingMode } = params;
  const newPlanSlug = params.newPlanSlug.trim();
  if (!isPlanSlug(newPlanSlug)) return { error: 'Choose a valid BitLink plan.' };

  const { data: line } = await admin
    .from('telecom_lines')
    .select('id, status, provider_line_id, is_kosher, metadata')
    .eq('id', lineId)
    .maybeSingle();

  if (!line) return { error: 'Line not found.' };
  if (!line.provider_line_id) return { error: 'This line is not active with Annatel yet.' };
  if (!['active', 'suspended'].includes(String(line.status))) {
    return { error: 'Only active or suspended lines can change plans.' };
  }

  const newBilling = await getPlanBilling(admin, newPlanSlug);
  const newPlan = newBilling.plan;
  if (Boolean(line.is_kosher) !== newPlan.isKosher) {
    return { error: 'Choose a plan with the same kosher/non-kosher line type.' };
  }

  const subscriber = await getSubscriberForLine(admin, lineId);
  const metadata = ((line.metadata ?? {}) as Record<string, unknown>) ?? {};
  const currentPlanSlug = String(metadata.plan_slug ?? subscriber?.plan_slug ?? '');
  const currentPlan = getPlan(currentPlanSlug);
  const preservedBillingCents = Number(subscriber?.monthly_price_cents ?? currentPlan.priceCents);

  let stripe: Stripe | null = null;
  let stripeItem: Stripe.SubscriptionItem | null = null;
  if (billingMode === 'paid') {
    if (!newBilling.priceId) return { error: `Stripe price is missing for ${newPlan.name}.` };
    if (!subscriber) return { error: 'No Stripe subscriber record is linked to this line.' };
    stripe = getStripe();
    if (!stripe) return { error: 'Stripe is not configured for plan changes.' };
    stripeItem = await getSubscriptionItem(stripe, subscriber);
    if (!stripeItem) return { error: 'Could not find the Stripe subscription item for this line.' };
  }

  const provider = getTelecomProvider();
  const providerLineId = line.provider_line_id as string;
  const livePlans = await provider.listLinePlans(providerLineId);
  const currentLinePlan =
    (params.linePlanId ? livePlans.find((plan) => plan.id === params.linePlanId) : null) ??
    livePlans.find((plan) => plan.isMain && !plan.endAt) ??
    livePlans.find((plan) => !plan.endAt) ??
    livePlans[0];

  if (!currentLinePlan) return { error: 'Could not find the active carrier plan for this line.' };

  const newCarrierPlanName = getAnnatelPlanName(newPlanSlug);
  const oldCarrierPlanName = currentLinePlan.planName;
  const oldLinePlanId = currentLinePlan.id;
  const changedAt = new Date().toISOString();

  if (oldCarrierPlanName !== newCarrierPlanName) {
    await provider.replacePlan(providerLineId, oldLinePlanId, newCarrierPlanName);
  }

  try {
    if (billingMode === 'paid' && stripe && stripeItem) {
      await stripe.subscriptionItems.update(stripeItem.id, {
        price: newBilling.priceId,
        proration_behavior: 'create_prorations',
        metadata: {
          ...stripeItem.metadata,
          plan_slug: newPlanSlug,
          bitlink_plan_changed_at: changedAt,
          bitlink_plan_change_mode: 'paid',
          bitlink_previous_plan_slug: currentPlanSlug,
        },
      });
    } else if (subscriber) {
      const maybeStripe = getStripe();
      if (maybeStripe && subscriber.stripe_subscription_item_id) {
        const item = await getSubscriptionItem(maybeStripe, subscriber).catch(() => null);
        if (item) {
          await maybeStripe.subscriptionItems.update(item.id, {
            metadata: {
              ...item.metadata,
              plan_slug: newPlanSlug,
              bitlink_plan_changed_at: changedAt,
              bitlink_plan_change_mode: 'carrier_only',
              bitlink_previous_plan_slug: currentPlanSlug,
            },
          }).catch(() => {});
        }
      }
    }
  } catch (err) {
    try {
      const refreshed = await provider.listLinePlans(providerLineId);
      const replacement =
        refreshed.find((plan) => plan.planName === newCarrierPlanName && !plan.endAt) ??
        refreshed.find((plan) => plan.isMain && !plan.endAt) ??
        refreshed.find((plan) => !plan.endAt);
      if (replacement) await provider.replacePlan(providerLineId, replacement.id, oldCarrierPlanName);
    } catch {
      // Manual follow-up is required if rollback also fails.
    }
    return {
      error: err instanceof Error
        ? `Carrier change was rolled back because billing failed: ${err.message}`
        : 'Carrier change was rolled back because billing failed.',
    };
  }

  const nextMetadata = {
    ...metadata,
    plan_slug: newPlanSlug,
    provider_plan_name: newCarrierPlanName,
    previous_plan_slug: currentPlanSlug || null,
    previous_provider_plan_name: oldCarrierPlanName,
    plan_changed_at: changedAt,
    plan_change_mode: billingMode,
  };

  await admin
    .from('telecom_lines')
    .update({ metadata: nextMetadata as never, updated_at: changedAt })
    .eq('id', lineId);

  if (subscriber) {
    const subscriberPatch: Record<string, unknown> = {
      plan_slug: newPlanSlug,
      updated_at: changedAt,
    };
    subscriberPatch.monthly_price_cents = billingMode === 'paid' ? newBilling.priceCents : preservedBillingCents;
    await admin.from('subscribers').update(subscriberPatch as never).eq('id', subscriber.id);
  }

  if (billingMode === 'paid' && newBilling.planId && subscriber?.stripe_subscription_id) {
    await admin
      .from('subscriptions')
      .update({ plan_id: newBilling.planId, updated_at: changedAt })
      .eq('stripe_subscription_id', subscriber.stripe_subscription_id);
  }

  await logPlanChange(admin, params.actorUserId, lineId, {
    providerLineId,
    oldCarrierPlanName,
    newCarrierPlanName,
    oldPlanSlug: currentPlanSlug,
    newPlanSlug,
    billingMode,
  });

  return {
    success:
      billingMode === 'paid'
        ? `Plan changed to ${newPlan.name}. Billing was updated with Stripe proration.`
        : `Carrier plan changed to ${newPlan.name}. Billing was left unchanged.`,
  };
}
