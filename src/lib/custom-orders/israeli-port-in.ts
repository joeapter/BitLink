// Ports an Israeli number onto an ALREADY ACTIVE line. The mechanism itself
// is proven — two real numbers have completed this exact SMS-verify +
// matched-dids create (Jul 7, 2026: a genuine cross-carrier port from Golan,
// and an inter-tenant Annatel port) — but Annatel's API only ever lands a
// ported number as part of CREATING A NEW LINE, never by attaching to one
// that already exists. So this drives a "landing" line through the same
// proven createLine path, waits for the port to actually complete, then
// relocates the DID onto the customer's real line (release + assign — the
// same pattern already used to move Daniil's Canadian number) and discards
// the landing line.
//
// Deliberately does NOT use provider.initiatePortIn() — that method only
// sends port_in_request_params with none of the other required create
// fields (dids, sims, plan), so it doesn't match the shape either real port
// actually used, and has zero successful calls in provider_sync_logs.
import type { SupabaseClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe/server';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';
import { getAnnatelPlanName } from '@/lib/plans';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'israeli-port-in' });

// Joe's stated price for a ported-in secondary Israeli number — a different
// product from the US/Canada/UK add-on, so it gets its own rate rather than
// reusing usCanadaNumberAddOn.
const MONTHLY_FEE_CENTS = 1000;
const DEFAULT_IDENTITY_NUMBER = process.env.ANNATEL_DEFAULT_IDENTITY_NUMBER?.trim() || '341280188';

export type IsraeliPortInRequest = {
  id: string;
  lineId: string;
  number: string;
  mode: 'replace' | 'secondary';
  billingMode: 'paid' | 'free';
  status: 'pending_auth' | 'verifying' | 'ready_to_port' | 'porting' | 'ready_to_complete' | 'completed' | 'failed' | 'cancelled';
  providerBulkRequestId: string | null;
  providerLandingLineId: string | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
};

function toRequest(row: Record<string, unknown>): IsraeliPortInRequest {
  return {
    id: row.id as string,
    lineId: row.line_id as string,
    number: row.number as string,
    mode: row.mode as 'replace' | 'secondary',
    billingMode: row.billing_mode as 'paid' | 'free',
    status: row.status as IsraeliPortInRequest['status'],
    providerBulkRequestId: (row.provider_bulk_request_id as string | null) ?? null,
    providerLandingLineId: (row.provider_landing_line_id as string | null) ?? null,
    error: (row.error as string | null) ?? null,
    createdAt: row.created_at as string,
    completedAt: (row.completed_at as string | null) ?? null,
  };
}

async function getRequest(admin: SupabaseClient, requestId: string) {
  const { data } = await admin.from('israeli_port_in_requests').select('*').eq('id', requestId).maybeSingle();
  return data ? toRequest(data) : null;
}

async function setRequest(admin: SupabaseClient, requestId: string, patch: Record<string, unknown>) {
  await admin
    .from('israeli_port_in_requests')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', requestId);
}

export async function listIsraeliPortInRequests(admin: SupabaseClient, lineId: string): Promise<IsraeliPortInRequest[]> {
  const { data } = await admin
    .from('israeli_port_in_requests')
    .select('*')
    .eq('line_id', lineId)
    .order('created_at', { ascending: false });
  return (data ?? []).map(toRequest);
}

export async function createIsraeliPortInRequest(params: {
  admin: SupabaseClient;
  lineId: string;
  number: string;
  mode: 'replace' | 'secondary';
  billingMode: 'paid' | 'free';
  actorUserId?: string | null;
}): Promise<{ success?: string; error?: string; requestId?: string }> {
  const { admin, lineId, number, mode, billingMode, actorUserId } = params;
  const { data, error } = await admin
    .from('israeli_port_in_requests')
    .insert({ line_id: lineId, number, mode, billing_mode: billingMode, created_by: actorUserId ?? null })
    .select('id')
    .single();
  if (error) return { error: error.message };
  return { success: 'Request created — send the verification code next.', requestId: data.id as string };
}

// Step 1: trigger the SMS ownership-verification challenge on the number.
export async function sendPortInAuthCode(admin: SupabaseClient, requestId: string): Promise<{ success?: string; error?: string }> {
  const request = await getRequest(admin, requestId);
  if (!request) return { error: 'Request not found.' };

  const provider = getTelecomProvider();
  try {
    await provider.createNumberAuthentication(request.number);
  } catch (err) {
    return { error: err instanceof Error ? `Could not send code: ${err.message}` : 'Could not send code.' };
  }
  await setRequest(admin, requestId, { status: 'verifying' });
  return { success: `Verification code sent to ${request.number}.` };
}

