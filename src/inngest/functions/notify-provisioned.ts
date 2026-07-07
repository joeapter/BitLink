// Post-provisioning notification — fired when a line reaches COMPLETED status
// from ANY completion path (direct processing, reconcile cron, Annatel webhook;
// the event is dispatched from completeJob in the orchestrator).
//
// For eSIM lines: emails the activation code to the customer.
// For physical SIM lines: emails a "line is active" notice.
// EVERY completion also emails an admin copy to joe@bitlink.co.il with the
// customer's name in the subject and resend-ready activation details.
//
// Idempotent: a metadata stamp prevents duplicate emails if the completion
// event fires more than once.

import { inngest } from '@/inngest/client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';
import { sendEmail } from '@/lib/email/send';
import {
  buildEsimReadyEmail,
  buildLineActiveEmail,
  buildAdminProvisionedEmail,
} from '@/lib/email/templates';
import { plans } from '@/lib/plans';
import { logger } from '@/lib/logger';

const log = logger.child({ fn: 'notify-provisioned' });
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitlink.co.il';
const ADMIN_NOTIFY_EMAIL = 'joe@bitlink.co.il';

// iOS/Android only accept the full LPA string; older stored codes may be bare.
function toLpaString(activationCode: string, smDpPlus?: string | null): string {
  if (activationCode.startsWith('LPA:')) return activationCode;
  if (smDpPlus) return `LPA:1$${smDpPlus}$${activationCode}`;
  return activationCode;
}

export const notifyProvisioned = inngest.createFunction(
  { id: 'notify-provisioned', retries: 3 },
  { event: 'provisioning/line.completed' },
  async ({ event, step }) => {
    const { lineId, providerLineId } = event.data as {
      lineId: string;
      providerLineId: string | null;
    };

    const admin = createSupabaseAdminClient();
    if (!admin) return { skipped: true, reason: 'no_admin_client' };

    // Step 1: fetch line + customer
    const context = await step.run('fetch-context', async () => {
      const { data: line } = await admin
        .from('telecom_lines')
        .select('id, customer_id, is_kosher, metadata, esim_activated_at')
        .eq('id', lineId)
        .single();

      if (!line?.customer_id) return null;

      const { data: customer } = await admin
        .from('customers')
        .select('full_name, email')
        .eq('id', line.customer_id)
        .single();

      return { line, customer };
    });

    if (!context?.customer?.email) {
      log.warn({ lineId }, 'No customer found for line — skipping notification');
      return { skipped: true };
    }

    const { line, customer } = context;
    const meta = (line.metadata ?? {}) as Record<string, unknown>;

    // Idempotency: this event can arrive more than once (multiple completion paths).
    if (meta.provisioned_email_sent_at) {
      log.info({ lineId }, 'Provisioned emails already sent — skipping');
      return { skipped: true, reason: 'already_sent' };
    }

    const isEsim = meta.is_esim === true || meta.is_esim === '1' || meta.is_esim === 1;
    const planSlug = String(meta.plan_slug ?? '');
    const planName = plans.find((p) => p.slug === planSlug)?.name ?? planSlug;
    const phoneNumber = (meta.phone_number as string | undefined) ?? null;
    const fullName = customer.full_name ?? 'there';

    // Step 2 (eSIM only): resolve the activation code — prefer what completeJob
    // already stored; fall back to fetching the profile from the provider.
    const activationCode = isEsim
      ? await step.run('resolve-activation-code', async () => {
          const stored = meta.esim_activation_code as string | undefined;
          const storedSmDp = meta.esim_sm_dp_plus as string | undefined;
          if (stored) return toLpaString(stored, storedSmDp);

          if (!providerLineId) return null;
          try {
            const provider = getTelecomProvider();
            const sims = await provider.listLineSims(providerLineId);
            const esimSim = sims.find((s) => s.type === 'esim');
            if (!esimSim) return null;
            const profile = await provider.getEsimProfile(esimSim.id);
            if (!profile.activationCode) return null;

            await admin
              .from('telecom_lines')
              .update({
                metadata: {
                  ...(meta as object),
                  esim_activation_code: profile.activationCode,
                  esim_sm_dp_plus: profile.smDpPlusAddress,
                  esim_ready_at: new Date().toISOString(),
                } as never,
                updated_at: new Date().toISOString(),
              })
              .eq('id', lineId);

            return toLpaString(profile.activationCode, profile.smDpPlusAddress);
          } catch (err) {
            log.error({ error: String(err), lineId }, 'Failed to fetch eSIM profile');
            return null;
          }
        })
      : null;

    if (isEsim && !activationCode) {
      log.warn({ lineId }, 'No eSIM activation code found — skipping email');
      return { skipped: true, reason: 'no_activation_code' };
    }

    // Step 3: customer email
    const customerSent = await step.run('send-customer-email', async () => {
      if (isEsim && activationCode) {
        return sendEmail({
          to: customer.email,
          subject: `Your BitLink eSIM is ready to install`,
          html: buildEsimReadyEmail({
            fullName,
            activationCode,
            planName,
            portalUrl: `${BASE_URL}/account/lines`,
          }),
        });
      }
      return sendEmail({
        to: customer.email,
        subject: `Your BitLink line is active${phoneNumber ? ` — ${phoneNumber}` : ''}`,
        html: buildLineActiveEmail({
          fullName,
          planName,
          phoneNumber,
          portalUrl: `${BASE_URL}/account/lines`,
        }),
      });
    });

    // Step 4: admin copy — name in subject, activation details in body, so
    // support can resend from the inbox without touching the database.
    const adminSent = await step.run('send-admin-copy', async () => {
      return sendEmail({
        to: ADMIN_NOTIFY_EMAIL,
        subject: `${isEsim ? 'eSIM ready' : 'Line active'} — ${fullName}${phoneNumber ? ` (${phoneNumber})` : ''}`,
        html: buildAdminProvisionedEmail({
          fullName,
          email: customer.email,
          planName,
          phoneNumber,
          isEsim,
          activationCode,
          lineId,
          adminUrl: BASE_URL,
        }),
      });
    });

    // Step 5: idempotency stamp
    await step.run('stamp-sent', async () => {
      const { data: fresh } = await admin.from('telecom_lines').select('metadata').eq('id', lineId).single();
      await admin
        .from('telecom_lines')
        .update({
          metadata: {
            ...((fresh?.metadata ?? {}) as object),
            provisioned_email_sent_at: new Date().toISOString(),
          } as never,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lineId);
    });

    log.info({ lineId, email: customer.email, customerSent, adminSent }, 'Provisioned notifications sent');
    return { customerSent, adminSent };
  },
);
