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
  NumberAuthenticationStatus,
  PortInParams,
  PortInResult,
  PortInStatus,
  PhoneNumber,
  TenantDid,
  TenantDidPage,
  ProviderJobResult,
  TelecomEvent,
  LineDetail,
  LineSimInfo,
  LinePlanInfo,
  LineSuspension,
  LineBarring,
  LineForward,
  EsimProfile,
  PlanCatalogEntry,
  PortabilityAvailability,
  WebhookEndpoint,
  AnnatelEvent,
} from '@/types/telecom';
import { AnnatelApiClient } from './client';
import { AnnatelMappers } from './mappers';
import type { AnnatelBulkRequest, AnnatelOcsBalance } from './mappers';

// ── Annatel-specific raw response shapes ─────────────────────────────────────

interface AnnatelLineSim {
  id: string;
  icc_id: string;
  is_main: boolean;
  sim?: {
    id: string;
    type: 'esim' | 'sim_card';
    activation_code?: string;
    activation_code_token?: string;
    sm_dp_plus_address?: string;
    confirmation_code?: string;
  };
}

interface AnnatelLinePlan {
  id: string;
  start_at: string;
  end_at?: string;
  plan: { id: string; name: string; is_main: boolean };
  balances: Array<{ balance_type: string; balance_uuid: string }>;
}

interface AnnatelLineDetail {
  id: string;
  status: string;
  email?: string;
  language?: string;
  is_kosher?: boolean;
  is_volte_enabled?: boolean;
  is_abroad_roaming_enabled?: boolean;
  sims?: AnnatelLineSim[];
  plans?: AnnatelLinePlan[];
  dids?: Array<{ id: string; number: string; start_at: string; end_at?: string }>;
  suspensions?: Array<{ id: string; type: string; created_at: string }>;
  line_barrings?: Array<{ id: string; type: string; created_at: string }>;
  forwards?: Array<{ id: string; destination: string; created_at: string }>;
  balances?: AnnatelOcsBalance[];
}

interface AnnatelSim {
  id: string;
  icc_id: string;
  type: 'esim' | 'sim_card';
  activation_code?: string;
  activation_code_token?: string;
  sm_dp_plus_address?: string;
  confirmation_code?: string;
}

interface AnnatelWebhookEndpoint {
  id: string;
  url: string;
  is_enabled: boolean;
  enabled_notification_patterns: string[];
  created_at: string;
}

interface AnnatelEventRaw {
  id: string;
  type: string;
  ref: string;
  resource_id: string;
  resource_object: string;
  data: Record<string, unknown>;
  created_at: string;
  tenant_id: string;
}

interface AnnatelDid {
  number: string;
  created_at: string;
  is_open_to_port_out: boolean;
  is_technical: boolean;
  ported_from_operator?: string;
  ported_to_operator?: string;
  returned_by_operator?: string;
}

interface AnnatelDidListResponse {
  data: AnnatelDid[];
  meta: { page_number: number; page_size: number; total: number };
}

const LINES_BASE = '/api/operational/network_manager/lines';

export class AnnatelProvider implements TelecomProvider {
  readonly providerId = 'annatel';

  constructor(
    private readonly client: AnnatelApiClient,
    private readonly webhookSecret: string,
  ) {}

  // ── Line lifecycle ────────────────────────────────────────────────────────

  async createLine(params: LineCreateParams): Promise<LineResult> {
    const body = AnnatelMappers.toCreateBulkRequest(params);
    const response = await this.client.post<AnnatelBulkRequest>('/api/bulk_requests', body);
    return AnnatelMappers.toLineResult(response);
  }

  async getLineStatus(providerLineId: string): Promise<LineStatus> {
    const detail = await this.getLineDetail(providerLineId);
    const raw = detail.status.toLowerCase();
    const map: Record<string, LineStatus> = {
      active: 'active',
      suspended: 'suspended',
      terminated: 'terminated',
      draft: 'draft',
      provisioning: 'provisioning',
      porting: 'porting',
      failed: 'failed',
    };
    return map[raw] ?? 'active';
  }

