// Provisioning orchestrator — single execution engine for all provisioning jobs.
//
// Retry architecture (Option B):
//   - Provider failures write FAILED state and return cleanly (no re-throw).
//     Inngest retries are only for infrastructure failures (DB down, network, etc.).
//   - retryProvisioningJob() is the sole explicit retry path for provider failures.
//   - Callers of retryProvisioningJob() are responsible for re-enqueueing via Inngest.
//
// provider_line_id lifecycle:
//   - Only stamped when non-null (async providers return null until job completes).
//   - completeJob() accepts an optional providerLineId to stamp on completion.
//   - Line update happens BEFORE job COMPLETED write so retries are safe.

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';
import { withProviderContext } from '@/lib/telecom/provider-context';
import { sendEmail } from '@/lib/email/send';
import { logger } from '@/lib/logger';
import { emit } from '@/lib/events/bus';
import {
  transition,
  type ProvisioningJob,
  type ProvisioningJobStatus,
} from '@/lib/provisioning/state-machines/provisioning-job';
import {
  transitionLine,
  InvalidLineTransitionError,
  type LineStateMachineRecord,
  type LineStateMachineStatus,
} from '@/lib/provisioning/state-machines/line';
import * as linesRepo from '@/lib/db/lines';
import * as jobsRepo from '@/lib/db/jobs';
import { recordReferralForLine } from '@/lib/referral-service';
import type { ProvisioningJobType, LineCreateParams } from '@/types/telecom';

type Admin = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

const log = logger.child({ module: 'orchestrator' });

// Admin alert so failed jobs surface immediately instead of waiting for
// someone to open the admin console. Must be awaited — a dangling promise
// dies with the serverless invocation before SMTP completes.
async function notifyAdminOfJobFailure(job: ProvisioningJob, errMsg: string): Promise<void> {
  await sendEmail({
    to: 'joe@bitlink.co.il',
    subject: `⚠ Provisioning FAILED — ${job.type} (attempt ${job.attempt_count + 1})`,
    html: [
      `<p>Provisioning job <b>${job.id}</b> failed.</p>`,
      `<p><b>Error:</b> ${errMsg}</p>`,
      job.line_id
        ? `<p><a href="https://www.bitlink.co.il/admin/lines/${job.line_id}">Open the line in admin</a> to inspect and retry.</p>`
        : '',
    ].join(''),
  }).catch(() => {
    // alerting is best-effort; never let it mask the original failure
  });
}

// A brand-new line went ACTIVE with no phone number after exhausting every
// DID candidate — the job itself still "succeeds" (the line works, just
// silently has no number), so this doesn't go through notifyAdminOfJobFailure.
// Real incident 2026-07-21: this failure mode had zero visibility until a
// customer noticed and Joe asked why her line had no number.
async function notifyAdminOfDidAssignmentFailure(lineId: string, attempts: number, lastError: string): Promise<void> {
  await sendEmail({
    to: 'joe@bitlink.co.il',
    subject: `⚠ Line active with NO phone number — DID assignment exhausted ${attempts} candidates`,
    html: [
      `<p>Line <b>${lineId}</b> finished provisioning and is ACTIVE, but every available Israeli number candidate failed to attach.</p>`,
      `<p><b>Last error:</b> ${lastError}</p>`,
      `<p><a href="https://www.bitlink.co.il/admin/lines/${lineId}">Open the line in admin</a> to assign a number manually.</p>`,
    ].join(''),
  }).catch(() => {
    // alerting is best-effort; never let it mask the original failure
  });
}

// ICCIDs consumed by lines or reserved by in-flight jobs — the provider's SIM
// listing keeps consumed SIMs, so without this every order picks the same SIM.
export async function collectUsedIccIds(admin: Admin): Promise<string[]> {
  const [{ data: jobs }, { data: lines }] = await Promise.all([
    admin
      .from('provisioning_jobs')
      .select('payload')
      .not('payload->>iccId', 'is', null)
      .in('status', ['pending', 'submitted', 'syncing', 'completed']),
    admin
      .from('telecom_lines')
      .select('metadata')
      .not('metadata->>esim_icc_id', 'is', null),
  ]);
  const fromJobs = (jobs ?? []).map((j) => (j.payload as Record<string, unknown>)?.iccId as string | undefined);
  const fromLines = (lines ?? []).map((l) => (l.metadata as Record<string, unknown>)?.esim_icc_id as string | undefined);
  return [...fromJobs, ...fromLines].filter((x): x is string => Boolean(x));
}

