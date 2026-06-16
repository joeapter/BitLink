import crypto from 'crypto';
import type { TelecomProvider } from '@/lib/telecom/provider.interface';
import type {
  LineCreateParams,
  LineResult,
  LineStatus,
  SuspensionReason,
  BalanceBucket,
  UsageSummary,
  OtaParams,
  OtaStatus,
  PortabilityCheck,
  PortInParams,
  PortInResult,
  PortInStatus,
  PhoneNumber,
  ProviderJobResult,
  TelecomEvent,
} from '@/types/telecom';
import { AnnatelApiClient } from './client';
import { AnnatelMappers } from './mappers';
import type { AnnatelBulkRequest, AnnatelOcsBalance } from './mappers';

export class AnnatelProvider implements TelecomProvider {
  readonly providerId = 'annatel';

  constructor(
    private readonly client: AnnatelApiClient,
    private readonly webhookSecret: string,
  ) {}

  // ── Line lifecycle ────────────────────────────────────────────────────────

  async createLine(params: LineCreateParams): Promise<LineResult> {
    const body = AnnatelMappers.toCreateBulkRequest(params);
    const response = await this.client.post<AnnatelBulkRequest>('/bulk_requests', body);
    return AnnatelMappers.toLineResult(response);
  }

  async getLineStatus(_providerLineId: string): Promise<LineStatus> {
    // TODO: map Annatel line.status to LineStatus once endpoint is confirmed
    return 'active';
  }

  async suspendLine(providerLineId: string, reason: SuspensionReason): Promise<void> {
    const suspensionId = AnnatelMappers.toSuspensionType(reason);
    await this.client.post(`/lines/${providerLineId}/suspensions`, {
      suspension_id: suspensionId,
    });
  }

  async reactivateLine(providerLineId: string): Promise<void> {
    const suspensions = await this.client.get<{
      data: Array<{ id: string }>;
    }>(`/lines/${providerLineId}/suspensions`);
    const active = suspensions.data?.[0];
    if (active) {
      await this.client.delete(`/lines/${providerLineId}/suspensions/${active.id}`);
    }
  }

  async terminateLine(providerLineId: string): Promise<void> {
    await this.client.post('/bulk_requests', {
      type: 'remove',
      line_id: providerLineId,
    });
  }

  // ── SIM management ────────────────────────────────────────────────────────

  async assignSim(providerLineId: string, iccId: string): Promise<void> {
    await this.client.post('/bulk_requests', {
      type: 'add',
      line_id: providerLineId,
      sims: [{ icc_id: iccId }],
    });
  }

  async replaceSim(providerLineId: string, newIccId: string): Promise<void> {
    await this.client.post('/bulk_requests', {
      type: 'add',
      line_id: providerLineId,
      sims: [{ icc_id: newIccId }],
    });
  }

  async triggerOta(
    providerLineId: string,
    iccId: string,
    params: OtaParams,
  ): Promise<string> {
    const result = await this.client.post<{ id: string }>(
      `/lines/${providerLineId}/sim/ota_requests`,
      {
        icc_id: iccId,
        params: {
          ehplmn: params.ehplmn,
          spn: params.spn,
          refresh_type: params.refreshType ?? 'noop',
        },
      },
    );
    return result.id;
  }

  async getOtaStatus(providerLineId: string, otaRequestId: string): Promise<OtaStatus> {
    const result = await this.client.get<{
      id: string;
      icc_id: string;
      responded_at?: string;
    }>(`/lines/${providerLineId}/sim/ota_requests/${otaRequestId}`);
    return {
      id: result.id,
      iccId: result.icc_id,
      status: result.responded_at ? 'completed' : 'pending',
      respondedAt: result.responded_at ? new Date(result.responded_at) : undefined,
    };
  }

  // ── Plan management ───────────────────────────────────────────────────────

  async assignPlan(providerLineId: string, planName: string): Promise<void> {
    await this.client.post('/bulk_requests', {
      type: 'add',
      line_id: providerLineId,
      plan: { plan_name: planName },
    });
  }

  async removePlan(providerLineId: string, planName: string): Promise<void> {
    await this.client.post('/bulk_requests', {
      type: 'remove',
      line_id: providerLineId,
      plan: { plan_name: planName },
    });
  }

  async addTopup(providerLineId: string, topupName: string): Promise<void> {
    await this.client.post('/bulk_requests', {
      type: 'add',
      line_id: providerLineId,
      topups: [{ topup_name: topupName }],
    });
  }

  // ── Usage & balance ───────────────────────────────────────────────────────

