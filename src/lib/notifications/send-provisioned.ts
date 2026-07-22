// Shared "line provisioned" notification logic — used by the automatic
// Inngest handler (notify-provisioned.ts), the orchestrator's synchronous
// fallback (if the Inngest dispatch itself fails), and the admin "Resend"
// button. One implementation so a fix here fixes all three callers.

import type { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';
import { sendEmail } from '@/lib/email/send';
import {
  buildEsimReadyEmail,
  buildLineActiveEmail,
  buildAdminProvisionedEmail,
} from '@/lib/email/templates';
import { plans } from '@/lib/plans';
import { toLpaString } from '@/lib/esim';
import { logger } from '@/lib/logger';

const log = logger.child({ fn: 'send-provisioned-notifications' });
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitlink.co.il';
const ADMIN_NOTIFY_EMAIL = 'joe@bitlink.co.il';

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

export type SendProvisionedResult =
  | { skipped: true; reason: string }
  | { skipped: false; customerSent: boolean; adminSent: boolean };

export async function sendProvisionedNotifications(
  admin: AdminClient,
  lineId: string,
  providerLineId: string | null,
  // resync: ignore the activation code stored in our DB and re-fetch the live
  // one from the provider first (updating the DB to match). The stored code
  // can go stale if the eSIM profile was re-released at the carrier with a new
  // matching id — then the old QR silently stops working. An admin resend
  // should always reflect what the carrier will actually accept.
  opts: { force?: boolean; resync?: boolean } = {},
): Promise<SendProvisionedResult> {
  const { data: line } = await admin
    .from('telecom_lines')
    .select('id, customer_id, is_kosher, metadata')
    .eq('id', lineId)
    .single();

  if (!line?.customer_id) {
    log.warn({ lineId }, 'No customer found for line — skipping notification');
    return { skipped: true, reason: 'no_customer' };
  }

  const { data: customer } = await admin
    .from('customers')
    .select('full_name, email')
    .eq('id', line.customer_id)
    .single();

  if (!customer?.email) return { skipped: true, reason: 'no_email' };

  const meta = (line.metadata ?? {}) as Record<string, unknown>;
  // Present when the order included the US/Canada/UK add-on (or one was
  // attached since) — used to decide whether the emails should mention it.
  const hasIntlNumber = Boolean(meta.intl_number) || Boolean(line.is_kosher);

  // Idempotency: this can be called more than once (multiple completion
  // paths, or an explicit admin resend). `force` bypasses it deliberately.
  if (meta.provisioned_email_sent_at && !opts.force) {
    log.info({ lineId }, 'Provisioned emails already sent — skipping');
    return { skipped: true, reason: 'already_sent' };
  }

  const isEsim = meta.is_esim === true || meta.is_esim === '1' || meta.is_esim === 1;
  const planSlug = String(meta.plan_slug ?? '');
  const planName = plans.find((p) => p.slug === planSlug)?.name ?? planSlug;
  const phoneNumber = (meta.phone_number as string | undefined) ?? null;
  const fullName = customer.full_name ?? 'there';

  let activationCode: string | null = null;
  if (isEsim) {
    const stored = meta.esim_activation_code as string | undefined;
    const storedSmDp = meta.esim_sm_dp_plus as string | undefined;
    // Trust the stored code unless the caller explicitly asked to resync — a
    // resync always goes to the provider for the current, valid code.
    if (stored && !opts.resync) {
      activationCode = toLpaString(stored, storedSmDp);
    } else if (providerLineId) {
      try {
        const provider = getTelecomProvider();
        // The line-sims listing has no eSIM "type" flag, and the sim_manager
        // profile endpoint is keyed by ICCID — so use the stored eSIM ICCID
        // (fallback to the line's main SIM) rather than matching on type/id.
        const storedIccId = meta.esim_icc_id as string | undefined;
        let esimIccId = storedIccId ?? null;
        if (!esimIccId) {
          const sims = await provider.listLineSims(providerLineId);
          esimIccId = (sims.find((s) => s.isMain) ?? sims[0])?.iccId ?? null;
        }
        if (esimIccId) {
          const profile = await provider.getEsimProfile(esimIccId);
          if (profile.activationCode) {
            await admin
              .from('telecom_lines')
              .update({
                metadata: {
                  ...meta,
                  esim_icc_id: esimIccId,
                  esim_activation_code: profile.activationCode,
                  esim_sm_dp_plus: profile.smDpPlusAddress,
                  esim_ready_at: new Date().toISOString(),
                } as never,
                updated_at: new Date().toISOString(),
              })
              .eq('id', lineId);
            activationCode = toLpaString(profile.activationCode, profile.smDpPlusAddress);
          }
        }
      } catch (err) {
        log.error({ error: String(err), lineId }, 'Failed to fetch eSIM profile');
      }
    }
    // If a resync couldn't reach the provider but we still hold a stored code,
    // fall back to it rather than sending nothing — better a possibly-current
    // code than no email at all.
    if (!activationCode && stored) {
      activationCode = toLpaString(stored, storedSmDp);
    }
    if (!activationCode) {
      log.warn({ lineId }, 'No eSIM activation code found — skipping email');
      return { skipped: true, reason: 'no_activation_code' };
    }
  }

  const customerSent = await sendEmail(
    isEsim && activationCode
      ? {
          to: customer.email,
          subject: `Your BitLink eSIM is ready to install`,
          html: buildEsimReadyEmail({
            fullName,
            activationCode,
            planName,
            portalUrl: `${BASE_URL}/account/lines`,
            showIntlNumberNudge: !hasIntlNumber,
          }),
        }
      : {
          to: customer.email,
          subject: `Your BitLink line is active${phoneNumber ? ` — ${phoneNumber}` : ''}`,
          html: buildLineActiveEmail({ fullName, planName, phoneNumber, portalUrl: `${BASE_URL}/account/lines`, showIntlNumberNudge: !hasIntlNumber }),
        },
  );

  const adminSent = await sendEmail({
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

  log.info({ lineId, email: customer.email, customerSent, adminSent }, 'Provisioned notifications sent');
  return { skipped: false, customerSent, adminSent };
}