  async getLineDetail(providerLineId: string): Promise<LineDetail> {
    const [raw, simsResult, plansResult, didsResult, planCatalog] = await Promise.all([
      this.client.get<AnnatelLineDetail>(`${LINES_BASE}/${providerLineId}`),
      this.client.get<{ data: Array<{ id: string; icc_id: string; is_main: boolean; start_at: string; end_at?: string; sim?: { type: 'esim' | 'sim_card'; activation_code?: string; activation_code_token?: string; sm_dp_plus_address?: string; confirmation_code?: string } }> }>(`${LINES_BASE}/${providerLineId}/sims`).catch(() => ({ data: [] })),
      this.client.get<{ data: Array<{ id: string; start_at: string; end_at?: string; plan_id: string; plan?: { id: string; name: string; is_main: boolean } }> }>(`${LINES_BASE}/${providerLineId}/plans`).catch(() => ({ data: [] })),
      this.client.get<{ data: Array<{ id: string; number: string; start_at: string; end_at?: string }> }>(`${LINES_BASE}/${providerLineId}/dids`).catch(() => ({ data: [] })),
      // The line-plans list carries only plan_id — names and is_main live in
      // the tenant plan catalog, so supplementary plans (topups) were
      // rendering as unnamed "Main" plans without this join.
      this.client.get<{ data: Array<{ id: string; name: string; is_main: boolean }> }>('/api/operational/network_manager/plans?page%5Bsize%5D=200').catch(() => ({ data: [] })),
    ]);
    const catalogById = new Map((planCatalog.data ?? []).map((p) => [p.id, p]));
    // The catalog lists ONLY main plans — supplementary (topup) plans are
    // absent from it entirely (and 404 on direct fetch). So with a loaded
    // catalog, absence == topup. If the catalog fetch failed, fall back to
    // treating plans as main (pre-existing behavior).
    const catalogLoaded = catalogById.size > 0;
    return {
      id: raw.id,
      status: raw.status,
      email: raw.email,
      language: raw.language,
      isKosher: raw.is_kosher,
      isVoltEnabled: raw.is_volte_enabled,
      isAbroadRoamingEnabled: raw.is_abroad_roaming_enabled,
      sims: (simsResult.data ?? []).map((s) => ({
        id: s.id,
        iccId: s.icc_id,
        isMain: s.is_main,
        type: s.sim?.type ?? 'sim_card',
        activationCode: s.sim?.activation_code,
        activationCodeToken: s.sim?.activation_code_token,
        smDpPlusAddress: s.sim?.sm_dp_plus_address,
        confirmationCode: s.sim?.confirmation_code,
      })),
      plans: (plansResult.data ?? []).map((p) => ({
        id: p.id,
        planId: p.plan?.id ?? p.plan_id,
        planName: p.plan?.name ?? catalogById.get(p.plan_id)?.name ?? '',
        isMain: p.plan?.is_main ?? catalogById.get(p.plan_id)?.is_main ?? !catalogLoaded,
        startAt: new Date(p.start_at),
        endAt: p.end_at ? new Date(p.end_at) : undefined,
      })),
      dids: (didsResult.data ?? []).map((d) => ({
        number: d.number,
        isPrimary: true,
        startAt: new Date(d.start_at),
        endAt: d.end_at ? new Date(d.end_at) : undefined,
      })),
      suspensions: (raw.suspensions ?? []).map((s) => ({
        id: s.id,
        type: s.type,
        createdAt: new Date(s.created_at),
      })),
      barrings: (raw.line_barrings ?? []).map((b) => ({
        id: b.id,
        type: b.type,
        createdAt: new Date(b.created_at),
      })),
      forwards: (raw.forwards ?? []).map((f) => ({
        id: f.id,
        destination: f.destination,
        createdAt: new Date(f.created_at),
      })),
      balances: AnnatelMappers.toBalanceBuckets(raw.balances ?? []),
    };
  }

  async suspendLine(providerLineId: string, reason: SuspensionReason): Promise<void> {
    const suspensionId = AnnatelMappers.toSuspensionType(reason);
    await this.client.post(`${LINES_BASE}/${providerLineId}/suspensions`, {
      suspension_type: suspensionId,
    });
  }

