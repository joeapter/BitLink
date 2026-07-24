import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin as requireAdminApi } from '@/lib/auth/admin-guard';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { absoluteUrl, normalizeIsraeliMobile } from '@/lib/utils';
import { generateReferralCode } from '@/lib/referrals';
import { getPlan, type PlanSlug } from '@/lib/plans';
import { sendEmail } from '@/lib/email/send';
import { buildCustomerLoginCreatedEmail } from '@/lib/email/templates';

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
  intlChosenNumber: z.string().nullable().optional(),
  iccId: z.string().nullable().optional(),
  customPriceCents: z.number().int().min(100).max(200_000),
});

const bodySchema = z.object({
  customer: z.object({
    id: z.string().uuid().nullable().optional(),
    fullName: z.string().trim().min(2).optional(),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().optional(),
    accountPassword: z.string().min(8).max(128).optional(),
  }),
  note: z.string().trim().max(1000).optional(),
  lines: z.array(lineSchema).min(1).max(20),
});

function buildToken() {
  return crypto.randomUUID().replaceAll('-', '').slice(0, 24);
}

async function findAuthUserByEmail(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  email: string,
) {
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw error;
  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function upsertCustomerProfile(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  params: { userId: string; fullName: string | null; email: string; phone: string | null },
) {
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('id', params.userId)
    .maybeSingle();

  if (existingProfile?.id) {
    await admin
      .from('profiles')
      .update({
        full_name: params.fullName,
        email: params.email,
        phone: params.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.userId);
    return;
  }

  await admin.from('profiles').insert({
    id: params.userId,
    full_name: params.fullName,
    email: params.email,
    phone: params.phone,
    role: 'customer',
  });
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
  let loginEmailSent: boolean | null = null;
  let loginEmailWarning: string | null = null;

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

    const accountPassword = parsed.data.customer.accountPassword ?? '';
    if (accountPassword.length < 8) {
      return NextResponse.json({ error: 'Enter a login password with at least 8 characters.' }, { status: 400 });
    }

    const fullName = parsed.data.customer.fullName ?? null;
    const phone = parsed.data.customer.phone ?? null;
    const { data: existing } = await admin
      .from('customers')
      .select('id, user_id')
      .ilike('email', email)
      .maybeSingle();

    let userId = (existing?.user_id as string | null | undefined) ?? null;
    let createdLogin = false;
    if (!userId) {
      let existingAuthUserId: string | null = null;
      try {
        existingAuthUserId = (await findAuthUserByEmail(admin, email))?.id ?? null;
      } catch {
        return NextResponse.json({ error: 'Could not check existing login accounts.' }, { status: 503 });
      }

      if (existingAuthUserId) {
        userId = existingAuthUserId;
        loginEmailWarning = 'This email already had a login account, so the password was not changed or emailed.';
      } else {
        const { data: newUser, error: createUserError } = await admin.auth.admin.createUser({
          email,
          password: accountPassword,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            phone,
            source: 'admin_custom_order',
          },
        });

        if (createUserError || !newUser.user) {
          return NextResponse.json({ error: createUserError?.message ?? 'Could not create the customer login.' }, { status: 503 });
        }

        userId = newUser.user.id;
        createdLogin = true;
      }

      if (userId) {
        await upsertCustomerProfile(admin, { userId, fullName, email, phone });
      }
    } else {
      loginEmailWarning = 'This email already had a BitLink login, so the password was not changed or emailed.';
    }

    if (existing?.id) {
      customerId = existing.id as string;
      await admin
        .from('customers')
        .update({
          user_id: userId ?? existing.user_id ?? null,
          full_name: fullName,
          phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId);
    } else {
      const { data: created, error } = await admin
        .from('customers')
        .insert({
          user_id: userId,
          full_name: fullName,
          email,
          phone,
          referral_code: generateReferralCode(),
        })
        .select('id')
        .single();

      if (error || !created) {
        return NextResponse.json({ error: 'Could not create the customer.' }, { status: 503 });
      }
      customerId = created.id as string;
    }

    if (createdLogin) {
      loginEmailSent = await sendEmail({
        to: email,
        subject: 'Your BitLink login details',
        html: buildCustomerLoginCreatedEmail({
          fullName: fullName ?? 'there',
          email,
          password: accountPassword,
          loginUrl: absoluteUrl(`/login?email=${encodeURIComponent(email)}`),
        }),
      });
      if (!loginEmailSent) {
        loginEmailWarning = 'The customer login was created, but the credentials email could not be sent.';
      }
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
    intlChosenNumber: string | null;
    customPriceCents: number;
  }>;
  try {
    lines = await Promise.all(parsed.data.lines.map(async (line, index) => {
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

      const wantsNewIntlNumber = line.wantsIntlNumber && (line.intlSource ?? 'new') === 'new';
      let intlChosenNumber: string | null = null;
      if (wantsNewIntlNumber && line.intlChosenNumber?.trim()) {
        const candidate = line.intlChosenNumber.trim();
        const { data: available } = await admin
          .from('international_dids')
          .select('number')
          .eq('number', candidate)
          .eq('country', line.intlCountry ?? 'us')
          .eq('status', 'available')
          .maybeSingle();
        if (!available) {
          throw new Error(`Line ${index + 1}: that number is no longer available — pick another.`);
        }
        intlChosenNumber = candidate;
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
        intlChosenNumber,
        // Physical/kosher lines activate on a specific card entered by the
        // admin; eSIM lines auto-pick from inventory so this stays null.
        iccId: (plan.isKosher || !line.isEsim) ? (line.iccId?.replace(/\s+/g, "") || null) : null,
        customPriceCents: line.customPriceCents,
      };
    }));
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
      loginEmailSent,
      loginEmailWarning,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not create the custom order.' },
      { status: 400 },
    );
  }
}
