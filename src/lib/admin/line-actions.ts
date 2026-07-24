"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTelecomProvider } from "@/lib/telecom/provider.registry";
import { retryProvisioningJob, collectUsedIccIds } from "@/lib/provisioning/orchestrator";
import { inngest } from "@/inngest/client";
import { changeLinePlan, type PlanChangeResult } from "@/lib/line-plan-change";
import { sendProvisionedNotifications } from "@/lib/notifications/send-provisioned";
import { addIntlNumberToLine, removeIntlNumberFromLine, type AddIntlNumberResult, type RemoveIntlNumberResult } from "@/lib/custom-orders/international-numbers";
import { grantTopup, cancelTopupGrant, type GrantTopupResult } from "@/lib/topups/grant-topup";
import { createIntlPortInRequest, setIntlPortInStatus, completeIntlPortInRequest } from "@/lib/custom-orders/intl-port-in-requests";
import {
  createIsraeliPortInRequest,
  sendPortInAuthCode,
  verifyPortInAuthCode,
  startIsraeliPortIn,
  refreshIsraeliPortInStatus,
  completeIsraeliPortIn,
  cancelIsraeliPortIn,
} from "@/lib/custom-orders/israeli-port-in";

function getProvider() {
  return getTelecomProvider();
}

function getAdmin() {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error('Supabase admin client unavailable');
  return admin;
}

async function logAction(
  actorId: string,
  action: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
) {
  try {
    const admin = getAdmin();
    await admin.from('audit_logs').insert({
      actor_user_id: actorId,
      action,
      entity_type: 'telecom_line',
      entity_id: entityId,
      metadata,
    });
  } catch {
    // audit failure is non-fatal
  }
}

// ── Line operations ───────────────────────────────────────────────────────────

export async function refreshLineAction(formData: FormData) {
  const { user } = await requireAdmin();
  const providerLineId = String(formData.get('providerLineId') ?? '');
  const lineId = String(formData.get('lineId') ?? '');
  if (!providerLineId) return { error: 'Missing providerLineId' };

  const provider = getProvider();
  await provider.refreshLine(providerLineId);
  await logAction(user.id, 'line_refresh', lineId, { providerLineId });
  revalidatePath(`/admin/lines/${lineId}`);
  return { success: true };
}

export async function hardResetLineAction(formData: FormData) {
  const { user } = await requireAdmin();
  const providerLineId = String(formData.get('providerLineId') ?? '');
  const lineId = String(formData.get('lineId') ?? '');
  if (!providerLineId) return { error: 'Missing providerLineId' };

  const provider = getProvider();
  await provider.hardResetLine(providerLineId);
  await logAction(user.id, 'line_hard_reset', lineId, { providerLineId });
  revalidatePath(`/admin/lines/${lineId}`);
  return { success: true };
}

export async function hlrResetAction(formData: FormData) {
  const { user } = await requireAdmin();
  const providerLineId = String(formData.get('providerLineId') ?? '');
  const lineId = String(formData.get('lineId') ?? '');
  if (!providerLineId) return { error: 'Missing providerLineId' };

  const provider = getProvider();
  await provider.hlrReset(providerLineId);
  await logAction(user.id, 'line_hlr_reset', lineId, { providerLineId });
  revalidatePath(`/admin/lines/${lineId}`);
  return { success: true };
}

export async function suspendLineAction(formData: FormData) {
  const { user } = await requireAdmin();
  const providerLineId = String(formData.get('providerLineId') ?? '');
  const lineId = String(formData.get('lineId') ?? '');
  const reason = (formData.get('reason') ?? 'admin') as 'billing' | 'voluntary' | 'block' | 'fraud' | 'admin';
  if (!providerLineId) return { error: 'Missing providerLineId' };

  const provider = getProvider();
  await provider.suspendLine(providerLineId, reason);

  const admin = getAdmin();
  await admin.from('telecom_lines').update({ status: 'suspended', updated_at: new Date().toISOString() }).eq('id', lineId);
  await logAction(user.id, 'line_suspended', lineId, { providerLineId, reason });
  revalidatePath(`/admin/lines/${lineId}`);
  revalidatePath('/admin/lines');
  return { success: true };
}

export async function reactivateLineAction(formData: FormData) {
  const { user } = await requireAdmin();
  const providerLineId = String(formData.get('providerLineId') ?? '');
  const lineId = String(formData.get('lineId') ?? '');
  if (!providerLineId) return { error: 'Missing providerLineId' };

  const provider = getProvider();
  await provider.reactivateLine(providerLineId);

  const admin = getAdmin();
  await admin.from('telecom_lines').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', lineId);
  await logAction(user.id, 'line_reactivated', lineId, { providerLineId });
  revalidatePath(`/admin/lines/${lineId}`);
  revalidatePath('/admin/lines');
  return { success: true };
}