// Step 2: the current line-holder reads back the SMS code they received.
export async function verifyPortInAuthCode(
  admin: SupabaseClient,
  requestId: string,
  code: string,
): Promise<{ success?: string; error?: string }> {
  const request = await getRequest(admin, requestId);
  if (!request) return { error: 'Request not found.' };

  const provider = getTelecomProvider();
  const verified = await provider.verifyNumberAuthentication(request.number, code);
  if (!verified) return { error: 'Code did not verify — check it and try again.' };

  await setRequest(admin, requestId, { status: 'ready_to_port' });
  return { success: 'Ownership verified. Ready to start the port.' };
}

// Collects ICCIDs already claimed by lines or in-flight jobs, same guard
// used by the real provisioning orchestrator, so the landing line doesn't
// grab a SIM another order is mid-way through claiming.
async function collectUsedIccIds(admin: SupabaseClient): Promise<string[]> {
  const [{ data: jobs }, { data: lines }] = await Promise.all([
    admin.from('provisioning_jobs').select('payload').not('payload->>iccId', 'is', null).in('status', ['pending', 'submitted', 'syncing', 'completed']),
    admin.from('telecom_lines').select('metadata').not('metadata->>esim_icc_id', 'is', null),
  ]);
  const fromJobs = (jobs ?? []).map((j: { payload: unknown }) => (j.payload as Record<string, unknown>)?.iccId as string | undefined);
  const fromLines = (lines ?? []).map((l: { metadata: unknown }) => (l.metadata as Record<string, unknown>)?.esim_icc_id as string | undefined);
  return [...fromJobs, ...fromLines].filter((x): x is string => Boolean(x));
}