// Numbers already assigned to lines — excluded when picking a fresh DID.
async function collectUsedNumbers(admin: Admin): Promise<string[]> {
  const { data: existingLines } = await admin
    .from('telecom_lines')
    .select('metadata')
    .not('metadata->>phone_number', 'is', null);
  return (existingLines ?? [])
    .map((l) => (l.metadata as Record<string, unknown>)?.phone_number as string | undefined)
    .filter((n): n is string => Boolean(n));
}

function requireAdmin(): Admin {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error('Supabase admin client unavailable — check SUPABASE_SERVICE_ROLE_KEY');
  return admin;
}

// ----------------------------------------------------------------
// Create
// ----------------------------------------------------------------

export interface CreateJobParams {
  lineId: string;
  type: ProvisioningJobType;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
  maxAttempts?: number;
  createdBy?: string;
}

export async function createProvisioningJob(params: CreateJobParams): Promise<ProvisioningJob> {
  const admin = requireAdmin();
  const idempotencyKey = params.idempotencyKey ?? crypto.randomUUID();

  const job = await jobsRepo.createJob(admin, {
    lineId: params.lineId,
    type: params.type,
    payload: params.payload,
    idempotencyKey,
    maxAttempts: params.maxAttempts ?? 3,
    createdBy: params.createdBy ?? null,
  });

  log.info({ jobId: job.id, type: job.type, lineId: params.lineId }, 'Provisioning job created');
  return job;
}

// ----------------------------------------------------------------
// Process
// ----------------------------------------------------------------

export interface ProcessResult {
  status: ProvisioningJobStatus;
  skipped?: boolean;
  providerJobId?: string;
  error?: string;
}

export async function processProvisioningJob(jobId: string): Promise<ProcessResult> {
  const admin = requireAdmin();
  const job = await jobsRepo.getJob(admin, jobId);
  if (!job) throw new Error(`Provisioning job not found: ${jobId}`);

  if (job.status === 'COMPLETED' || job.status === 'CANCELLED') {
    log.info({ jobId, status: job.status }, 'Job already terminal — skipping');
    return { status: job.status, skipped: true };
  }

  // Re-entrant after a crash mid-execution: hand off to reconciler
  if (job.status === 'SUBMITTED' || job.status === 'SYNCING') {
    log.warn({ jobId, status: job.status }, 'Job in intermediate state on entry — reconciling');
    return reconcileJob(jobId);
  }

  if (job.status !== 'PENDING') {
    log.warn({ jobId, status: job.status }, 'Job not PENDING — skipping');
    return { status: job.status, skipped: true };
  }

  switch (job.type) {
    case 'create_line':
      return executeCreateLine(admin, job);
    default:
      throw new Error(`Unsupported provisioning job type: ${job.type}`);
  }
}

// ----------------------------------------------------------------
// create_line execution
// ----------------------------------------------------------------