export async function terminateLineAction(formData: FormData) {
  const { user } = await requireAdmin();
  const providerLineId = String(formData.get('providerLineId') ?? '');
  const lineId = String(formData.get('lineId') ?? '');
  if (!providerLineId) return { error: 'Missing providerLineId' };

  const provider = getProvider();
  await provider.terminateLine(providerLineId);

  const admin = getAdmin();
  await admin.from('telecom_lines').update({ status: 'terminated', updated_at: new Date().toISOString() }).eq('id', lineId);
  await logAction(user.id, 'line_terminated', lineId, { providerLineId });
  revalidatePath(`/admin/lines/${lineId}`);
  revalidatePath('/admin/lines');
  return { success: true };
}

// ── Plan operations ───────────────────────────────────────────────────────────

export type AdminPlanChangeState = PlanChangeResult | null;

export async function changeLinePlanAdminAction(
  _prev: AdminPlanChangeState,
  formData: FormData,
): Promise<AdminPlanChangeState> {
  const { user } = await requireAdmin();
  const lineId = String(formData.get('lineId') ?? '');
  const newPlanSlug = String(formData.get('newPlanSlug') ?? '');
  const billingModeRaw = String(formData.get('billingMode') ?? 'paid');
  const linePlanId = String(formData.get('linePlanId') ?? '') || null;

  if (!lineId || !newPlanSlug) return { error: 'Missing required fields.' };

  const admin = getAdmin();
  const result = await changeLinePlan({
    admin,
    lineId,
    newPlanSlug,
    billingMode: billingModeRaw === 'carrier_only' ? 'carrier_only' : 'paid',
    actorUserId: user.id,
    linePlanId,
  });

  revalidatePath(`/admin/lines/${lineId}`);
  revalidatePath('/admin/lines');
  revalidatePath('/admin/subscriptions');
  return result;
}

export async function replaceLinePlanAction(formData: FormData) {
  const { user } = await requireAdmin();
  const providerLineId = String(formData.get('providerLineId') ?? '');
  const lineId = String(formData.get('lineId') ?? '');
  const linePlanId = String(formData.get('linePlanId') ?? '');
  const newPlanName = String(formData.get('newPlanName') ?? '');
  if (!providerLineId || !linePlanId || !newPlanName) return { error: 'Missing required fields' };

  const provider = getProvider();
  await provider.replacePlan(providerLineId, linePlanId, newPlanName);
  await logAction(user.id, 'line_plan_replaced', lineId, { providerLineId, linePlanId, newPlanName });
  revalidatePath(`/admin/lines/${lineId}`);
  return { success: true };
}

// ── International number operations ──────────────────────────────────────────

export type AdminAddIntlNumberState = AddIntlNumberResult | null;

export async function addIntlNumberToLineAdminAction(
  _prev: AdminAddIntlNumberState,
  formData: FormData,
): Promise<AdminAddIntlNumberState> {
  const { user } = await requireAdmin();
  const lineId = String(formData.get('lineId') ?? '');
  const country = String(formData.get('country') ?? '') as 'us' | 'canada' | 'uk';
  const number = String(formData.get('number') ?? '');
  const billingModeRaw = String(formData.get('billingMode') ?? 'paid');

  if (!lineId || !number || !['us', 'canada', 'uk'].includes(country)) {
    return { error: 'Choose a number before adding it.' };
  }

  const admin = getAdmin();
  const result = await addIntlNumberToLine({
    admin,
    lineId,
    country,
    number,
    billingMode: billingModeRaw === 'free' ? 'free' : 'paid',
    actorUserId: user.id,
    allowSecondary: true,
  });

  revalidatePath(`/admin/lines/${lineId}`);
  revalidatePath('/admin/lines');
  return result;
}

// ── Topup grants ──────────────────────────────────────────────────────────────

export type AdminGrantTopupState = GrantTopupResult | null;

export async function grantTopupAdminAction(
  _prev: AdminGrantTopupState,
  formData: FormData,
): Promise<AdminGrantTopupState> {
  const { user } = await requireAdmin();
  const lineId = String(formData.get('lineId') ?? '');
  const topupId = String(formData.get('topupId') ?? '');
  const frequency = String(formData.get('frequency') ?? 'once') === 'monthly' ? 'monthly' : 'once';
  const billingMode = String(formData.get('billingMode') ?? 'paid') === 'free' ? 'free' : 'paid';

  if (!lineId || !topupId) return { error: 'Choose a topup before adding it.' };

  const admin = getAdmin();
  const result = await grantTopup({
    admin,
    lineId,
    topupId,
    frequency,
    billingMode,
    source: 'admin',
    actorUserId: user.id,
  });

  revalidatePath(`/admin/lines/${lineId}`);
  return result;
}