// Step 3: create the temporary "landing" line through the SAME createLine
// path that both real ports used — the only Annatel mechanism that actually
// lands a ported number.
export async function startIsraeliPortIn(admin: SupabaseClient, requestId: string): Promise<{ success?: string; error?: string }> {
  const request = await getRequest(admin, requestId);
  if (!request) return { error: 'Request not found.' };
  if (request.status !== 'ready_to_port') return { error: 'Verify the number first.' };

  const provider = getTelecomProvider();
  const iccId = await provider.getAvailableEsimIccId(await collectUsedIccIds(admin));
  if (!iccId) return { error: 'No available eSIM to use for the landing line.' };

  try {
    const result = await provider.createLine({
      externalId: `admin_israeli_port_${requestId}`,
      planName: getAnnatelPlanName('basic'),
      iccId,
      email: 'port-in@bitlink.co.il',
      language: 'he_IL',
      isKosher: false,
      identityNumber: DEFAULT_IDENTITY_NUMBER,
      portInParams: {
        number: request.number,
        identityNumber: DEFAULT_IDENTITY_NUMBER,
        authenticationType: 'sms_code',
      },
    });
    await setRequest(admin, requestId, { status: 'porting', provider_bulk_request_id: result.providerJobId });
    return { success: 'Port started. Refresh status in a few minutes — Israeli ports typically land in 5-10 minutes.' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await setRequest(admin, requestId, { status: 'failed', error: msg });
    return { error: `Port failed to start: ${msg}` };
  }
}

// Step 4: poll until Annatel resolves the landing line's real id.
export async function refreshIsraeliPortInStatus(admin: SupabaseClient, requestId: string): Promise<{ success?: string; error?: string }> {
  const request = await getRequest(admin, requestId);
  if (!request) return { error: 'Request not found.' };
  if (!request.providerBulkRequestId) return { error: 'No port in progress.' };

  const provider = getTelecomProvider();
  const job = await provider.getJobStatus(request.providerBulkRequestId);
  if (job.status === 'failed') {
    await setRequest(admin, requestId, { status: 'failed', error: job.error ?? 'Port failed at the carrier.' });
    return { error: job.error ?? 'Port failed at the carrier.' };
  }
  if (job.lineId) {
    await setRequest(admin, requestId, { status: 'ready_to_complete', provider_landing_line_id: job.lineId });
    return { success: 'The number has landed — ready to move it onto the real line.' };
  }
  return { success: `Still in progress (status: ${job.status}). Check again shortly.` };
}

// Step 5: the consequential one — move the DID off the landing line and
// onto the customer's real line, bill, and clean up.
export async function completeIsraeliPortIn(admin: SupabaseClient, requestId: string): Promise<{ success?: string; error?: string }> {
  const request = await getRequest(admin, requestId);
  if (!request) return { error: 'Request not found.' };
  if (request.status !== 'ready_to_complete' || !request.providerLandingLineId) {
    return { error: 'Not ready to complete yet.' };
  }

  const { data: line } = await admin
    .from('telecom_lines')
    .select('id, provider_line_id, metadata')
    .eq('id', request.lineId)
    .maybeSingle();
  if (!line?.provider_line_id) return { error: 'Target line not found or not active.' };

  const provider = getTelecomProvider();
  const meta = (line.metadata ?? {}) as Record<string, unknown>;

  try {
    // Detach from the landing line first — attaching to the real line before
    // detaching would just fail (the number can't be on two lines).
    await provider.releaseDid(request.providerLandingLineId, request.number);

    let releasedOldPrimary: string | null = null;
    if (request.mode === 'replace') {
      const currentPrimary = meta.phone_number as string | undefined;
      if (currentPrimary) {
        await provider.releaseDid(line.provider_line_id as string, currentPrimary);
        releasedOldPrimary = currentPrimary;
      }
    }

    await provider.assignDid(line.provider_line_id as string, request.number);

    // Landing line's only job was to be a vehicle for the port — discard it.
    // Non-fatal if this fails; the relocation itself already succeeded.
    try {
      await provider.terminateLine(request.providerLandingLineId);
    } catch (err) {
      log.warn({ requestId, landingLineId: request.providerLandingLineId, error: err instanceof Error ? err.message : String(err) }, 'Landing line cleanup failed (non-fatal)');
    }

    const now = new Date().toISOString();
    let billingNote: string | null = null;
    if (request.billingMode === 'paid') {
      const { data: subscriber } = await admin
        .from('subscribers')
        .select('id, stripe_subscription_id, stripe_subscription_item_id, monthly_price_cents')
        .eq('telecom_line_id', request.lineId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const stripe = subscriber?.stripe_subscription_id ? getStripe() : null;
      if (!subscriber?.stripe_subscription_id || !stripe) {
        billingNote = 'No Stripe subscription linked — add the $10/mo charge manually if needed.';
      } else {
        try {
          const subscription = await stripe.subscriptions.retrieve(subscriber.stripe_subscription_id);
          const item = subscriber.stripe_subscription_item_id
            ? subscription.items.data.find((i) => i.id === subscriber.stripe_subscription_item_id)
            : subscription.items.data[0];
          if (!item) throw new Error('Could not find the Stripe subscription item for this line.');
          const productId = typeof item.price.product === 'string' ? item.price.product : item.price.product.id;
          const currentTotal = Number(subscriber.monthly_price_cents ?? item.price.unit_amount ?? 0);
          const newTotal = currentTotal + MONTHLY_FEE_CENTS;
          await stripe.subscriptionItems.update(item.id, {
            price_data: { currency: 'usd', unit_amount: newTotal, recurring: { interval: 'month' }, product: productId },
            proration_behavior: 'create_prorations',
            metadata: { ...item.metadata, bitlink_israeli_port: '1', bitlink_israeli_port_number: request.number },
          });
          await admin.from('subscribers').update({ monthly_price_cents: newTotal, updated_at: now }).eq('id', subscriber.id);
        } catch (err) {
          billingNote = 'Number moved, but the $10/mo could not be billed automatically.';
          log.error({ requestId, error: err instanceof Error ? err.message : String(err) }, 'Israeli port-in billing fold failed');
        }
      }
    }

    await admin
      .from('telecom_lines')
      .update({
        metadata: {
          ...meta,
          ...(request.mode === 'replace'
            ? { phone_number: request.number, previous_phone_number: releasedOldPrimary }
            : {
                israeli_secondary_numbers: [
                  ...(Array.isArray(meta.israeli_secondary_numbers) ? (meta.israeli_secondary_numbers as unknown[]) : []),
                  { number: request.number, assigned_at: now, billing_mode: request.billingMode },
                ],
              }),
        },
        updated_at: now,
      })
      .eq('id', request.lineId);

    await setRequest(admin, requestId, { status: 'completed', completed_at: now });
    return { success: `${request.number} is now on this line.${billingNote ? ` ${billingNote}` : ''}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await setRequest(admin, requestId, { error: msg });
    return { error: `Could not complete the move: ${msg}. The number may be stranded on the landing line — check manually before retrying.` };
  }
}

export async function cancelIsraeliPortIn(admin: SupabaseClient, requestId: string): Promise<{ success?: string; error?: string }> {
  await setRequest(admin, requestId, { status: 'cancelled' });
  return { success: true as unknown as string };
}
