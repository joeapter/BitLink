import type { NextRequest } from 'next/server';
import { z } from 'zod';
import type Stripe from 'stripe';
import { inngest } from '@/inngest/client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { provisionSubscriptionLines } from '@/lib/custom-orders/provision-lines';
import { upsertSubscription } from '@/lib/db/subscriptions';
import { addLinesToExistingSubscription, createCustomOrderSession, normalizeCustomOrderLines } from '@/lib/stripe/custom-orders';
import { getStripe } from '@/lib/stripe/server';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';
import { absoluteUrl, normalizeIsraeliMobile } from '@/lib/utils';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const log = logger.child({ route: 'custom-orders/[token]/checkout' });

const bodySchema = z.object({
  verifiedPortNumbers: z.record(z.string(), z.string()).default({}),
});

async function getActiveStripeSubscription(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid checkout request' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return Response.json({ error: 'Checkout is temporarily unavailable.' }, { status: 503 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return Response.json({ error: 'Checkout is temporarily unavailable.' }, { status: 503 });
  }

  const { data: order, error: orderError } = await admin
    .from('custom_line_orders')
    .select('id, token, customer_id, lines, status')
    .eq('token', token)
    .maybeSingle();

  if (orderError || !order) {
    return Response.json({ error: 'Payment link not found.' }, { status: 404 });
  }
  if (order.status !== 'draft') {
    return Response.json({ error: 'This payment link is no longer open.' }, { status: 409 });
  }

  const customerId = (order.customer_id ?? null) as string | null;
  if (!customerId) {
    return Response.json({ error: 'This order is missing a customer.' }, { status: 400 });
  }

  const { data: customer } = await admin
    .from('customers')
    .select('id, user_id, full_name, email, phone, stripe_customer_id')
    .eq('id', customerId)
    .maybeSingle();

  if (!customer?.id || !customer.email) {
    return Response.json({ error: 'Customer record is missing an email address.' }, { status: 400 });
  }

  const lines = normalizeCustomOrderLines(order.lines);
  if (!lines.length) {
    return Response.json({ error: 'This order has no lines.' }, { status: 400 });
  }

  for (const [index, line] of lines.entries()) {
    if (!line.isPortIn) continue;
    const expected = line.portNumber ? normalizeIsraeliMobile(line.portNumber) : null;
    const provided = normalizeIsraeliMobile(parsed.data.verifiedPortNumbers[String(index)] ?? '');
    if (!expected || provided !== expected) {
      return Response.json(
        { error: `Line ${index + 1}: verify ${line.portNumber ?? 'the ported number'} before payment.` },
        { status: 400 },
      );
    }

    const authStatus = await getTelecomProvider()
      .getNumberAuthenticationStatus(expected)
      .catch(() => 'none' as const);
    if (authStatus !== 'completed') {
      return Response.json(
        { error: `Line ${index + 1}: SMS verification is not complete yet.` },
        { status: 400 },
      );
    }
  }

  let stripeCustomerId: string | null = null;
  const { data: stripeCustomerRow } = await admin
    .from('stripe_customers')
    .select('stripe_customer_id, livemode')
    .eq('customer_id', customer.id)
    .maybeSingle();

  stripeCustomerId =
    (stripeCustomerRow?.stripe_customer_id as string | undefined) ??
    ((customer.stripe_customer_id ?? null) as string | null);

  if (!stripeCustomerId) {
    const created = await stripe.customers.create({
      email: customer.email as string,
      name: (customer.full_name ?? undefined) as string | undefined,
      phone: (customer.phone ?? undefined) as string | undefined,
      metadata: {
        customer_record_id: customer.id as string,
        user_id: (customer.user_id ?? '') as string,
        source: 'bitlink_custom_order',
      },
    });
    stripeCustomerId = created.id;
    await Promise.all([
      admin
        .from('customers')
        .update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() })
        .eq('id', customer.id),
      admin.from('stripe_customers').upsert(
        {
          customer_id: customer.id,
          stripe_customer_id: stripeCustomerId,
          stripe_email: customer.email,
          livemode: created.livemode,
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'stripe_customer_id', ignoreDuplicates: false },
      ),
    ]);
  }

  const resolvedStripeCustomerId = stripeCustomerId;
  if (!resolvedStripeCustomerId) {
    return Response.json({ error: 'Could not connect the Stripe customer.' }, { status: 503 });
  }

  try {
    const existingSubscription = await getActiveStripeSubscription(admin, stripe, customer.id as string);
    if (existingSubscription) {
      const items = await addLinesToExistingSubscription(stripe, {
        subscriptionId: existingSubscription.id,
        token,
        lines,
        startingLineIndex: 0,
      });
      const refreshedSubscription = await stripe.subscriptions.retrieve(existingSubscription.id, {
        expand: ['items.data.price.product'],
      });
      await upsertSubscription(admin, customer.id as string, refreshedSubscription);

      const provisioningInputs = lines.map((line, index) => {
        const item = items[index];
        if (!item) throw new Error(`Missing Stripe subscription item for line ${index + 1}`);
        return {
          line,
          index,
          subscriptionItem: item,
          stripeSubscriptionId: existingSubscription.id,
          stripeCustomerId: resolvedStripeCustomerId,
          customerRecordId: customer.id as string,
          customerEmail: customer.email as string,
          userId: (customer.user_id ?? null) as string | null,
          customOrderToken: token,
          source: 'stripe_custom_order' as const,
        };
      });

      const result = await provisionSubscriptionLines(
        admin,
        provisioningInputs,
      );

      await admin
        .from('custom_line_orders')
        .update({
          status: 'provisioning',
          stripe_subscription_id: existingSubscription.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      await admin.from('orders').insert({
        customer_id: customer.id,
        payment_status: 'paid',
        order_status: 'processing',
        provisioning_status: 'payment_confirmed',
      });

      if (result.jobIds.length) {
        await inngest.send(
          result.jobIds.map((jobId) => ({
            name: 'provisioning/line.create' as const,
            data: { jobId },
          })),
        );
      }

      log.info(
        { token, subscriptionId: existingSubscription.id, jobIds: result.jobIds },
        'Custom order added to existing subscription',
      );
      return Response.json({ added: true, lineIds: result.lineIds, jobIds: result.jobIds });
    }

    const session = await createCustomOrderSession(stripe, {
      token,
      stripeCustomerId: resolvedStripeCustomerId,
      customerRecordId: customer.id as string,
      lines,
      uiMode: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ? 'embedded' : 'hosted',
      successUrl: absoluteUrl(`/checkout/success?session_id={CHECKOUT_SESSION_ID}`),
      cancelUrl: absoluteUrl(`/pay/${token}`),
    });

    await admin
      .from('custom_line_orders')
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    log.info({ token, sessionId: session.id, customerId: customer.id }, 'Custom order checkout created');
    return Response.json(
      session.client_secret ? { clientSecret: session.client_secret } : { url: session.url },
    );
  } catch (err) {
    log.error({ token, error: err instanceof Error ? err.message : String(err) }, 'Failed to create custom checkout');
    return Response.json({ error: 'Payment could not be started.' }, { status: 503 });
  }
}