async function executeCreateLine(admin: Admin, job: ProvisioningJob): Promise<ProcessResult> {
  const provider = getTelecomProvider();
  const payload = job.payload as Pick<
    LineCreateParams,
    'externalId' | 'planName' | 'iccId' | 'isKosher' | 'email' | 'language' | 'identityNumber' | 'portInParams' | 'metadata' | 'phoneNumber'
  >;

  // PENDING → SUBMITTED
  const submitted = transition(job, 'SUBMITTED');
  await jobsRepo.updateJob(admin, job.id, {
    status: 'submitted',
    status_transitions: submitted.status_transitions,
    updated_at: submitted.updated_at,
    attempt_count: job.attempt_count + 1,
  });
  log.info({ jobId: job.id, lineId: job.line_id }, 'Submitted to provider');

  const ctx = {
    correlationId: crypto.randomUUID(),
    provisioningJobId: job.id,
    telecomLineId: job.line_id ?? undefined,
  };

  // For eSIM orders without a pre-assigned ICC ID, pick one from Annatel's inventory.
  const isEsim = payload.metadata?.is_esim === true;
  let resolvedIccId = payload.iccId;
  if (isEsim && !resolvedIccId) {
    resolvedIccId = (await provider.getAvailableEsimIccId(await collectUsedIccIds(admin))) ?? undefined;
    if (resolvedIccId) {
      // Persist the pick: retries reuse the same SIM, and concurrent orders
      // see it as reserved via collectUsedIccIds.
      await admin
        .from('provisioning_jobs')
        .update({
          payload: { ...(job.payload as Record<string, unknown>), iccId: resolvedIccId } as never,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);
    }
    if (!resolvedIccId) {
      const errMsg = 'No available eSIM profiles in Annatel inventory';
      const failed = transition(submitted, 'FAILED', { error: errMsg });
      await jobsRepo.updateJob(admin, job.id, {
        status: 'failed',
        status_transitions: failed.status_transitions,
        updated_at: failed.updated_at,
        error: errMsg,
      });
      if (job.line_id) {
        await applyLineTransition(admin, job.line_id, 'FAILED', { jobId: job.id, error: errMsg });
      }
      return { status: 'FAILED', error: errMsg };
    }
    // resolvedIccId now held in local scope; propagated to completeJob via createLine result
  }

  // Annatel confirmed Jul 7 2026: a create request is either a port-in or a
  // DID assignment, never both. For port-in creates, put the ported number only
  // in port_in_request_params.number and omit dids entirely.
  const createPhoneNumber = payload.portInParams ? undefined : payload.phoneNumber;

  let result;
  try {
    result = await withProviderContext(ctx, () =>
      provider.createLine({
        externalId: payload.externalId,
        planName: payload.planName,
        iccId: resolvedIccId,
        isKosher: payload.isKosher ?? false,
        email: payload.email,
        language: payload.language ?? 'he_IL',
        identityNumber:
          payload.identityNumber ??
          process.env.ANNATEL_DEFAULT_IDENTITY_NUMBER?.trim() ??
          '341280188',
        phoneNumber: createPhoneNumber,
        portInParams: payload.portInParams,
        metadata: payload.metadata,
      }),
    );
  } catch (err) {
    // Provider failure: mark FAILED and return cleanly — no re-throw.
    // Inngest retries are reserved for infrastructure failures only.
    // Use retryProvisioningJob() for explicit operator-controlled retries.
    const errMsg = err instanceof Error ? err.message : String(err);
    const failed = transition(submitted, 'FAILED', { error: errMsg });
    await jobsRepo.updateJob(admin, job.id, {
      status: 'failed',
      status_transitions: failed.status_transitions,
      updated_at: failed.updated_at,
      error: errMsg,
    });
    if (job.line_id) {
      await applyLineTransition(admin, job.line_id, 'FAILED', { jobId: job.id, error: errMsg });
    }
    log.error({ jobId: job.id, error: errMsg }, 'Provider createLine failed');
    await notifyAdminOfJobFailure(job, errMsg);
    return { status: 'FAILED', error: errMsg };
  }

  // Only stamp provider_line_id when non-null (async providers return null on initial submission)
  if (job.line_id) {
    const lineUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (result.providerLineId) {
      lineUpdates.provider_line_id = result.providerLineId;
    }
    if (createPhoneNumber) {
      // DID went out in the create request — record it now so completeJob
      // (which may run in a later invocation) knows not to assign another.
      const existingMeta = ((await linesRepo.getLine(admin, job.line_id))?.metadata ?? {}) as Record<string, unknown>;
      lineUpdates.metadata = { ...existingMeta, phone_number: createPhoneNumber };
    }
    await linesRepo.updateLine(admin, job.line_id, lineUpdates);
    await applyLineTransition(admin, job.line_id, 'PROVISIONING', { jobId: job.id });
  }

  // SUBMITTED → SYNCING
  const syncing = transition(submitted, 'SYNCING', {
    providerJobId: result.providerJobId,
    providerLineId: result.providerLineId,
  });
  await jobsRepo.updateJob(admin, job.id, {
    status: 'syncing',
    status_transitions: syncing.status_transitions,
    updated_at: syncing.updated_at,
    provider_job_id: result.providerJobId,
  });

  // Sync providers (mock) resolve immediately
  if (result.status === 'done') {
    return completeJob(admin, syncing, job.line_id!, result.providerLineId);
  }

  log.info({ jobId: job.id, providerJobId: result.providerJobId }, 'Awaiting async provider completion');
  return { status: 'SYNCING', providerJobId: result.providerJobId };
}

// ----------------------------------------------------------------
// Complete
// Line update happens BEFORE job COMPLETED write so Inngest retries are safe:
//   - If line update succeeds but job write fails → retry re-runs line update
//     (InvalidLineTransitionError silently swallowed) then completes job.
//   - If job write succeeds → any subsequent retry sees COMPLETED and skips.
// ----------------------------------------------------------------

async function completeJob(
  admin: Admin,
  job: ProvisioningJob,
  lineId: string,
  providerLineId?: string | null,
): Promise<ProcessResult> {
  const provider = getTelecomProvider();
  const payload = job.payload as Record<string, unknown>;

  // Stamp provider_line_id if now available (async path: provider assigns it on completion)
  const lineUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (providerLineId) lineUpdates.provider_line_id = providerLineId;

  // Auto-assign a DID and collect eSIM activation code for storage in metadata
  if (providerLineId) {
    try {
      const currentMeta = ((await linesRepo.getLine(admin, lineId))?.metadata ?? {}) as Record<string, unknown>;
      const portInParams = payload.portInParams as { number?: string } | undefined;
      if (portInParams) {
        // The job only completes once the port has executed — the ported
        // number IS the line's number now. Stamp it so the portal and emails
        // show it instead of "pending assignment".
        lineUpdates.metadata = {
          ...currentMeta,
          phone_number: portInParams.number ?? currentMeta.phone_number,
          pending_port_in_number: null,
        };
        log.info({ jobId: job.id, lineId, number: portInParams.number }, 'Port-in line — ported number stamped, skipping DID auto-assign');
      } else if (currentMeta.phone_number) {
        // A DID already went out with the create request (port-in technical
        // number) — assigning another would double-book inventory.
        log.info({ jobId: job.id, lineId, did: currentMeta.phone_number }, 'Line already has a number — skipping DID auto-assign');
      } else {
        // getAvailableDid() only ever offers Israeli (+972) candidates, but
        // its listing has no way to know a number is already attached
        // elsewhere at the provider (no live assignment status in the DID
        // pool endpoint) — a candidate can still get rejected with a 422.
        // Retry against the next candidate instead of giving up on the
        // first rejection, which used to leave the line silently numberless.
        const excluded = await collectUsedNumbers(admin);
        let assigned: string | null = null;
        let lastError = '';
        const MAX_DID_ATTEMPTS = 5;
        for (let attempt = 0; attempt < MAX_DID_ATTEMPTS; attempt++) {
          const candidate = await provider.getAvailableDid(excluded);
          if (!candidate) break;
          try {
            await provider.assignDid(providerLineId, candidate);
            assigned = candidate;
            break;
          } catch (err) {
            lastError = err instanceof Error ? err.message : String(err);
            excluded.push(candidate);
            log.warn({ jobId: job.id, lineId, candidate, error: lastError }, 'DID candidate rejected — trying next');
          }
        }
        if (assigned) {
          lineUpdates.metadata = { ...currentMeta, phone_number: assigned };
          log.info({ jobId: job.id, lineId, did: assigned }, 'DID auto-assigned');
        } else {
          log.error({ jobId: job.id, lineId, lastError }, 'No Israeli DID could be assigned after retries — line active without phone number');
          await notifyAdminOfDidAssignmentFailure(lineId, MAX_DID_ATTEMPTS, lastError || 'No available DID candidates found');
        }
      }
    } catch (err) {
      log.error({ jobId: job.id, lineId, error: err instanceof Error ? err.message : String(err) }, 'DID assignment failed — continuing');
    }

    // Attach a reserved international add-on number (US/CA/UK), if the
    // customer picked one at checkout — same assignDid() call used for the
    // primary Israeli DID above, attaching a second number to the same line.
    try {
      const metaForIntl = ((lineUpdates.metadata ?? (await linesRepo.getLine(admin, lineId))?.metadata ?? {}) as Record<string, unknown>);
      const intlNumber = metaForIntl.intl_number as Record<string, unknown> | undefined;
      if (intlNumber && intlNumber.status === 'reserved' && intlNumber.number) {
        const number = intlNumber.number as string;
        await provider.assignDid(providerLineId, number);
        await admin
          .from('international_dids')
          .update({ status: 'assigned', assigned_line_id: lineId, assigned_at: new Date().toISOString() })
          .eq('number', number);
        lineUpdates.metadata = {
          ...metaForIntl,
          intl_number: { ...intlNumber, status: 'assigned', assigned_at: new Date().toISOString() },
        };
        log.info({ jobId: job.id, lineId, number }, 'International add-on number assigned');
      }
    } catch (err) {
      log.error({ jobId: job.id, lineId, error: err instanceof Error ? err.message : String(err) }, 'Intl number assignment failed — continuing, admin can retry manually');
    }

    // Fetch and store eSIM activation code if applicable
    if (payload.metadata && (payload.metadata as Record<string, unknown>).is_esim) {
      try {
        const sims = await provider.listLineSims(providerLineId);
        const mainSim = sims.find((s) => s.isMain) ?? sims[0];
        if (mainSim?.iccId) {
          const esimProfile = await provider.getEsimProfile(mainSim.iccId);
          const existingMeta = ((lineUpdates.metadata ?? (await linesRepo.getLine(admin, lineId))?.metadata ?? {}) as Record<string, unknown>);
          lineUpdates.metadata = {
            ...existingMeta,
            ...(lineUpdates.metadata as Record<string, unknown> | undefined ?? {}),
            esim_icc_id: mainSim.iccId,
            esim_activation_code: esimProfile.activationCode,
            esim_sm_dp_plus: esimProfile.smDpPlusAddress,
          };
          log.info({ jobId: job.id, lineId }, 'eSIM activation code stored');
        }
      } catch (err) {
        log.error({ jobId: job.id, lineId, error: err instanceof Error ? err.message : String(err) }, 'eSIM profile fetch failed — continuing');
      }
    }
  }

  await linesRepo.updateLine(admin, lineId, lineUpdates);

  // Transition line → ACTIVE before marking job COMPLETED
  await applyLineTransition(admin, lineId, 'ACTIVE', {
    jobId: job.id,
  });

  // orders.provisioning_status has no FK to a specific line — it's only ever
  // stamped 'payment_confirmed' at purchase time (checkout webhook, custom
  // orders, account add-line) and otherwise relied on an admin to advance it
  // by hand, so it silently piled up forever. Best available correlation is
  // customer_id: once any of a customer's lines goes active, their still-
  // pending orders are, in practice, the one(s) that order was waiting on.
  try {
    const freshLine = await linesRepo.getLine(admin, lineId);
    const customerId = freshLine?.customer_id as string | null | undefined;
    if (customerId) {
      await admin
        .from('orders')
        .update({ provisioning_status: 'active', updated_at: new Date().toISOString() })
        .eq('customer_id', customerId)
        .eq('provisioning_status', 'payment_confirmed');
    }
  } catch (err) {
    log.error({ jobId: job.id, lineId, error: err instanceof Error ? err.message : String(err) }, 'Failed to auto-advance orders.provisioning_status — continuing');
  }

  // The subscribers row is created 'provisioning' at checkout and is otherwise
  // only flipped to 'active' by a Stripe subscription.created/updated webhook
  // keyed on stripe_subscription_id — which races the checkout that creates the
  // row and, if it lands first, early-returns with no subscriber found and
  // never retries, leaving rows stuck 'provisioning' forever. The line going
  // active is the reliable signal, so reconcile the subscriber here, keyed on
  // telecom_line_id. Only advance from 'provisioning' so we never clobber a
  // suspended/cancelled state.
  try {
    await admin
      .from('subscribers')
      .update({ status: 'active', activated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('telecom_line_id', lineId)
      .eq('status', 'provisioning');
  } catch (err) {
    log.error({ jobId: job.id, lineId, error: err instanceof Error ? err.message : String(err) }, 'Failed to activate subscriber status — continuing');
  }

  try {
    const referralResult = await recordReferralForLine(admin, lineId);
    if (referralResult.referralId) {
      log.info(
        { jobId: job.id, lineId, referralId: referralResult.referralId, salesRepId: referralResult.salesRepId ?? null },
        'Referral attribution recorded for active line',
      );
    }
  } catch (err) {
    log.error({ jobId: job.id, lineId, error: err instanceof Error ? err.message : String(err) }, 'Referral attribution failed — continuing');
  }

  const completed = transition(job, 'COMPLETED');
  await jobsRepo.updateJob(admin, job.id, {
    status: 'completed',
    status_transitions: completed.status_transitions,
    updated_at: completed.updated_at,
    completed_at: completed.completed_at,
  });

  await emit({
    type: 'provisioning.line.created',
    aggregateType: 'line',
    aggregateId: lineId,
    payload: { jobId: job.id, providerJobId: job.provider_job_id },
    source: 'system',
    occurredAt: new Date().toISOString(),
  });

  // Mark intl port-in as pending manual processing now that Israeli line is active.
  // US/CA/UK port-ins are processed manually by Annatel — not via API.
  if (providerLineId) {
    const freshLine = await linesRepo.getLine(admin, lineId);
    const lineMeta = (freshLine?.metadata ?? {}) as Record<string, unknown>;
    const portInIntent = lineMeta.intl_port_in as Record<string, unknown> | undefined;
    if (portInIntent && portInIntent.status === 'awaiting_israeli_line') {
      try {
        const updatedMeta = (await linesRepo.getLine(admin, lineId))?.metadata as Record<string, unknown> ?? {};
        await linesRepo.updateLine(admin, lineId, {
          metadata: {
            ...updatedMeta,
            intl_port_in: {
              ...portInIntent,
              status: 'manual_pending',
              attempted_at: new Date().toISOString(),
            },
          } as never,
        });
        log.info({ jobId: job.id, lineId, number: portInIntent.number }, 'Intl port-in marked manual_pending — awaiting Annatel manual processing');
      } catch (err) {
        log.error({ jobId: job.id, lineId, error: err instanceof Error ? err.message : String(err) }, 'Failed to update intl port-in status — continuing');
      }
    }
  }

  // Notify the customer (and admin) regardless of which path completed the
  // job — direct processing, the reconcile cron, or the Annatel webhook.
  // notify-provisioned is idempotent, so double-delivery of this event is safe.
  //
  // If the Inngest dispatch itself fails (this happened silently once before —
  // a customer's eSIM sat ready for hours with no email, and the only trace
  // was a log.warn nobody saw), send the notification synchronously right here
  // as a fallback so the customer is never silently missed again.
  try {
    const { inngest } = await import('@/inngest/client');
    await inngest.send({
      name: 'provisioning/line.completed',
      data: { lineId, providerLineId: providerLineId ?? null, jobId: job.id },
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    log.error({ jobId: job.id, error: errMsg }, 'Failed to dispatch provisioning/line.completed — sending fallback notification directly');
    try {
      const { sendProvisionedNotifications } = await import('@/lib/notifications/send-provisioned');
      await sendProvisionedNotifications(admin, lineId, providerLineId ?? null);
    } catch (fallbackErr) {
      const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      log.error({ jobId: job.id, error: fallbackMsg }, 'Fallback notification also failed — customer was NOT notified');
      await sendEmail({
        to: 'joe@bitlink.co.il',
        subject: `⚠ Line provisioned but customer NOT notified — ${lineId}`,
        html: [
          `<p>Line <b>${lineId}</b> completed provisioning successfully, but BOTH the event dispatch and the direct fallback failed to notify the customer.</p>`,
          `<p><b>Dispatch error:</b> ${errMsg}</p>`,
          `<p><b>Fallback error:</b> ${fallbackMsg}</p>`,
          `<p><a href="https://www.bitlink.co.il/admin/lines/${lineId}">Open the line in admin</a> to resend manually.</p>`,
        ].join(''),
      }).catch(() => {
        // last resort — nothing more we can do if even this send fails
      });
    }
  }

  log.info({ jobId: job.id, lineId }, 'Line provisioning completed');
  return { status: 'COMPLETED' };
}

// ----------------------------------------------------------------
// Reconcile single job
// ----------------------------------------------------------------

export async function reconcileJob(jobId: string): Promise<ProcessResult> {
  const admin = requireAdmin();
  const job = await jobsRepo.getJob(admin, jobId);
  if (!job) throw new Error(`Job not found: ${jobId}`);

  if (job.status === 'COMPLETED' || job.status === 'CANCELLED') {
    return { status: job.status, skipped: true };
  }

  // SUBMITTED means the process crashed between calling the provider and writing SYNCING.
  // Fail it so the explicit retry path re-executes from PENDING.
  if (job.status === 'SUBMITTED') {
    log.warn({ jobId }, 'Job stuck in SUBMITTED — marking failed for explicit retry');
    const failed = transition(job, 'FAILED', { reason: 'stuck_in_submitted' });
    await jobsRepo.updateJob(admin, jobId, {
      status: 'failed',
      status_transitions: failed.status_transitions,
      updated_at: failed.updated_at,
      error: 'Job stuck in SUBMITTED — crashed before SYNCING was recorded',
    });
    return { status: 'FAILED', error: 'stuck_in_submitted' };
  }

  if (job.status !== 'SYNCING') {
    return { status: job.status, skipped: true };
  }

  if (!job.provider_job_id) {
    log.error({ jobId }, 'SYNCING job has no provider_job_id — failing');
    const failed = transition(job, 'FAILED', { reason: 'no_provider_job_id' });
    await jobsRepo.updateJob(admin, jobId, {
      status: 'failed',
      status_transitions: failed.status_transitions,
      updated_at: failed.updated_at,
      error: 'No provider_job_id in SYNCING state',
    });
    return { status: 'FAILED', error: 'no_provider_job_id' };
  }

  const provider = getTelecomProvider();
  const ctx = {
    correlationId: crypto.randomUUID(),
    provisioningJobId: job.id,
    telecomLineId: job.line_id ?? undefined,
  };

  let providerResult;
  try {
    providerResult = await withProviderContext(ctx, () =>
      provider.getJobStatus(job.provider_job_id!),
    );
  } catch (err) {
    log.error({ jobId, error: err instanceof Error ? err.message : String(err) }, 'Provider poll failed');
    throw err; // Infrastructure failure — let Inngest retry
  }

  if (providerResult.status === 'done') {
    // providerResult.lineId is the provider's line_id, now available on completion
    return completeJob(admin, job, job.line_id!, providerResult.lineId ?? null);
  }

  if (providerResult.status === 'failed') {
    const errMsg = providerResult.error ?? 'Provider reported job failure';
    const failed = transition(job, 'FAILED', { error: errMsg });
    await jobsRepo.updateJob(admin, jobId, {
      status: 'failed',
      status_transitions: failed.status_transitions,
      updated_at: failed.updated_at,
      error: errMsg,
    });
    if (job.line_id) {
      await applyLineTransition(admin, job.line_id, 'FAILED', { jobId, error: errMsg });
    }
    return { status: 'FAILED', error: errMsg };
  }

  log.info({ jobId, providerStatus: providerResult.status }, 'Provider job still in progress');
  return { status: 'SYNCING' };
}

// ----------------------------------------------------------------
// Retry (explicit operator-initiated path)
// Caller is responsible for re-enqueueing via Inngest after this returns.
// ----------------------------------------------------------------

export async function retryProvisioningJob(jobId: string): Promise<ProvisioningJob> {
  const admin = requireAdmin();
  const job = await jobsRepo.getJob(admin, jobId);
  if (!job) throw new Error(`Job not found: ${jobId}`);
  if (job.status !== 'FAILED') {
    throw new Error(`Cannot retry job ${jobId} — must be FAILED, got ${job.status}`);
  }
  if (job.attempt_count >= job.max_attempts) {
    throw new Error(`Job ${jobId} exhausted max attempts (${job.max_attempts})`);
  }

  // Exponential backoff: 30s, 60s, 120s ... capped at 1 hour
  const backoffSeconds = Math.min(30 * Math.pow(2, job.attempt_count - 1), 3600);
  const nextRetryAt = new Date(Date.now() + backoffSeconds * 1000).toISOString();

  const retried = transition(job, 'PENDING', { retryAttempt: job.attempt_count + 1 });
  if (job.line_id) {
    await applyLineTransition(admin, job.line_id, 'DRAFT', { jobId, retryAttempt: job.attempt_count + 1 });
  }
  await jobsRepo.updateJob(admin, jobId, {
    status: 'pending',
    status_transitions: retried.status_transitions,
    updated_at: retried.updated_at,
    next_retry_at: nextRetryAt,
    error: null,
  });

  log.info({ jobId, attempt: job.attempt_count + 1, backoffSeconds, nextRetryAt }, 'Job reset for retry');
  return { ...retried, next_retry_at: nextRetryAt, error: null };
}

// ----------------------------------------------------------------
// Reconcile stale jobs (batch — called by cron)
// ----------------------------------------------------------------

export async function reconcileStaleJobs(olderThanMinutes = 5): Promise<{
  checked: number;
  completed: number;
  failed: number;
}> {
  const admin = requireAdmin();
  const staleJobs = await jobsRepo.getStaleJobs(admin, olderThanMinutes);

  let completed = 0;
  let failed = 0;

  for (const job of staleJobs) {
    try {
      const result = await reconcileJob(job.id);
      if (result.status === 'COMPLETED') completed++;
      else if (result.status === 'FAILED') failed++;
    } catch (err) {
      log.error({ jobId: job.id, error: err instanceof Error ? err.message : String(err) }, 'Reconcile errored');
      failed++;
    }
  }

  log.info({ checked: staleJobs.length, completed, failed }, 'Stale job reconciliation complete');
  return { checked: staleJobs.length, completed, failed };
}

// ----------------------------------------------------------------
// Internal: apply a line status transition
// Only swallows InvalidLineTransitionError (already in target state or idempotent retry).
// All other errors (DB failures, network) propagate to the caller.
// ----------------------------------------------------------------

async function applyLineTransition(
  admin: Admin,
  lineId: string,
  to: LineStateMachineStatus,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const line = await linesRepo.getLine(admin, lineId);
  if (!line) {
    log.warn({ lineId, to }, 'Line not found during transition — skipping');
    return;
  }

  const sm: LineStateMachineRecord = {
    id: line.id,
    status: line.status.toUpperCase() as LineStateMachineStatus,
    status_transitions: line.status_transitions,
    updated_at: line.updated_at,
  };

  try {
    const next = transitionLine(sm, to, { metadata });
    await linesRepo.updateLine(admin, lineId, {
      status: next.status.toLowerCase(),
      status_transitions: next.status_transitions as never,
      updated_at: next.updated_at,
    });
  } catch (err) {
    if (err instanceof InvalidLineTransitionError) {
      log.warn({ lineId, from: sm.status, to }, 'Line transition skipped — already in target or invalid path');
      return;
    }
    throw err; // DB errors, network failures must propagate
  }
}