export async function cancelTopupGrantAdminAction(
  _prev: AdminGrantTopupState,
  formData: FormData,
): Promise<AdminGrantTopupState> {
  const { user } = await requireAdmin();
  const grantId = String(formData.get('grantId') ?? '');
  const lineId = String(formData.get('lineId') ?? '');
  if (!grantId) return { error: 'Missing grant reference.' };

  const admin = getAdmin();
  const result = await cancelTopupGrant({ admin, grantId, actorUserId: user.id });

  if (lineId) revalidatePath(`/admin/lines/${lineId}`);
  return result;
}

// ── Barring operations ────────────────────────────────────────────────────────

export async function addBarringAction(formData: FormData) {
  const { user } = await requireAdmin();
  const providerLineId = String(formData.get('providerLineId') ?? '');
  const lineId = String(formData.get('lineId') ?? '');
  const type = String(formData.get('type') ?? '');
  if (!providerLineId || !type) return { error: 'Missing required fields' };

  const provider = getProvider();
  await provider.addBarring(providerLineId, type);
  await logAction(user.id, 'barring_added', lineId, { type });
  revalidatePath(`/admin/lines/${lineId}`);
  return { success: true };
}

export async function removeBarringAction(formData: FormData) {
  const { user } = await requireAdmin();
  const providerLineId = String(formData.get('providerLineId') ?? '');
  const lineId = String(formData.get('lineId') ?? '');
  const barringId = String(formData.get('barringId') ?? '');
  if (!providerLineId || !barringId) return { error: 'Missing required fields' };

  const provider = getProvider();
  await provider.removeBarring(providerLineId, barringId);
  await logAction(user.id, 'barring_removed', lineId, { barringId });
  revalidatePath(`/admin/lines/${lineId}`);
  return { success: true };
}

// ── Call forwarding operations ────────────────────────────────────────────────

export async function addForwardAction(formData: FormData) {
  const { user } = await requireAdmin();
  const providerLineId = String(formData.get('providerLineId') ?? '');
  const lineId = String(formData.get('lineId') ?? '');
  const destination = String(formData.get('destination') ?? '');
  if (!providerLineId || !destination) return { error: 'Missing required fields' };

  const provider = getProvider();
  await provider.addForward(providerLineId, destination);
  await logAction(user.id, 'forward_added', lineId, { destination });
  revalidatePath(`/admin/lines/${lineId}`);
  return { success: true };
}

export async function removeForwardAction(formData: FormData) {
  const { user } = await requireAdmin();
  const providerLineId = String(formData.get('providerLineId') ?? '');
  const lineId = String(formData.get('lineId') ?? '');
  const forwardId = String(formData.get('forwardId') ?? '');
  if (!providerLineId || !forwardId) return { error: 'Missing required fields' };

  const provider = getProvider();
  await provider.removeForward(providerLineId, forwardId);
  await logAction(user.id, 'forward_removed', lineId, { forwardId });
  revalidatePath(`/admin/lines/${lineId}`);
  return { success: true };
}

// ── Webhook endpoint operations ───────────────────────────────────────────────

export async function createWebhookEndpointAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const url = String(formData.get('url') ?? '');
  const patternsRaw = String(formData.get('patterns') ?? '');
  if (!url) return;

  const patterns = patternsRaw.split('\n').map((p) => p.trim()).filter(Boolean);
  const provider = getProvider();
  await provider.createWebhookEndpoint(url, patterns);
  revalidatePath('/admin/webhooks');
}

export async function deleteWebhookEndpointAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const provider = getProvider();
  await provider.deleteWebhookEndpoint(id);
  revalidatePath('/admin/webhooks');
}

// ── eSIM profile retrieval ────────────────────────────────────────────────────

export async function recycleEsimProfileAction(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();
  const simId = String(formData.get('simId') ?? '');
  const lineId = String(formData.get('lineId') ?? '');
  if (!simId) return;

  const provider = getProvider();
  await provider.recycleEsimProfile(simId);
  await logAction(user.id, 'esim_profile_recycled', lineId, { simId });
  revalidatePath(`/admin/lines/${lineId}`);
}

// ── Provisioned-notification recovery ────────────────────────────────────────

export type ResendState = { error?: string; success?: string } | null;

