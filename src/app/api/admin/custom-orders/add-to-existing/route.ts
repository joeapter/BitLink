// POST /api/admin/custom-orders/add-to-existing
//
// Adds one or more lines directly onto a customer's EXISTING active Stripe
// subscription — prorated, billed immediately, no separate payment link.
// The regular /api/admin/custom-orders route always creates a fresh payment
// link even for a customer who already has one; this is the alternative for
// when you'd rather just add to what they're already paying.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin as requireAdminApi } from '@/lib/auth/admin-guard';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/server';
import { getActiveStripeSubscription } from '@/lib/stripe/existing-subscription';
import { addLinesToExistingSubscription } from '@/lib/stripe/custom-orders';
import { normalizeAdminOrderLines } from '@/lib/admin/custom-order-lines';
import { provisionSubscriptionLines } from '@/lib/custom-orders/provision-lines';
import { upsertSubscription } from '@/lib/db/subscriptions';
import { inngest } from '@/inngest/client';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const log = logger.child({ route: 'admin/custom-orders/add-to-existing' });

const planSlugSchema = z.enum(['basic', 'kosher-basic', 'kosher-plus', 'student-5g', 'max-5g']);
const intlCountrySchema = z.enum(['us', 'canada', 'uk']);
const intlSourceSchema = z.enum(['new', 'port']);

const lineSchema = z.object({
  planSlug: planSlugSchema,
  isEsim: z.boolean().default(true),
  isPortIn: z.boolean().default(false),
  portNumber: z.string().nullable().optional(),
  wantsIntlNumber: z.boolean().default(false),
  intlCountry: intlCountrySchema.nullable().optional(),
  intlSource: intlSourceSchema.nullable().optional(),
  intlPortNumber: z.string().nullable().optional(),
  intlChosenNumber: z.string().nullable().optional(),
  iccId: z.string().nullable().optional(),
  delivery: z
    .object({
      city: z.string().trim().min(1),
      addressLine1: z.string().trim().min(1),
      addressLine2: z.string().trim().nullable().optional(),
      requestedDate: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  customPriceCents: z.number().int().min(100).max(200_000),
});

const bodySchema = z.object({
  customerId: z.string().uuid(),
  lines: z.array(lineSchema).min(1).max(20),
});

function buildToken() {
  return `admin_${crypto.randomUUID().replaceAll('-', '').slice(0, 24)}`;
}

export async function POST(request: NextRequest): Promise<Response> {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid line options', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Stripe unavailable' }, { status: 503 });

  const { data: customer } = await admin
    .from('customers')
    .select('id, full_name, email, user_id, stripe_customer_id')
    .eq('id', parsed.data.customerId)
    .maybeSingle();

  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  if (!customer.stripe_customer_id) {
    return NextResponse.json(
      { error: 'This customer has no Stripe billing yet — use "create a new payment link" instead.' },
      { status: 400 },
    );
  }

  const existingSubscription = await getActiveStripeSubscription(admin, stripe, customer.id);
  if (!existingSubscription) {
    return NextResponse.json(
      { error: 'This customer has no active subscription to add to — use "create a new payment link" instead.' },
      { status: 400 },
    );
  }

  let lines: Awaited<ReturnType<typeof normalizeAdminOrderLines>>;
  try {
    lines = await normalizeAdminOrderLines(admin, parsed.data.lines);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid line options.' },
      { status: 400 },
    );
  }

  const token = buildToken();

  try {
    const items = await addLinesToExistingSubscription(stripe, {
      subscriptionId: existingSubscription.id,
      token,
      lines,
    });
    if (items.length !== lines.length) {
      throw new Error('Stripe did not return a subscription item for every line.');
    }

    const refreshedSubscription = await stripe.subscriptions.retrieve(existingSubscription.id, {
      expand: ['items.data.price.product'],
    });
    await upsertSubscription(admin, customer.id, refreshedSubscription);

    const result = await provisionSubscriptionLines(
      admin,
      lines.map((line, index) => ({
        line,
        index,
        subscriptionItem: items[index],
        stripeSubscriptionId: existingSubscription.id,
        stripeCustomerId: customer.stripe_customer_id as string,
        customerRecordId: customer.id,
        customerEmail: customer.email,
        userId: (customer.user_id as string | null) ?? null,
        customOrderToken: token,
        source: 'stripe_custom_order' as const,
      })),
    );

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
      { customerId: customer.id, subscriptionId: existingSubscription.id, lineCount: lines.length },
      'Lines added to existing subscription with proration',
    );
    return NextResponse.json({ added: true, lineIds: result.lineIds, jobIds: result.jobIds });
  } catch (err) {
    log.error(
      { customerId: customer.id, adminUserId: auth.user.id, error: err instanceof Error ? err.message : String(err) },
      'Failed to add lines to existing subscription',
    );
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not add these lines to the existing subscription.' },
      { status: 503 },
    );
  }
}