  async reactivateLine(providerLineId: string): Promise<void> {
    const suspensions = await this.client.get<{
      data: Array<{ id: string }>;
    }>(`${LINES_BASE}/${providerLineId}/suspensions`);
    const active = suspensions.data?.[0];
    if (active) {
      await this.client.delete(`${LINES_BASE}/${providerLineId}/suspensions/${active.id}`);
    }
  }

  async terminateLine(providerLineId: string): Promise<void> {
    await this.client.post('/api/bulk_requests', {
      type: 'remove',
      line_id: providerLineId,
    });
  }

  async refreshLine(providerLineId: string): Promise<void> {
    await this.client.post(`${LINES_BASE}/${providerLineId}/refresh`, {});
  }

  async hardResetLine(providerLineId: string): Promise<void> {
    await this.client.post(`${LINES_BASE}/${providerLineId}/hard_reset`, {});
  }

  async hlrReset(providerLineId: string): Promise<void> {
    await this.client.post(`${LINES_BASE}/${providerLineId}/send_rtr_for_impi`, {});
  }

  // ── SIM management ────────────────────────────────────────────────────────

  async assignSim(providerLineId: string, iccId: string): Promise<void> {
    await this.client.post('/api/bulk_requests', {
      type: 'add',
      line_id: providerLineId,
      sims: [{ icc_id: iccId }],
    });
  }

  async replaceSim(providerLineId: string, newIccId: string): Promise<void> {
    await this.client.post('/api/bulk_requests', {
      type: 'add',
      line_id: providerLineId,
      sims: [{ icc_id: newIccId }],
    });
  }

  async listLineSims(providerLineId: string): Promise<LineSimInfo[]> {
    const result = await this.client.get<{ data: AnnatelLineSim[] }>(
      `${LINES_BASE}/${providerLineId}/sims`,
    );
    return (result.data ?? []).map((s) => ({
      id: s.id,
      iccId: s.icc_id,
      isMain: s.is_main,
      type: s.sim?.type ?? 'sim_card',
      activationCode: s.sim?.activation_code,
      activationCodeToken: s.sim?.activation_code_token,
      smDpPlusAddress: s.sim?.sm_dp_plus_address,
      confirmationCode: s.sim?.confirmation_code,
    }));
  }

  async getEsimProfile(simId: string): Promise<EsimProfile> {
    const result = await this.client.get<AnnatelSim>(
      `/api/operational/sim_manager/sims/${simId}/profile`,
    );
    return {
      iccId: result.icc_id,
      activationCode: result.activation_code ?? '',
      smDpPlusAddress: result.sm_dp_plus_address ?? '',
      activationCodeToken: result.activation_code_token,
      confirmationCode: result.confirmation_code,
    };
  }

  async recycleEsimProfile(simId: string): Promise<void> {
    await this.client.post(`/api/operational/sim_manager/sims/${simId}/recycle_profile`, {});
  }

  async triggerOta(
    providerLineId: string,
    iccId: string,
    params: OtaParams,
  ): Promise<string> {
    const result = await this.client.post<{ id: string }>(
      `${LINES_BASE}/${providerLineId}/sim/ota_requests`,
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
    }>(`${LINES_BASE}/${providerLineId}/sim/ota_requests/${otaRequestId}`);
    return {
      id: result.id,
      iccId: result.icc_id,
      status: result.responded_at ? 'completed' : 'pending',
      respondedAt: result.responded_at ? new Date(result.responded_at) : undefined,
    };
  }

  // ── Plan management ───────────────────────────────────────────────────────

  async assignPlan(providerLineId: string, planName: string): Promise<void> {
    await this.client.post(`${LINES_BASE}/${providerLineId}/plans`, {
      plan_name: planName,
    });
  }

  async removePlan(providerLineId: string, planName: string): Promise<void> {
    await this.client.post('/api/bulk_requests', {
      type: 'remove',
      line_id: providerLineId,
      plan: { plan_name: planName },
    });
  }

  async replacePlan(providerLineId: string, linePlanId: string, newPlanName: string): Promise<void> {
    await this.client.post(`${LINES_BASE}/${providerLineId}/plans/${linePlanId}/replace`, {
      plan_name: newPlanName,
    });
  }