// Bypasses the idempotency stamp (force: true) and always resyncs the eSIM
// activation code from the carrier first (resync: true) — this is an explicit
// admin resend, and the stored code can be stale if the profile was
// re-released. Covers the "customer lost / deleted the QR" case.
export async function resendProvisionedEmailAction(
  _prev: ResendState,
  formData: FormData,
): Promise<ResendState> {
  const { user } = await requireAdmin();
  const lineId = String(formData.get('lineId') ?? '');
  const providerLineId = String(formData.get('providerLineId') ?? '') || null;
  if (!lineId) return { error: 'Missing line reference.' };

  const admin = getAdmin();
  const result = await sendProvisionedNotifications(admin, lineId, providerLineId, { force: true, resync: true });

  if (result.skipped) {
    return { error: `Could not send: ${result.reason.replaceAll('_', ' ')}.` };
  }

  await logAction(user.id, 'provisioned_email_resent', lineId, {});
  revalidatePath(`/admin/lines/${lineId}`);
  return { success: 'Fresh QR emailed to the customer.' };
}

// The heavier recovery path: re-issue a fresh, installable eSIM and email its
// QR. Use when the eSIM was already installed/used or a download failed and the
// old code can no longer be installed.
//
// One button, two mechanisms, chosen automatically so support never has to
// know whether the customer already installed it:
//   1. Try recycle_profile on the current eSIM. This regenerates the code on
//      the SAME ICCID (no inventory consumed) and works only while the profile
//      was never downloaded (state RELEASED).
//   2. If the carrier rejects that (the profile is already on a device →
//      "Profile ... is not available"), SWAP the line onto a fresh eSIM from
//      inventory (new ICCID) via the documented swap endpoint.
// Either way the DID (phone number) stays on the line — only the SIM/profile
// changes — so the customer keeps their number and just scans the new QR; any
// eSIM they had installed stops working.
export async function recycleAndResendEsimAction(
  _prev: ResendState,
  formData: FormData,
): Promise<ResendState> {
  const { user } = await requireAdmin();
  const lineId = String(formData.get('lineId') ?? '');
  const providerLineId = String(formData.get('providerLineId') ?? '') || null;
  if (!lineId || !providerLineId) return { error: 'Missing line reference.' };

  const provider = getProvider();
  const admin = getAdmin();

  const { data: lineRow } = await admin
    .from('telecom_lines')
    .select('metadata')
    .eq('id', lineId)
    .maybeSingle();
  const meta = (lineRow?.metadata ?? {}) as Record<string, unknown>;
  const currentIccId = (meta.esim_icc_id as string | undefined) ?? null;

  let iccId: string | null = currentIccId;
  let method: 'recycled' | 'swapped' = 'recycled';

  // Step 1 — try the cheap recycle-in-place (reuses the same eSIM).
  let recycled = false;
  if (currentIccId) {
    try {
      await provider.recycleEsimProfile(currentIccId);
      recycled = true;
    } catch {
      recycled = false; // already installed (or no recyclable profile) — swap instead
    }
  }

  // Step 2 — fall back to swapping in a fresh eSIM from inventory.
  if (!recycled) {
    let newIccId: string | null = null;
    try {
      newIccId = await provider.getAvailableEsimIccId(await collectUsedIccIds(admin));
    } catch (err) {
      return { error: `Could not find a spare eSIM: ${err instanceof Error ? err.message : String(err)}` };
    }
    if (!newIccId) return { error: 'No spare eSIM available in inventory to issue.' };
    try {
      await provider.replaceSim(providerLineId, newIccId);
    } catch (err) {
      return { error: `Swapping to a new eSIM failed at the carrier: ${err instanceof Error ? err.message : String(err)}` };
    }
    method = 'swapped';
    iccId = newIccId;
  }

  if (!iccId) return { error: 'Could not determine the eSIM to re-issue.' };

  // Read the fresh activation code (new matching id after recycle, or the new
  // eSIM's code after a swap).
  let activationCode: string | undefined;
  let smDpPlus: string | undefined;
  try {
    const profile = await provider.getEsimProfile(iccId);
    activationCode = profile.activationCode;
    smDpPlus = profile.smDpPlusAddress;
  } catch (err) {
    return { error: `New eSIM ready, but reading its activation code failed: ${err instanceof Error ? err.message : String(err)}. Try "Refresh & resend" shortly.` };
  }

  // Point the line at the current ICCID + fresh code, clearing the installed
  // marker so the pending-activation UI and the customer's QR reflect the new one.
  await admin
    .from('telecom_lines')
    .update({
      metadata: {
        ...meta,
        esim_icc_id: iccId,
        esim_activation_code: activationCode,
        esim_sm_dp_plus: smDpPlus,
        esim_ready_at: new Date().toISOString(),
        esim_activated_at: null,
      } as never,
      updated_at: new Date().toISOString(),
    })
    .eq('id', lineId);

  // Email the new QR — stored code is now current, so no resync needed.
  const result = await sendProvisionedNotifications(admin, lineId, providerLineId, { force: true });
  if (result.skipped) {
    return { error: `New eSIM issued, but the email could not be sent: ${result.reason.replaceAll('_', ' ')}. Try "Refresh & resend" in a moment.` };
  }

  await logAction(user.id, 'esim_reissued_and_resent', lineId, { method, oldIccId: currentIccId, newIccId: iccId });
  revalidatePath(`/admin/lines/${lineId}`);
  return {
    success:
      method === 'swapped'
        ? 'New eSIM issued (swapped — customer had already installed the old one) and QR emailed.'
        : 'eSIM re-issued and fresh QR emailed to the customer.',
  };
}

