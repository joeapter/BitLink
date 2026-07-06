"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTelecomProvider } from "@/lib/telecom/provider.registry";
import { retryProvisioningJob } from "@/lib/provisioning/orchestrator";
import { inngest } from "@/inngest/client";

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
