// Post-checkout notification function.
// Triggered by 'checkout/completed' after the subscriber + line are created.
//
// Responsibilities:
//   1. Create a Supabase auth account for the customer (if they don't have one)
//   2. Generate a magic link / set temp password
//   3. Send welcome email with credentials + plan info + "3-5 min" message
//
// Idempotent: skips account creation if user_id already exists on the customer record.

import { inngest } from '@/inngest/client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/send';
import { buildWelcomeEmail, buildAdminSaleEmail } from '@/lib/email/templates';
import { ensureAuthAccount, generateLoginUrl } from '@/lib/auth/ensure-account';
import { plans } from '@/lib/plans';
import { logger } from '@/lib/logger';

const ADMIN_NOTIFY_EMAIL = 'joe@bitlink.co.il';

const log = logger.child({ fn: 'notify-checkout' });

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitlink.co.il';

export const notifyCheckout = inngest.createFunction(
  { id: 'notify-checkout', retries: 2 },
  { event: 'checkout/completed' },
  async ({ event, step }) => {
    const { customerRecordId, planSlug, isEsim } = event.data as {
      customerRecordId: string;
      planSlug: string;
      isEsim: boolean;
    };

    const admin = createSupabaseAdminClient();
    if (!admin) {
      log.error('Supabase admin client unavailable');
      return { skipped: true };
    }

    // Step 1: fetch customer record
    const customer = await step.run('fetch-customer', async () => {
      const { data } = await admin
        .from('customers')
        .select('id, full_name, email, user_id, org_referral_code')
        .eq('id', customerRecordId)
        .single();
      return data;
    });

    if (!customer?.email) {
      log.warn({ customerRecordId }, 'Customer not found or missing email');
      return { skipped: true, reason: 'no_customer' };
    }

    // Step 2: ensure Supabase auth account exists
    const authResult = await step.run('ensure-auth-account', async () => {
      const result = await ensureAuthAccount(admin, {
        customerRecordId,
        email: customer.email,
        fullName: customer.full_name ?? 'there',
        existingUserId: customer.user_id,
        source: 'checkout',
      });
      if (result.isNew) {
        log.info({ userId: result.userId, email: customer.email }, 'Auth account created');
      } else if (!result.userId) {
        log.error({ email: customer.email }, 'Failed to create auth user');
      }
      return result;
    });

    // Step 3: generate login URL
    const loginUrl = await step.run('generate-login-url', async () => {
      return generateLoginUrl(admin, {
        email: customer.email,
        tempPassword: authResult.tempPassword,
        baseUrl: BASE_URL,
      });
    });

    // Step 4: send welcome email
    const planName = plans.find((p) => p.slug === planSlug)?.name ?? planSlug;

    const sent = await step.run('send-welcome-email', async () => {
      return sendEmail({
        to: customer.email,
        subject: `Welcome to BitLink — your ${planName} plan is confirmed`,
        html: buildWelcomeEmail({
          fullName: customer.full_name ?? 'there',
          email: customer.email,
          planName,
          loginUrl,
          tempPassword: authResult.tempPassword ?? undefined,
          isEsim,
        }),
      });
    });

    // Step 5: notify admin of the new sale
    const plan = plans.find((p) => p.slug === planSlug);
    await step.run('notify-admin-sale', async () => {
      return sendEmail({
        to: ADMIN_NOTIFY_EMAIL,
        subject: `New BitLink sale — ${planName}`,
        html: buildAdminSaleEmail({
          fullName: customer.full_name ?? 'Unknown',
          email: customer.email,
          planName,
          priceCents: plan?.priceCents ?? 0,
          isEsim,
          orgReferralCode: (customer as Record<string, unknown>).org_referral_code as string | null,
        }),
      });
    });

    log.info(
      { customerRecordId, email: customer.email, isNewUser: authResult.isNew, emailSent: sent },
      'Post-checkout notification complete',
    );

    return { sent, isNewUser: authResult.isNew };
  },
);
