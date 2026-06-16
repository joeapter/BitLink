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
import { buildWelcomeEmail } from '@/lib/email/templates';
import { plans } from '@/lib/plans';
import { logger } from '@/lib/logger';

const log = logger.child({ fn: 'notify-checkout' });

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitlink.co.il';

function generateTempPassword(): string {
  // 12-char alphanumeric — strong enough for a temp password
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

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
        .select('id, full_name, email, user_id')
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
      // Already has an account
      if (customer.user_id) {
        return { userId: customer.user_id, isNew: false, tempPassword: null as string | null };
      }

      // Check if an auth user with this email exists
      const { data: { users } } = await admin.auth.admin.listUsers();
      const existing = users.find((u) => u.email === customer.email);
      if (existing) {
        // Link existing user to customer record
        await admin.from('customers').update({ user_id: existing.id }).eq('id', customerRecordId);
        return { userId: existing.id, isNew: false, tempPassword: null as string | null };
      }

      // Create new account with temp password
      const tempPassword = generateTempPassword();
      const { data: newUser, error } = await admin.auth.admin.createUser({
        email: customer.email,
        password: tempPassword,
        email_confirm: true, // skip confirmation email — we send our own
        user_metadata: {
          full_name: customer.full_name,
          source: 'checkout',
        },
      });

      if (error || !newUser.user) {
        log.error({ error: error?.message, email: customer.email }, 'Failed to create auth user');
        return { userId: null, isNew: false, tempPassword: null as string | null };
      }

      // Link auth user to customer record
      await admin
        .from('customers')
        .update({ user_id: newUser.user.id, updated_at: new Date().toISOString() })
        .eq('id', customerRecordId);

      // Update the profile table if it exists
      void admin
        .from('profiles')
        .upsert(
          { id: newUser.user.id, full_name: customer.full_name, email: customer.email, role: 'customer' },
          { onConflict: 'id', ignoreDuplicates: false },
        );

      log.info({ userId: newUser.user.id, email: customer.email }, 'Auth account created');
      return { userId: newUser.user.id, isNew: true, tempPassword };
    });

    // Step 3: generate login URL
    const loginUrl = await step.run('generate-login-url', async () => {
      if (authResult.tempPassword) {
        // With temp password: deep-link to login with email pre-filled
        return `${BASE_URL}/login?email=${encodeURIComponent(customer.email)}&message=${encodeURIComponent('Welcome to BitLink! Use the credentials from your email to sign in.')}`;
      }

      // Generate magic link for existing accounts
      try {
        const { data } = await admin.auth.admin.generateLink({
          type: 'magiclink',
          email: customer.email,
          options: { redirectTo: `${BASE_URL}/account` },
        });
        return data.properties?.action_link ?? `${BASE_URL}/login`;
      } catch {
        return `${BASE_URL}/login`;
      }
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

    log.info(
      { customerRecordId, email: customer.email, isNewUser: authResult.isNew, emailSent: sent },
      'Post-checkout notification complete',
    );

    return { sent, isNewUser: authResult.isNew };
  },
);