// Manual override for "hide the QR once installed" — there is no automatic
// signal from Annatel for first network registration today, so this gives
// admins explicit control instead of the QR showing forever.
// Bind a physical SIM to an already-active line by its ICCID — the card you
// hand over in person or mail out. Uses the dedicated add-SIM endpoint with
// is_main: true so the physical card becomes the line's primary SIM. The
// line's Israeli number is unaffected (it lives on the line, not the SIM), so
// the customer just inserts the card and it works.
export async function assignPhysicalSimAction(
  _prev: ResendState,
  formData: FormData,
): Promise<ResendState> {
  const { user } = await requireAdmin();
  const lineId = String(formData.get('lineId') ?? '');
  const providerLineId = String(formData.get('providerLineId') ?? '') || null;
  const iccId = String(formData.get('iccId') ?? '').replace(/\s+/g, '');
  if (!lineId || !providerLineId) return { error: 'Missing line reference.' };
  if (!/^\d{15,22}$/.test(iccId)) {
    return { error: 'That ICCID doesn’t look right — it should be the 18–20 digit number printed on the SIM.' };
  }

  const provider = getProvider();
  try {
    await provider.assignSim(providerLineId, iccId, true);
  } catch (err) {
    return { error: `Could not attach the SIM at the carrier: ${err instanceof Error ? err.message : String(err)}` };
  }

  // Record which physical card is on the line, and try a refresh so the
  // network registers the new SIM (non-fatal if it doesn't take immediately).
  const admin = getAdmin();
  const { data: lineRow } = await admin.from('telecom_lines').select('metadata').eq('id', lineId).maybeSingle();
  const meta = (lineRow?.metadata ?? {}) as Record<string, unknown>;
  await admin
    .from('telecom_lines')
    .update({
      metadata: { ...meta, sim_icc_id: iccId, sim_assigned_at: new Date().toISOString() } as never,
      updated_at: new Date().toISOString(),
    })
    .eq('id', lineId);
  try {
    await provider.refreshLine(providerLineId);
  } catch {
    // refresh is best-effort — the SIM is attached regardless
  }

  await logAction(user.id, 'physical_sim_assigned', lineId, { iccId });
  revalidatePath(`/admin/lines/${lineId}`);
  return { success: `Physical SIM ${iccId} attached to this line. The customer can insert the card now.` };
}

export async function markEsimInstalledAction(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();
  const lineId = String(formData.get('lineId') ?? '');
  if (!lineId) return;

  const admin = getAdmin();
  const { data: line } = await admin.from('telecom_lines').select('metadata').eq('id', lineId).maybeSingle();
  await admin
    .from('telecom_lines')
    .update({
      metadata: {
        ...((line?.metadata ?? {}) as object),
        esim_activated_at: new Date().toISOString(),
      } as never,
      updated_at: new Date().toISOString(),
    })
    .eq('id', lineId);

  await logAction(user.id, 'esim_marked_installed', lineId, {});
  revalidatePath(`/admin/lines/${lineId}`);
}

// ── Number portability check ──────────────────────────────────────────────────

export async function checkPortabilityAction(formData: FormData) {
  await requireAdmin();
  const number = String(formData.get('number') ?? '');
  if (!number) return { error: 'Phone number required' };

  const provider = getProvider();
  const [availability, operator] = await Promise.all([
    provider.checkPortabilityAvailability(number).catch(() => null),
    provider.checkPortability(number).catch(() => null),
  ]);
  return { availability, operator };
}

// ── Provisioning job operations ──────────────────────────────────────────────

