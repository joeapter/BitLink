import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { createSubscriber, getSubscriberByStripeSubscriptionItem, updateSubscriber } from '@/lib/db/subscribers';
import { createProvisioningJob } from '@/lib/provisioning/orchestrator';
import { getAnnatelPlanName, getPlan } from '@/lib/plans';
import type { CustomOrderLine } from '@/lib/stripe/custom-orders';

export type ProvisionSubscriptionLineInput = {
  line: CustomOrderLine;
  index: number;
  subscriptionItem: Stripe.SubscriptionItem;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  customerRecordId: string | null;
  customerEmail: string | null;
  userId?: string | null;
  originatingStripeEventId?: string | null;
  customOrderToken?: string | null;
  source: 'stripe_custom_order' | 'account_add_line';
};

export type ProvisionSubscriptionLinesResult = {
  subscriberIds: string[];
  jobIds: string[];
  lineIds: string[];
};

function buildLineMetadata(input: ProvisionSubscriptionLineInput, correlationId: string) {
  const now = new Date().toISOString();
  const line = input.line;
  const metadata: Record<string, unknown> = {
    source: input.source,
    stripe_subscription_id: input.stripeSubscriptionId,
    stripe_subscription_item_id: input.subscriptionItem.id,
    stripe_customer_id: input.stripeCustomerId,
    custom_order_token: input.customOrderToken ?? null,
    custom_order_line_index: input.index,
    correlation_id: correlationId,
    plan_slug: line.planSlug,
    is_esim: line.isEsim,
    user_id: input.userId ?? null,
    custom_price_cents: line.customPriceCents,
  };

  if (line.isPortIn && line.portNumber) {
    metadata.pending_port_in_number = line.portNumber;
  }

  if (line.wantsIntlNumber) {
    if (line.intlSource === 'port' && line.intlPortNumber) {
      metadata.intl_port_in = {
        number: line.intlPortNumber,
        country: line.intlCountry ?? 'us',
        source: 'port',
        status: 'awaiting_israeli_line',
        annatel_bur_id: null,
        error: null,
        attempted_at: null,
        created_at: now,
      };
    } else {
      metadata.intl_number = {
        country: line.intlCountry ?? 'us',
        source: 'new',
        status: 'awaiting_fulfillment',
        requested_at: now,
      };
    }
  }

  return metadata;
}

async function getExistingJobId(admin: SupabaseClient, idempotencyKey: string): Promise<string | null> {
  const { data } = await admin
    .from('provisioning_jobs')
    .select('id')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

export async function provisionSubscriptionLines(
  admin: SupabaseClient,
  inputs: ProvisionSubscriptionLineInput[],
): Promise<ProvisionSubscriptionLinesResult> {
  const subscriberIds: string[] = [];
  const jobIds: string[] = [];
  const lineIds: string[] = [];

  for (const input of inputs) {
    const existingSubscriber = await getSubscriberByStripeSubscriptionItem(admin, input.subscriptionItem.id);
    if (existingSubscriber) {
      subscriberIds.push(existingSubscriber.id);
      if (existingSubscriber.provisioningJobId) jobIds.push(existingSubscriber.provisioningJobId);
      if (existingSubscriber.telecomLineId) lineIds.push(existingSubscriber.telecomLineId);
      continue;
    }

    const plan = getPlan(input.line.planSlug);
    const isKosher = plan.isKosher;
    const isEsim = isKosher ? false : input.line.isEsim;
    const correlationId = crypto.randomUUID();
    const externalId = `stripe_item_${input.subscriptionItem.id}`;
    let lineId: string;

    const { data: existingLine } = await admin
      .from('telecom_lines')
      .select('id')
      .eq('external_id', externalId)
      .maybeSingle();

    if (existingLine?.id) {
      lineId = existingLine.id as string;
    } else {
      const { data: newLine, error: lineError } = await admin
        .from('telecom_lines')
        .insert({
          external_id: externalId,
          customer_id: input.customerRecordId,
          status: 'draft',
          is_kosher: isKosher,
          metadata: buildLineMetadata(
            { ...input, line: { ...input.line, isEsim } },
            correlationId,
          ) as never,
        })
        .select('id')
        .single();

      if (lineError || !newLine) {
        throw new Error(`Failed to create telecom line for subscription item ${input.subscriptionItem.id}: ${lineError?.message}`);
      }
      lineId = newLine.id as string;
    }

    const jobIdempotencyKey = `create_line:${input.subscriptionItem.id}`;
    let jobId = await getExistingJobId(admin, jobIdempotencyKey);

    if (!jobId) {
      const identityNumber =
        process.env.PORT_IN_DEFAULT_ID?.trim() ??
        process.env.ANNATEL_DEFAULT_IDENTITY_NUMBER?.trim() ??
        '341280188';

      const job = await createProvisioningJob({
        lineId,
        type: 'create_line',
        payload: {
          externalId,
          planName: getAnnatelPlanName(input.line.planSlug),
          isKosher,
          ...(input.customerEmail ? { email: input.customerEmail } : {}),
          identityNumber,
          language: 'he_IL',
          ...(input.line.isPortIn && input.line.portNumber ? {
            portInParams: {
              number: input.line.portNumber,
              identityNumber,
              authenticationType: 'sms_code',
            },
          } : {}),
          metadata: {
            stripe_subscription_id: input.stripeSubscriptionId,
            stripe_subscription_item_id: input.subscriptionItem.id,
            stripe_customer_id: input.stripeCustomerId,
            custom_order_token: input.customOrderToken ?? null,
            custom_order_line_index: input.index,
            correlation_id: correlationId,
            source: input.source,
            is_esim: isEsim,
            user_id: input.userId ?? null,
          },
        },
        idempotencyKey: jobIdempotencyKey,
        maxAttempts: 3,
      });
      jobId = job.id;
    }

    const subscriber = await createSubscriber(admin, {
      customerId: input.customerRecordId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      stripeSubscriptionItemId: input.subscriptionItem.id,
      stripeCustomerId: input.stripeCustomerId,
      planSlug: input.line.planSlug,
      monthlyPriceCents: input.line.customPriceCents,
      originatingStripeEventId: input.originatingStripeEventId ?? null,
      correlationId,
      status: 'provisioning',
    });

    await updateSubscriber(admin, subscriber.id, {
      telecomLineId: lineId,
      provisioningJobId: jobId,
    });

    subscriberIds.push(subscriber.id);
    jobIds.push(jobId);
    lineIds.push(lineId);
  }

  return {
    subscriberIds,
    jobIds: [...new Set(jobIds)],
    lineIds,
  };
}