  async getBalances(providerLineId: string): Promise<BalanceBucket[]> {
    const result = await this.client.get<AnnatelOcsBalance[]>(
      `/lines/${providerLineId}/ocs_balances`,
    );
    return AnnatelMappers.toBalanceBuckets(Array.isArray(result) ? result : []);
  }

  async getUsageSummary(providerLineId: string): Promise<UsageSummary> {
    const balances = await this.getBalances(providerLineId);
    const find = (cats: string[]) =>
      balances.find((b) => cats.some((c) => b.type.includes(c) || b.categories.includes(c)));
    const data = find(['data']);
    const voice = find(['voice']);
    const sms = find(['sms']);
    return {
      dataBytes: data ? data.initialValue - data.value : 0,
      voiceSeconds: voice ? voice.initialValue - voice.value : 0,
      smsCount: sms ? sms.initialValue - sms.value : 0,
      recordedAt: new Date(),
    };
  }

  // ── Portability ───────────────────────────────────────────────────────────

  async checkPortability(phoneNumber: string): Promise<PortabilityCheck> {
    const result = await this.client.get<{ number: string; operator: string }>(
      `/numbers/${encodeURIComponent(phoneNumber)}/operator`,
    );
    return { number: result.number, operator: result.operator, isPortable: true };
  }

  async initiatePortIn(params: PortInParams): Promise<PortInResult> {
    const result = await this.client.post<{ id: string; status: string }>('/bulk_requests', {
      type: 'create',
      external_id: params.idempotencyKey,
      port_in_request_params: {
        number: params.number,
        identity_number: params.identityNumber,
        authentication_type: params.authenticationType,
      },
    });
    return { portInRequestId: result.id, status: result.status };
  }

  async getPortInStatus(providerJobId: string): Promise<PortInStatus> {
    const result = await this.client.get<{
      id: string;
      status: string;
      operational_port_in_request?: {
        status: string;
        external_port_in_request?: { transfer_time?: string };
      };
    }>(`/bulk_requests/${providerJobId}`);
    const portIn = result.operational_port_in_request;
    return {
      id: result.id,
      status: portIn?.status ?? result.status,
      transferTime: portIn?.external_port_in_request?.transfer_time
        ? new Date(portIn.external_port_in_request.transfer_time)
        : undefined,
    };
  }

  async cancelPortIn(providerJobId: string): Promise<void> {
    await this.client.post(`/bulk_requests/${providerJobId}/cancel`, {});
  }

  // ── Number (DID) management ───────────────────────────────────────────────

  async getAssignedNumbers(providerLineId: string): Promise<PhoneNumber[]> {
    const result = await this.client.get<{
      data: Array<{ number: string; start_at: string; end_at?: string }>;
    }>(`/lines/${providerLineId}/dids`);
    return (result.data ?? []).map((did) => ({
      number: did.number,
      isPrimary: true,
      startAt: new Date(did.start_at),
      endAt: did.end_at ? new Date(did.end_at) : undefined,
    }));
  }

  async assignDid(providerLineId: string, number: string): Promise<void> {
    await this.client.post('/bulk_requests', {
      type: 'add',
      line_id: providerLineId,
      dids: [{ number }],
    });
  }

  async releaseDid(providerLineId: string, number: string): Promise<void> {
    await this.client.post('/bulk_requests', {
      type: 'remove',
      line_id: providerLineId,
      dids: [{ number }],
    });
  }

  // ── Async job polling ─────────────────────────────────────────────────────

  async getJobStatus(providerJobId: string): Promise<ProviderJobResult> {
    const result = await this.client.get<{
      id: string;
      status: string;
      line_id?: string;
    }>(`/bulk_requests/${providerJobId}`);
    return {
      jobId: result.id,
      status: AnnatelMappers.toProviderJobStatus(result.status as never),
      lineId: result.line_id,
      rawResponse: result,
    };
  }

  // ── Webhook ───────────────────────────────────────────────────────────────

  verifyWebhookSignature(payload: Buffer, signature: string): boolean {
    // Annatel does not sign webhooks — no secret means unverified but accepted.
    if (!this.webhookSecret) return true;
    const clean = signature.replace(/^sha256=/, '');
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(clean, 'hex'), Buffer.from(expected, 'hex'));
    } catch {
      return false;
    }
  }

  parseWebhookEvent(payload: Buffer): TelecomEvent {
    const data = JSON.parse(payload.toString('utf8')) as Record<string, unknown>;
    return {
      type: (data.type ?? data.event ?? 'unknown') as string,
      providerId: 'annatel',
      eventId: data.id as string | undefined,
      occurredAt: data.created_at ? new Date(data.created_at as string) : new Date(),
      payload: data,
    };
  }
}