  async listLinePlans(providerLineId: string): Promise<LinePlanInfo[]> {
    const result = await this.client.get<{ data: AnnatelLinePlan[] }>(
      `${LINES_BASE}/${providerLineId}/plans`,
    );
    return (result.data ?? []).map((p) => ({
      id: p.id,
      planId: p.plan.id,
      planName: p.plan.name,
      isMain: p.plan.is_main,
      startAt: new Date(p.start_at),
      endAt: p.end_at ? new Date(p.end_at) : undefined,
    }));
  }

  async getAvailableDid(usedNumbers: string[] = []): Promise<string | null> {
    try {
      const usedSet = new Set(usedNumbers);
      let page = 1;
      while (true) {
        const result = await this.listTenantDids(page, 50);
        const available = result.dids.find((d) => !usedSet.has(d.number) && !d.isTechnical);
        if (available) return available.number;
        if (result.dids.length < 50 || result.meta.total <= page * 50) break;
        page++;
      }
      return null;
    } catch {
      return null;
    }
  }

  async getAvailableEsimIccId(excludeIccIds: string[] = []): Promise<string | null> {
    // The sim_manager listing has no availability filter and keeps consumed
    // SIMs in the list — callers must pass ICCIDs already used by our lines,
    // or every order would pick the same first SIM.
    try {
      const excluded = new Set(excludeIccIds);
      let page = 1;
      while (page <= 20) {
        const qs = new URLSearchParams({
          'filter[type]': 'esim',
          'page[number]': String(page),
          'page[size]': '100',
        });
        const result = await this.client.get<{
          data: Array<{ icc_id: string }>;
          meta?: { total: number };
        }>(`/api/operational/sim_manager/sims?${qs}`);
        const available = (result.data ?? []).find((s) => !excluded.has(s.icc_id));
        if (available) return available.icc_id;
        if ((result.data ?? []).length < 100) break;
        page++;
      }
      return null;
    } catch {
      return null;
    }
  }

