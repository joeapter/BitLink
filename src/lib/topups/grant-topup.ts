import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/server';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';
import { withProviderContext } from '@/lib/telecom/provider-context';
import { topups, type TopUpId } from '@/lib/topups';
import { sendEmail } from '@/lib/email/send';
import { buildFreeTopupGiftEmail } from '@/lib/email/templates';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'grant-topup' });

export type GrantTopupResult = { success?: string; error?: string };

function getTopup(topupId: string) {
  return topups.find((t) => t.id === topupId) ?? null;
}

async function getLineWithCustomer(admin: SupabaseClient, lineId: string) {
  const { data: line } = await admin
    .from('telecom_lines')
    .select('id, status, provider_line_id, customer_id, is_kosher')
    .eq('id', lineId)
    .maybeSingle();
  if (!line) return null;

  const { data: customer } = line.customer_id
    ? await admin.from('customers').select('id, full_name, email').eq('id', line.customer_id).maybeSingle()
    : { data: null };

  return { line, customer };
}

async function getSubscriberForLine(admin: SupabaseClient, lineId: string) {
  const { data } = await admin
    .from('subscribers')
    .select('id, stripe_subscription_id, stripe_subscription_item_id, stripe_customer_id')
    .eq('telecom_line_id', lineId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as {
    id: string;
    stripe_subscription_id: string | null;
    stripe_subscription_item_id: string | null;
    stripe_customer_id: string | null;
  } | null;
}

// Charges a one-time amount right now (not on the next scheduled renewal) by
// creating an ad-hoc invoice for just this item and paying it immediately
// against the customer's saved payment method.
async function chargeOneTimeInvoice(
  stripe: Stripe,
  params: { stripeCustomerId: string; stripeSubscriptionId: string | null; productId: string; unitAmount: number; description: string },
): Promise<void> {
  await stripe.invoiceItems.create({
    customer: params.stripeCustomerId,
    price_data: {
      currency: 'usd',
      unit_amount: params.unitAmount,
      product: params.productId,
    },
    description: params.description,
  });

  const invoice = await stripe.invoices.create({
    customer: params.stripeCustomerId,
    auto_advance: true,
    collection_method: 'charge_automatically',
  });
  await stripe.invoices.finalizeInvoice(invoice.id!);
  await stripe.invoices.pay(invoice.id!);
}

export async function grantTopup(params: {
  admin: SupabaseClient;
  lineId: string;
  topupId: TopUpId | string;
  frequency: 'once' | 'monthly';
  billingMode: 'free' | 'paid';
  source: 'admin' | 'self_serve';
  actorUserId?: string | null;
}): Promise<GrantTopupResult> {
  const { admin, lineId, frequency, billingMode, source } = params;

  const topup = getTopup(params.topupId);
  if (!topup) return { error: 'Choose a valid topup.' };

  const found = await getLineWithCustomer(admin, lineId);
  if (!found) return { error: 'Line not found.' };
  const { line, customer } = found;

  if (!line.provider_line_id) return { error: 'This line is not active with the carrier yet.' };
  if (!['active', 'suspended'].includes(String(line.status))) {
    return { error: 'Only an active line can receive a topup.' };
  }
  if (topup.forKosher !== Boolean(line.is_kosher)) {
    return { error: `${topup.name} is not available for this line type.` };
  }

  let stripeSubscriptionItemId: string | null = null;

  if (billingMode === 'paid') {
    const subscriber = await getSubscriberForLine(admin, lineId);
    const stripeCustomerId = subscriber?.stripe_customer_id;
    if (!subscriber?.stripe_subscription_id || !stripeCustomerId) {
      return { error: 'No Stripe subscription is linked to this line.' };
    }
    const stripe = getStripe();
    if (!stripe) return { error: 'Stripe is not configured.' };

    const priceId = process.env[topup.stripeEnvKey]?.trim();
    if (!priceId) return { error: `Stripe price is missing for ${topup.name}.` };

    try {
      if (frequency === 'monthly') {
        const item = await stripe.subscriptionItems.create({
          subscription: subscriber.stripe_subscription_id,
          price: priceId,
          quantity: 1,
          proration_behavior: 'create_prorations',
          metadata: {
            topup_id: topup.id,
            telecom_line_id: lineId,
            source: `bitlink_topup_${source}`,
          },
        });
        stripeSubscriptionItemId = item.id;
      } else {
        const price = await stripe.prices.retrieve(priceId);
        const productId = typeof price.product === 'string' ? price.product : price.product.id;
        await chargeOneTimeInvoice(stripe, {
          stripeCustomerId,
          stripeSubscriptionId: subscriber.stripe_subscription_id,
          productId,
          unitAmount: topup.priceCents,
          description: topup.name,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ lineId, topupId: topup.id, error: message }, 'Topup billing failed');
      return { error: `Billing failed: ${message}` };
    }
  }

  const provider = getTelecomProvider();
  try {
    await withProviderContext({ correlationId: crypto.randomUUID(), telecomLineId: lineId }, () =>
      provider.addTopup(line.provider_line_id as string, topup.annatelPlanName),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ lineId, topupId: topup.id, error: message }, 'Topup carrier grant failed');
    // Billing (if any) already succeeded at this point — surfaced, not silent.
    return {
      error: billingMode === 'paid'
        ? `Charged, but the carrier grant failed: ${message}. Contact support to resolve.`
        : `Could not grant the topup: ${message}`,
    };
  }

  await admin.from('line_topup_grants').insert({
    line_id: lineId,
    topup_id: topup.id,
    topup_name: topup.annatelPlanName,
    label: topup.name,
    frequency,
    billing_mode: billingMode,
    status: 'active',
    stripe_subscription_item_id: stripeSubscriptionItemId,
    source,
    created_by: params.actorUserId ?? null,
  });

  try {
    await admin.from('audit_logs').insert({
      actor_user_id: params.actorUserId ?? null,
      action: 'topup_granted',
      entity_type: 'telecom_line',
      entity_id: lineId,
      metadata: { topupId: topup.id, frequency, billingMode, source },
    });
  } catch {
    // audit failure is non-fatal
  }

  if (billingMode === 'free' && customer?.email) {
    sendEmail({
      to: customer.email,
      subject: `A free gift from BitLink — ${topup.name}`,
      html: buildFreeTopupGiftEmail({
        fullName: customer.full_name ?? customer.email,
        topupLabel: topup.name,
        recurring: frequency === 'monthly',
      }),
    }).catch((err) => {
      log.error({ lineId, error: err instanceof Error ? err.message : String(err) }, 'Failed to send free topup gift email');
    });
  }

  const cadence = frequency === 'monthly' ? 'every month' : 'once';
  const cost = billingMode === 'free' ? 'at no charge' : 'billed to the subscription';
  return { success: `${topup.name} granted ${cadence}, ${cost}.` };
}

function firstOfMonthIso(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

export type MonthlyTopupRunResult = { month: string; applied: number; skipped: number; failed: number };

// Re-applies every active monthly topup grant for the current calendar
// month — same idempotency shape as processMonthlyReferralBonuses (daily
// cron, unique per grant+month so re-running mid-month is always safe).
// Paid grants already bill automatically via their own subscription item;
// this only re-applies the carrier-side data/minutes grant.
export async function processMonthlyTopupGrants(admin: SupabaseClient, date = new Date()): Promise<MonthlyTopupRunResult> {
  const grantMonth = firstOfMonthIso(date);
  const result: MonthlyTopupRunResult = { month: grantMonth, applied: 0, skipped: 0, failed: 0 };

  const { data: grants } = await admin
    .from('line_topup_grants')
    .select('id, line_id, topup_name')
    .eq('frequency', 'monthly')
    .eq('status', 'active');

  const provider = getTelecomProvider();

  for (const grant of grants ?? []) {
    const { data: existingRun } = await admin
      .from('line_topup_grant_runs')
      .select('id, status')
      .eq('grant_id', grant.id)
      .eq('grant_month', grantMonth)
      .maybeSingle();

    if (existingRun?.status === 'applied') {
      result.skipped++;
      continue;
    }

    const { data: line } = await admin
      .from('telecom_lines')
      .select('id, provider_line_id, status')
      .eq('id', grant.line_id)
      .maybeSingle();

    if (!line?.provider_line_id || !['active', 'suspended'].includes(String(line.status))) {
      result.skipped++;
      continue;
    }

    const runId = existingRun?.id as string | undefined;
    const pendingRun = { grant_id: grant.id, grant_month: grantMonth, status: 'pending', error: null };
    if (runId) {
      await admin.from('line_topup_grant_runs').update(pendingRun).eq('id', runId);
    } else {
      await admin.from('line_topup_grant_runs').insert(pendingRun);
    }

    try {
      await withProviderContext({ correlationId: crypto.randomUUID(), telecomLineId: grant.line_id as string }, () =>
        provider.addTopup(line.provider_line_id as string, grant.topup_name as string),
      );
      await admin
        .from('line_topup_grant_runs')
        .update({ status: 'applied', applied_at: new Date().toISOString() })
        .eq('grant_id', grant.id)
        .eq('grant_month', grantMonth);
      result.applied++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await admin
        .from('line_topup_grant_runs')
        .update({ status: 'failed', error: message })
        .eq('grant_id', grant.id)
        .eq('grant_month', grantMonth);
      log.error({ grantId: grant.id, lineId: grant.line_id, error: message }, 'Monthly topup re-grant failed');
      result.failed++;
    }
  }

  return result;
}

export async function cancelTopupGrant(params: {
  admin: SupabaseClient;
  grantId: string;
  actorUserId?: string | null;
}): Promise<GrantTopupResult> {
  const { admin, grantId } = params;

  const { data: grant } = await admin
    .from('line_topup_grants')
    .select('id, line_id, status, frequency, billing_mode, stripe_subscription_item_id, label')
    .eq('id', grantId)
    .maybeSingle();

  if (!grant) return { error: 'Grant not found.' };
  if (grant.status === 'cancelled') return { error: 'This grant is already cancelled.' };

  if (grant.billing_mode === 'paid' && grant.stripe_subscription_item_id) {
    const stripe = getStripe();
    if (stripe) {
      await stripe.subscriptionItems.del(grant.stripe_subscription_item_id as string).catch((err) => {
        log.error({ grantId, error: err instanceof Error ? err.message : String(err) }, 'Failed to remove Stripe subscription item on cancel');
      });
    }
  }

  await admin
    .from('line_topup_grants')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', grantId);

  try {
    await admin.from('audit_logs').insert({
      actor_user_id: params.actorUserId ?? null,
      action: 'topup_grant_cancelled',
      entity_type: 'telecom_line',
      entity_id: grant.line_id as string,
      metadata: { grantId },
    });
  } catch {
    // audit failure is non-fatal
  }

  return { success: `${grant.label} cancelled — no further monthly grants or charges.` };
}