export async function retryProvisioningJobAction(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();
  const jobId = String(formData.get('jobId') ?? '');
  const lineId = String(formData.get('lineId') ?? '');
  if (!jobId || !lineId) return;

  const job = await retryProvisioningJob(jobId);
  await inngest.send({ name: 'provisioning/line.create', data: { jobId: job.id } });
  await logAction(user.id, 'provisioning_job_retry', lineId, { jobId });

  revalidatePath(`/admin/lines/${lineId}`);
  revalidatePath('/admin/lines');
  revalidatePath('/admin/provisioning');
}

export type AdminRemoveIntlNumberState = RemoveIntlNumberResult | null;

export async function removeIntlNumberFromLineAdminAction(
  _prev: AdminRemoveIntlNumberState,
  formData: FormData,
): Promise<AdminRemoveIntlNumberState> {
  const { user } = await requireAdmin();
  const lineId = String(formData.get('lineId') ?? '');
  const number = String(formData.get('number') ?? '');
  if (!lineId || !number) return { error: 'Missing line or number.' };

  const admin = getAdmin();
  const result = await removeIntlNumberFromLine({ admin, lineId, number, actorUserId: user.id });

  revalidatePath(`/admin/lines/${lineId}`);
  revalidatePath('/admin/lines');
  return result;
}

// ── Voicemail (per DID) ───────────────────────────────────────────────────
// Whether BitLink lines have a voicemail box by default is unconfirmed —
// this exposes the capability so it can be tested/used once that's known.

export async function createVoicemailAction(formData: FormData) {
  const { user } = await requireAdmin();
  const providerLineId = String(formData.get('providerLineId') ?? '');
  const lineId = String(formData.get('lineId') ?? '');
  const lineDidId = String(formData.get('lineDidId') ?? '');
  if (!providerLineId || !lineDidId) return { error: 'Missing required fields' };

  const provider = getProvider();
  await provider.createLineDidVoicemail(providerLineId, lineDidId, {
    email: String(formData.get('email') ?? '') || undefined,
    fullname: String(formData.get('fullname') ?? '') || undefined,
    language: String(formData.get('language') ?? '') || undefined,
    greetingLanguage: String(formData.get('greetingLanguage') ?? '') || undefined,
    timezone: String(formData.get('timezone') ?? '') || undefined,
    areRecordingsSentToEmail: formData.get('areRecordingsSentToEmail') === 'on',
  });
  await logAction(user.id, 'voicemail_created', lineId, { lineDidId });
  revalidatePath(`/admin/lines/${lineId}`);
  return { success: true };
}

export async function deleteVoicemailAction(formData: FormData) {
  const { user } = await requireAdmin();
  const providerLineId = String(formData.get('providerLineId') ?? '');
  const lineId = String(formData.get('lineId') ?? '');
  const lineDidId = String(formData.get('lineDidId') ?? '');
  const voicemailId = String(formData.get('voicemailId') ?? '');
  if (!providerLineId || !lineDidId || !voicemailId) return { error: 'Missing required fields' };

  const provider = getProvider();
  await provider.deleteLineDidVoicemail(providerLineId, lineDidId, voicemailId);
  await logAction(user.id, 'voicemail_deleted', lineId, { lineDidId, voicemailId });
  revalidatePath(`/admin/lines/${lineId}`);
  return { success: true };
}

// ── SMS forwarding (per DID) ──────────────────────────────────────────────
// Additive backup delivery only — device delivery already works without it.

export async function addSmsForwarderAction(formData: FormData) {
  const { user } = await requireAdmin();
  const providerLineId = String(formData.get('providerLineId') ?? '');
  const lineId = String(formData.get('lineId') ?? '');
  const lineDidId = String(formData.get('lineDidId') ?? '');
  const emailRecipientAddress = String(formData.get('emailRecipientAddress') ?? '');
  if (!providerLineId || !lineDidId || !emailRecipientAddress) return { error: 'Missing required fields' };

  const provider = getProvider();
  await provider.addLineDidSmsForwarder(providerLineId, lineDidId, {
    emailRecipientAddress,
    telegramChatId: String(formData.get('telegramChatId') ?? '') || undefined,
  });
  await logAction(user.id, 'sms_forwarder_added', lineId, { lineDidId, emailRecipientAddress });
  revalidatePath(`/admin/lines/${lineId}`);
  return { success: true };
}

export async function removeSmsForwarderAction(formData: FormData) {
  const { user } = await requireAdmin();
  const providerLineId = String(formData.get('providerLineId') ?? '');
  const lineId = String(formData.get('lineId') ?? '');
  const lineDidId = String(formData.get('lineDidId') ?? '');
  const settingId = String(formData.get('settingId') ?? '');
  if (!providerLineId || !lineDidId || !settingId) return { error: 'Missing required fields' };

  const provider = getProvider();
  await provider.removeLineDidSmsForwarder(providerLineId, lineDidId, settingId);
  await logAction(user.id, 'sms_forwarder_removed', lineId, { lineDidId, settingId });
  revalidatePath(`/admin/lines/${lineId}`);
  return { success: true };
}

