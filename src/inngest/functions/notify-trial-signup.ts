// Fires the moment a free trial starts (card saved, before the line is even
// provisioned): notifies the admin, and — since trial signup never touches
// the password-setting /signup form — ensures the customer has a Supabase
// auth account and emails them how to log in. Without this step, a trial
// customer has no way to reach their account portal at all.

import { inngest } from '@/inngest/client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/send';
import { buildAdminTrialSignupEmail, buildTrialWelcomeEmail } from '@/lib/email/templates';
import { ensureAuthAccount, generateLoginUrl } from '@/lib/auth/ensure-account';
import { logger } from '@/lib/logger';

const ADMIN_NOTIFY_EMAIL = 'joe@bitlink.co.il';
const log = logger.child({ fn: 'notify-trial-signup' });
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitlink.co.il';

export const notifyTrialSignup = inngest.createFunction(
  { id: 'notify-trial-signup', retries: 2 },
  { event: 'trial/signup.completed' },
  async ({ event, step }) => {
    const { customerRecordId, fullName, email, phone, lineId } = event.data as {
      customerRecordId: string;
      fullName: string;
      email: string;
      phone: string;
      lineId: string;
    };

    const adminSent = await step.run('send-admin-notification', async () => {
      return sendEmail({
        to: ADMIN_NOTIFY_EMAIL,
        subject: `New BitLink trial — ${fullName}`,
        html: buildAdminTrialSignupEmail({ fullName, email, phone, lineId }),
      });
    });

    const admin = createSupabaseAdminClient();
    if (!admin) {
      log.error('Supabase admin client unavailable');
      return { adminSent, customerSent: false };
    }

    const authResult = await step.run('ensure-auth-account', async () => {
      const { data: customer } = await admin
        .from('customers')
        .select('user_id')
        .eq('id', customerRecordId)
        .maybeSingle();

      const result = await ensureAuthAccount(admin, {
        customerRecordId,
        email,
        fullName,
        existingUserId: customer?.user_id as string | null | undefined,
        source: 'trial',
      });
      if (result.isNew) {
        log.info({ userId: result.userId, email }, 'Auth account created for trial customer');
      } else if (!result.userId) {
        log.error({ email }, 'Failed to create auth user for trial customer');
      }
      return result;
    });

    const loginUrl = await step.run('generate-login-url', async () => {
      return generateLoginUrl(admin, {
        email,
        tempPassword: authResult.tempPassword,
        baseUrl: BASE_URL,
        welcomeMessage: 'Welcome to your BitLink free trial! Use the credentials from your email to sign in.',
      });
    });

    const customerSent = await step.run('send-customer-welcome-email', async () => {
      return sendEmail({
        to: email,
        subject: 'Welcome to BitLink — your free trial has started',
        html: buildTrialWelcomeEmail({ fullName, email, loginUrl, tempPassword: authResult.tempPassword }),
      });
    });

    log.info({ email, adminSent, customerSent, isNewUser: authResult.isNew }, 'Trial signup notifications complete');
    return { adminSent, customerSent, isNewUser: authResult.isNew };
  },
);