  async listPlansCatalog(): Promise<PlanCatalogEntry[]> {
    const result = await this.client.get<{ data: Array<{ id: string; name: string; is_main: boolean }> }>(
      '/api/operational/network_manager/plans',
    );
    return (result.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      isMain: p.is_main,
    }));
  }

  async addTopup(providerLineId: string, topupName: string): Promise<void> {
    // Topups are supplementary plans (is_main: false) added directly to the
    // line. The bulk_requests type-add shape this originally used is
    // Annatel's port-in flow and 422s demanding port_in_request_params —
    // discovered on first real use, Jul 2026.
    await this.client.post(`${LINES_BASE}/${providerLineId}/plans`, {
      plan_name: topupName,
    });
  }

  // ── Usage & balance ───────────────────────────────────────────────────────

  async getBalances(providerLineId: string): Promise<BalanceBucket[]> {
    const result = await this.client.get<AnnatelOcsBalance[]>(
      `${LINES_BASE}/${providerLineId}/ocs_balances`,
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

  // ── Barrings ──────────────────────────────────────────────────────────────

  async listBarrings(providerLineId: string): Promise<LineBarring[]> {
    const result = await this.client.get<{ data: Array<{ id: string; type: string; created_at: string }> }>(
      `${LINES_BASE}/${providerLineId}/line_barrings`,
    );
    return (result.data ?? []).map((b) => ({
      id: b.id,
      type: b.type,
      createdAt: new Date(b.created_at),
    }));
  }

  async addBarring(providerLineId: string, type: string): Promise<LineBarring> {
    const result = await this.client.post<{ id: string; type: string; created_at: string }>(
      `${LINES_BASE}/${providerLineId}/line_barrings`,
      { type },
    );
    return { id: result.id, type: result.type, createdAt: new Date(result.created_at) };
  }

  async removeBarring(providerLineId: string, barringId: string): Promise<void> {
    await this.client.delete(`${LINES_BASE}/${providerLineId}/line_barrings/${barringId}`);
  }

  // ── Call forwarding ───────────────────────────────────────────────────────

  async listForwards(providerLineId: string): Promise<LineForward[]> {
    const result = await this.client.get<{ data: Array<{ id: string; destination: string; created_at: string }> }>(
      `${LINES_BASE}/${providerLineId}/forwards`,
    );
    return (result.data ?? []).map((f) => ({
      id: f.id,
      destination: f.destination,
      createdAt: new Date(f.created_at),
    }));
  }

  async addForward(providerLineId: string, destination: string): Promise<LineForward> {
    const result = await this.client.post<{ id: string; destination: string; created_at: string }>(
      `${LINES_BASE}/${providerLineId}/forwards`,
      { destination },
    );
    return { id: result.id, destination: result.destination, createdAt: new Date(result.created_at) };
  }

  async removeForward(providerLineId: string, forwardId: string): Promise<void> {
    await this.client.delete(`${LINES_BASE}/${providerLineId}/forwards/${forwardId}`);
  }

  // ── Port-in number authentication (SMS ownership proof) ────────────────────
  // Endpoints confirmed live Jul 2026: POST creates the authentication and
  // triggers the SMS; PUT with the code (as a string!) completes it; the list
  // endpoint filters by number. A completed authentication is valid 15 days
  // and is required before a port-in bulk_request is accepted.

  async createNumberAuthentication(phoneNumber: string): Promise<NumberAuthenticationStatus> {
    const result = await this.client.post<{ status: string }>(
      '/api/operational/show_me_white_paw/authentications',
      {
        authentication_context: 'port_in',
        authentication_type: 'sms_code',
        locale: 'en_US',
        number: phoneNumber,
      },
    );
    return (result.status as NumberAuthenticationStatus) ?? 'pending';
  }

  async verifyNumberAuthentication(phoneNumber: string, code: string): Promise<boolean> {
    try {
      await this.client.put(
        `/api/operational/show_me_white_paw/authentications/${encodeURIComponent(phoneNumber)}`,
        {
          authentication_context: 'port_in',
          authentication_type: 'sms_code',
          code: String(code),
        },
      );
      return true;
    } catch {
      return false;
    }
  }

  async getNumberAuthenticationStatus(phoneNumber: string): Promise<NumberAuthenticationStatus> {
    const qs = new URLSearchParams({ 'filter[number]': phoneNumber, 'page[size]': '5' });
    const result = await this.client.get<{ data: Array<{ number: string; status: string }> }>(
      `/api/operational/show_me_white_paw/authentications?${qs}`,
    );
    const match = (result.data ?? []).find((a) => a.number === phoneNumber);
    return (match?.status as NumberAuthenticationStatus) ?? 'none';
  }

  // ── Portability ───────────────────────────────────────────────────────────

  async checkPortability(phoneNumber: string): Promise<PortabilityCheck> {
    const result = await this.client.post<{ number: string; operator: string }>(
      `/api/operational/israeli_portability/numbers/${encodeURIComponent(phoneNumber)}/find_operator`,
      {},
    );
    return { number: result.number, operator: result.operator, isPortable: true };
  }

  async checkPortabilityAvailability(phoneNumber: string): Promise<PortabilityAvailability> {
    const result = await this.client.post<{ number: string; is_available: boolean; operator?: string }>(
      `/api/operational/israeli_portability/numbers/${encodeURIComponent(phoneNumber)}/check_availability`,
      {},
    );
    return {
      number: result.number,
      isAvailable: result.is_available,
      operator: result.operator,
    };
  }

  async initiatePortIn(params: PortInParams): Promise<PortInResult> {
    const result = await this.client.post<{ id: string; status: string }>('/api/bulk_requests', {
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
    }>(`/api/bulk_requests/${providerJobId}`);
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
    await this.client.post(`/api/bulk_requests/${providerJobId}/cancel`, {});
  }

  // ── Number (DID) management ───────────────────────────────────────────────

  async listTenantDids(page = 1, pageSize = 100): Promise<TenantDidPage> {
    const qs = new URLSearchParams({
      'page[number]': String(page),
      'page[size]': String(pageSize),
    });
    const result = await this.client.get<AnnatelDidListResponse>(`/api/dids?${qs}`);
    return {
      dids: (result.data ?? []).map((d): TenantDid => ({
        number: d.number,
        createdAt: new Date(d.created_at),
        isOpenToPortOut: d.is_open_to_port_out,
        isTechnical: d.is_technical,
        portedFromOperator: d.ported_from_operator,
        portedToOperator: d.ported_to_operator,
        returnedByOperator: d.returned_by_operator,
      })),
      meta: {
        pageNumber: result.meta.page_number,
        pageSize: result.meta.page_size,
        total: result.meta.total,
      },
    };
  }

  async getAssignedNumbers(providerLineId: string): Promise<PhoneNumber[]> {
    const result = await this.client.get<{
      data: Array<{ number: string; start_at: string; end_at?: string }>;
    }>(`${LINES_BASE}/${providerLineId}/dids`);
    return (result.data ?? []).map((did) => ({
      number: did.number,
      isPrimary: true,
      startAt: new Date(did.start_at),
      endAt: did.end_at ? new Date(did.end_at) : undefined,
    }));
  }

  async assignDid(providerLineId: string, number: string): Promise<void> {
    await this.client.post(`${LINES_BASE}/${providerLineId}/dids`, { number });
  }

  async releaseDid(providerLineId: string, number: string): Promise<void> {
    const didsResult = await this.client.get<{ data: Array<{ id: string; number: string }> }>(
      `${LINES_BASE}/${providerLineId}/dids`,
    );
    const did = (didsResult.data ?? []).find((d) => d.number === number);
    if (did) {
      await this.client.delete(`${LINES_BASE}/${providerLineId}/dids/${did.id}`);
    }
  }

  // ── Webhook endpoints ─────────────────────────────────────────────────────

  async listWebhookEndpoints(): Promise<WebhookEndpoint[]> {
    const result = await this.client.get<{ data: AnnatelWebhookEndpoint[] }>('/api/webhook_endpoints');
    return (result.data ?? []).map((w) => ({
      id: w.id,
      url: w.url,
      isEnabled: w.is_enabled,
      enabledNotificationPatterns: w.enabled_notification_patterns ?? [],
      createdAt: new Date(w.created_at),
    }));
  }

  async createWebhookEndpoint(
    url: string,
    patterns: string[],
    _secret?: string,
  ): Promise<WebhookEndpoint> {
    const result = await this.client.post<AnnatelWebhookEndpoint>('/api/webhook_endpoints', {
      url,
      is_enabled: true,
      enabled_notification_patterns: patterns,
    });
    return {
      id: result.id,
      url: result.url,
      isEnabled: result.is_enabled,
      enabledNotificationPatterns: result.enabled_notification_patterns ?? [],
      createdAt: new Date(result.created_at),
    };
  }

  async deleteWebhookEndpoint(id: string): Promise<void> {
    await this.client.delete(`/api/webhook_endpoints/${id}`);
  }

  // ── Events audit log ──────────────────────────────────────────────────────

  async listEvents(filters?: { resourceId?: string; type?: string; limit?: number }): Promise<AnnatelEvent[]> {
    const params = new URLSearchParams();
    if (filters?.resourceId) params.set('filter[resource_id]', filters.resourceId);
    if (filters?.type) params.set('filter[type]', filters.type);
    const qs = params.toString();
    const result = await this.client.get<{ data: AnnatelEventRaw[] }>(
      `/api/events${qs ? `?${qs}` : ''}`,
    );
    const rows = result?.data ?? [];
    const limited = filters?.limit ? rows.slice(0, filters.limit) : rows;
    return limited.map((e) => ({
      id: e.id,
      type: e.type,
      ref: e.ref,
      resourceId: e.resource_id,
      resourceObject: e.resource_object,
      data: e.data,
      occurredAt: new Date(e.created_at),
      tenantId: e.tenant_id,
    }));
  }

  // ── Async job polling ─────────────────────────────────────────────────────

  async getJobStatus(providerJobId: string): Promise<ProviderJobResult> {
    const result = await this.client.get<{
      id: string;
      status: string;
      line_id?: string;
    }>(`/api/bulk_requests/${providerJobId}`);
    return {
      jobId: result.id,
      status: AnnatelMappers.toProviderJobStatus(result.status as never),
      lineId: result.line_id,
      rawResponse: result,
    };
  }

  // ── Webhook ───────────────────────────────────────────────────────────────

  verifyWebhookSignature(payload: Buffer, signature: string): boolean {
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