// ── Caller ID (CLID) ──────────────────────────────────────────────────────
// Valid destination_group_name values are unconfirmed — ask Annatel before
// relying on this for a customer-facing feature.

export async function addClidAction(formData: FormData) {
  const { user } = await requireAdmin();
  const providerLineId = String(formData.get('providerLineId') ?? '');
  const lineId = String(formData.get('lineId') ?? '');
  const callerId = String(formData.get('callerId') ?? '');
  const destinationGroupName = String(formData.get('destinationGroupName') ?? '');
  const service = String(formData.get('service') ?? 'voice');
  if (!providerLineId || !callerId || !destinationGroupName) return { error: 'Missing required fields' };

  const weightRaw = String(formData.get('destinationGroupWeight') ?? '');
  const provider = getProvider();
  await provider.addLineClid(providerLineId, {
    callerId,
    destinationGroupName,
    destinationGroupWeight: weightRaw ? Number(weightRaw) : undefined,
    service,
  });
  await logAction(user.id, 'clid_added', lineId, { callerId, destinationGroupName, service });
  revalidatePath(`/admin/lines/${lineId}`);
  return { success: true };
}

export async function removeClidAction(formData: FormData) {
  const { user } = await requireAdmin();
  const providerLineId = String(formData.get('providerLineId') ?? '');
  const lineId = String(formData.get('lineId') ?? '');
  const clidId = String(formData.get('clidId') ?? '');
  if (!providerLineId || !clidId) return { error: 'Missing required fields' };

  const provider = getProvider();
  await provider.removeLineClid(providerLineId, clidId);
  await logAction(user.id, 'clid_removed', lineId, { clidId });
  revalidatePath(`/admin/lines/${lineId}`);
  return { success: true };
}

// ── Aflalo requests (Israeli telemarketing-consent, UNCONFIRMED effect) ───
// Deliberately requires typing the number to confirm, on top of the
// UI-level confirm dialog — this changes something on a real customer
// number and nobody on our side is fully sure what "open"/"block" does.

export async function createAflaloRequestAction(formData: FormData) {
  const { user } = await requireAdmin();
  const lineId = String(formData.get('lineId') ?? '');
  const number = String(formData.get('number') ?? '');
  const operation = String(formData.get('operation') ?? '');
  if (!number || (operation !== 'open' && operation !== 'block')) {
    return { error: 'Missing number or invalid operation' };
  }

  const provider = getProvider();
  await provider.createAflaloRequest(number, operation);
  await logAction(user.id, 'aflalo_request_created', lineId, { number, operation });
  revalidatePath(`/admin/lines/${lineId}`);
  return { success: true };
}

// ── US/UK/Canada port-in requests (existing line) ─────────────────────────
// Always a manual process — Annatel coordinates with the losing carrier by
// email, same as the customer-facing /keep-your-number flow. This is pure
// tracking plus the "attach it once it's landed" completion step.

export async function createIntlPortInRequestAction(formData: FormData) {
  const { user } = await requireAdmin();
  const lineId = String(formData.get('lineId') ?? '');
  const country = String(formData.get('country') ?? '') as 'us' | 'canada' | 'uk';
  const number = String(formData.get('number') ?? '').trim();
  if (!lineId || !number || !['us', 'canada', 'uk'].includes(country)) {
    return { error: 'Missing required fields' };
  }

  const admin = getAdmin();
  const result = await createIntlPortInRequest({
    admin,
    lineId,
    country,
    number,
    oneTimeFeeBillingMode: formData.get('oneTimeFeeBillingMode') === 'free' ? 'free' : 'paid',
    monthlyBillingMode: formData.get('monthlyBillingMode') === 'free' ? 'free' : 'paid',
    actorUserId: user.id,
  });
  await logAction(user.id, 'intl_port_in_requested', lineId, { country, number });
  revalidatePath(`/admin/lines/${lineId}`);
  return result;
}

