// Post-provisioning notification — fired when a line reaches COMPLETED status.
// For eSIM lines: fetches the activation code from Annatel and emails it to the customer.
// For physical SIM lines: sends a "line is active" email.
//
// Also stores the eSIM activation code on the telecom_line record so the
// customer portal can display it.

import { inngest } from '@/inngest/client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';
import { sendEmail } from '@/lib/email/send';
import { buildEsimReadyEmail } from '@/lib/email/templates';
import { plans } from '@/lib/plans';
import { logger } from '@/lib/logger';

const log = logger.child({ fn: 'notify-provisioned' });
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitlink.co.il';

export const notifyProvisioned = inngest.createFunction(
  { id: 'notify-provisioned', retries: 3 },
  { event: 'provisioning/line.completed' },
  async ({ event, step }) => {
    const { lineId, providerLineId } = event.data as {
      lineId: string;
      providerLineId: string;
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
    const isEsim = meta.is_esim === true || meta.is_esim === '1' || meta.is_esim === 1;
    const planSlug = String(meta.plan_slug ?? '');
    const planName = plans.find((p) => p.slug === planSlug)?.name ?? planSlug;

    if (!isEsim) {
      // Physical SIM — line is active, no QR to send
      log.info({ lineId, email: customer.email }, 'Physical SIM line active — no eSIM email needed');
      return { skipped: true, reason: 'not_esim' };
    }

    // Step 2: fetch eSIM profile from Annatel
    const esimProfile = await step.run('fetch-esim-profile', async () => {
      try {
        const provider = getTelecomProvider();
        // Get SIMs on this line to find the eSIM
        const sims = await provider.listLineSims(providerLineId);
        const esimSim = sims.find((s) => s.type === 'esim');
        if (!esimSim) return null;

        const profile = await provider.getEsimProfile(esimSim.id);
        return profile;
      } catch (err) {
        log.error({ error: String(err), lineId }, 'Failed to fetch eSIM profile');
        return null;
      }
    });

    if (!esimProfile?.activationCode) {
      log.warn({ lineId }, 'No eSIM activation code found — skipping email');
      return { skipped: true, reason: 'no_activation_code' };
    }

    // Step 3: store activation code on line record for portal display
    await step.run('store-esim-code', async () => {
      await admin
        .from('telecom_lines')
        .update({
          metadata: {
            ...(meta as object),
            esim_activation_code: esimProfile.activationCode,
            esim_sm_dp_plus: esimProfile.smDpPlusAddress,
            esim_ready_at: new Date().toISOString(),
          } as never,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lineId);
    });

    // Step 4: send eSIM activation email
    const sent = await step.run('send-esim-email', async () => {
      return sendEmail({
        to: customer.email,
        subject: `Your BitLink eSIM is ready to install`,
        html: buildEsimReadyEmail({
          fullName: customer.full_name ?? 'there',
          activationCode: esimProfile.activationCode,
          planName,
          portalUrl: `${BASE_URL}/account/lines`,
        }),
      });
    });

    log.info({ lineId, email: customer.email, sent }, 'eSIM ready notification sent');
    return { sent };
  },
);
