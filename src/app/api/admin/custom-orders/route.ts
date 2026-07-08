import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin as requireAdminApi } from '@/lib/auth/admin-guard';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { absoluteUrl, normalizeIsraeliMobile } from '@/lib/utils';
import { generateReferralCode } from '@/lib/referrals';
import { getPlan, type PlanSlug } from '@/lib/plans';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
  customPriceCents: z.number().int().min(100).max(200_000),
});

const bodySchema = z.object({
  customer: z.object({
    id: z.string().uuid().nullable().optional(),
    fullName: z.string().trim().min(2).optional(),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().optional(),
  }),
  note: z.string().trim().max(1000).optional(),
  lines: z.array(lineSchema).min(1).max(20),
});

function buildToken() {
  return crypto.randomUUID().replaceAll('-', '').slice(0, 24);
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
      { error: 'Invalid custom order', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Admin database is unavailable.' }, { status: 503 });
  }

  let customerId = parsed.data.customer.id ?? null;
  if (customerId) {
    const { data: customer, error } = await admin
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .maybeSingle();
    if (error || !customer) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }
  } else {
    const email = parsed.data.customer.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'Enter an email for the new customer.' }, { status: 400 });
    }

    const { data: existing } = await admin
      .from('customers')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (existing?.id) {
      customerId = existing.id as string;
      await admin
        .from('customers')
        .update({
          full_name: parsed.data.customer.fullName ?? null,
          phone: parsed.data.customer.phone ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId);
    } else {
      const { data: created, error } = await admin
        .from('customers')
        .insert({
          full_name: parsed.data.customer.fullName ?? null,
          email,
          phone: parsed.data.customer.phone ?? null,
          referral_code: generateReferralCode(),
        })
        .select('id')
        .single();

      if (error || !created) {
        return NextResponse.json({ error: 'Could not create the customer.' }, { status: 503 });
      }
      customerId = created.id as string;
    }
  }

  let lines: Array<{
    planSlug: PlanSlug;
    isEsim: boolean;
    isPortIn: boolean;
    portNumber: string | null;
    wantsIntlNumber: boolean;
    intlCountry: 'us' | 'canada' | 'uk' | null;
    intlSource: 'new' | 'port' | null;
    intlPortNumber: string | null;
    customPriceCents: number;
  }>;
  try {
    lines = parsed.data.lines.map((line, index) => {
      const plan = getPlan(line.planSlug);
      const normalizedPort = line.isPortIn && line.portNumber
        ? normalizeIsraeliMobile(line.portNumber)
        : null;

      if (line.isPortIn && !normalizedPort) {
        throw new Error(`Line ${index + 1}: enter a valid Israeli mobile number to port.`);
      }

      if (line.wantsIntlNumber && (line.intlSource ?? 'new') === 'port' && !line.intlPortNumber?.trim()) {
        throw new Error(`Line ${index + 1}: enter the US/Canada/UK number to port.`);
      }

      return {
        planSlug: line.planSlug as PlanSlug,
        isEsim: plan.isKosher ? false : line.isEsim,
        isPortIn: line.isPortIn,
        portNumber: normalizedPort,
        wantsIntlNumber: line.wantsIntlNumber,
        intlCountry: line.wantsIntlNumber ? (line.intlCountry ?? 'us') : null,
        intlSource: line.wantsIntlNumber ? (line.intlSource ?? 'new') : null,
        intlPortNumber: line.wantsIntlNumber && (line.intlSource ?? 'new') === 'port'
          ? line.intlPortNumber!.trim()
          : null,
        customPriceCents: line.customPriceCents,
      };
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid line options.' },
      { status: 400 },
    );
  }

  const token = buildToken();
  try {
    const { data: order, error } = await admin
      .from('custom_line_orders')
      .insert({
        token,
        customer_id: customerId,
        created_by: auth.user.id,
        lines: lines as never,
        note: parsed.data.note || null,
        status: 'draft',
      })
      .select('id, token')
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Could not create the custom order.' }, { status: 503 });
    }

    return NextResponse.json({
      id: order.id,
      token: order.token,
      url: absoluteUrl(`/pay/${order.token}`),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not create the custom order.' },
      { status: 400 },
    );
  }
}