export async function advanceIntlPortInRequestAction(formData: FormData) {
  const { user } = await requireAdmin();
  const lineId = String(formData.get('lineId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const status = String(formData.get('status') ?? '') as 'in_progress' | 'cancelled';
  if (!lineId || !requestId || !['in_progress', 'cancelled'].includes(status)) {
    return { error: 'Missing required fields' };
  }

  const admin = getAdmin();
  const result = await setIntlPortInStatus(admin, requestId, status);
  await logAction(user.id, `intl_port_in_${status}`, lineId, { requestId });
  revalidatePath(`/admin/lines/${lineId}`);
  return result;
}

export async function completeIntlPortInRequestAction(formData: FormData) {
  const { user } = await requireAdmin();
  const lineId = String(formData.get('lineId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  if (!lineId || !requestId) return { error: 'Missing required fields' };

  const admin = getAdmin();
  const result = await completeIntlPortInRequest(admin, requestId);
  await logAction(user.id, 'intl_port_in_completed', lineId, { requestId });
  revalidatePath(`/admin/lines/${lineId}`);
  return result;
}

// ── Israeli port-in to an existing line ────────────────────────────────────
// The mechanism is proven (two real numbers landed this way, Jul 7 2026),
// but Annatel only ever lands a ported number as part of a NEW line — so
// this drives a temporary landing line, then relocates the DID onto the
// real target line. See lib/custom-orders/israeli-port-in.ts for the why.

export async function createIsraeliPortInRequestAction(formData: FormData) {
  const { user } = await requireAdmin();
  const lineId = String(formData.get('lineId') ?? '');
  const number = String(formData.get('number') ?? '').trim();
  const mode = String(formData.get('mode') ?? '') as 'replace' | 'secondary';
  if (!lineId || !number || !['replace', 'secondary'].includes(mode)) {
    return { error: 'Missing required fields' };
  }

  const admin = getAdmin();
  const result = await createIsraeliPortInRequest({
    admin,
    lineId,
    number,
    mode,
    billingMode: formData.get('billingMode') === 'free' ? 'free' : 'paid',
    actorUserId: user.id,
  });
  await logAction(user.id, 'israeli_port_in_requested', lineId, { number, mode });
  revalidatePath(`/admin/lines/${lineId}`);
  return result;
}

export async function sendPortInAuthCodeAction(formData: FormData) {
  const { user } = await requireAdmin();
  const lineId = String(formData.get('lineId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  if (!lineId || !requestId) return { error: 'Missing required fields' };

  const admin = getAdmin();
  const result = await sendPortInAuthCode(admin, requestId);
  await logAction(user.id, 'israeli_port_in_auth_sent', lineId, { requestId });
  revalidatePath(`/admin/lines/${lineId}`);
  return result;
}

export async function verifyPortInAuthCodeAction(formData: FormData) {
  const { user } = await requireAdmin();
  const lineId = String(formData.get('lineId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  const code = String(formData.get('code') ?? '');
  if (!lineId || !requestId || !code) return { error: 'Missing required fields' };

  const admin = getAdmin();
  const result = await verifyPortInAuthCode(admin, requestId, code);
  await logAction(user.id, 'israeli_port_in_verified', lineId, { requestId });
  revalidatePath(`/admin/lines/${lineId}`);
  return result;
}

export async function startIsraeliPortInAction(formData: FormData) {
  const { user } = await requireAdmin();
  const lineId = String(formData.get('lineId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  if (!lineId || !requestId) return { error: 'Missing required fields' };

  const admin = getAdmin();
  const result = await startIsraeliPortIn(admin, requestId);
  await logAction(user.id, 'israeli_port_in_started', lineId, { requestId });
  revalidatePath(`/admin/lines/${lineId}`);
  return result;
}

export async function refreshIsraeliPortInStatusAction(formData: FormData) {
  await requireAdmin();
  const lineId = String(formData.get('lineId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  if (!lineId || !requestId) return { error: 'Missing required fields' };

  const admin = getAdmin();
  const result = await refreshIsraeliPortInStatus(admin, requestId);
  revalidatePath(`/admin/lines/${lineId}`);
  return result;
}

export async function completeIsraeliPortInAction(formData: FormData) {
  const { user } = await requireAdmin();
  const lineId = String(formData.get('lineId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  if (!lineId || !requestId) return { error: 'Missing required fields' };

  const admin = getAdmin();
  const result = await completeIsraeliPortIn(admin, requestId);
  await logAction(user.id, 'israeli_port_in_completed', lineId, { requestId });
  revalidatePath(`/admin/lines/${lineId}`);
  return result;
}

export async function cancelIsraeliPortInAction(formData: FormData) {
  const { user } = await requireAdmin();
  const lineId = String(formData.get('lineId') ?? '');
  const requestId = String(formData.get('requestId') ?? '');
  if (!lineId || !requestId) return { error: 'Missing required fields' };

  const admin = getAdmin();
  const result = await cancelIsraeliPortIn(admin, requestId);
  await logAction(user.id, 'israeli_port_in_cancelled', lineId, { requestId });
  revalidatePath(`/admin/lines/${lineId}`);
  return result;
}
