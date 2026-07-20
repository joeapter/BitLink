// MockTelecomProvider — used in test and local dev environments.
// Set TELECOM_PROVIDER=mock in your .env to activate.
// Supports failure simulation for testing error paths.

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
  TenantDidPage,
  ProviderJobResult,
  TelecomEvent,
  LineDetail,
  LineSimInfo,
  LinePlanInfo,
  LineBarring,
  LineForward,
  EsimProfile,
  PlanCatalogEntry,
  PortabilityAvailability,
  WebhookEndpoint,
  AnnatelEvent,
  LineDidVoicemail,
  LineDidVoicemailParams,
  LineDidSmsForwarderSetting,
  LineDidSmsForwarderParams,
  LineClid,
  LineClidParams,
  AflaloRequest,
  WebhookConversation,
  TenantIpAddress,
} from '@/types/telecom';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function shortId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

export class MockTelecomProvider implements TelecomProvider {
  readonly providerId = 'mock';

  private delayMs = 50;
  private _failNext = false;

  /** Call before a request to simulate a provider failure on the next call. */
  simulateFailure(): void {
    this._failNext = true;
  }

  private async tick(): Promise<void> {
    await sleep(this.delayMs);
    if (this._failNext) {
      this._failNext = false;
      throw new Error('MockTelecomProvider: simulated failure');
    }
  }

  async createLine(_params: LineCreateParams): Promise<LineResult> {
    await this.tick();
    return {
      providerLineId: `mock_line_${shortId()}`,
      providerJobId: `bur_mock_${shortId()}`,
      status: 'done',
    };
  }

  async getLineStatus(_providerLineId: string): Promise<LineStatus> {
    await this.tick();
    return 'active';
  }

  async suspendLine(_providerLineId: string, _reason: SuspensionReason): Promise<void> {
    await this.tick();
  }

  async reactivateLine(_providerLineId: string): Promise<void> {
    await this.tick();
  }

  async terminateLine(_providerLineId: string): Promise<void> {
    await this.tick();
  }

  async assignSim(_providerLineId: string, _iccId: string): Promise<void> {
    await this.tick();
  }

  async replaceSim(_providerLineId: string, _newIccId: string): Promise<void> {
    await this.tick();
  }

  async triggerOta(
    _providerLineId: string,
    _iccId: string,
    _params: OtaParams,
  ): Promise<string> {
    await this.tick();
    return `ota_mock_${shortId()}`;
  }

  async getOtaStatus(_providerLineId: string, otaRequestId: string): Promise<OtaStatus> {
    await this.tick();
    return {
      id: otaRequestId,
      iccId: `89972mock${shortId()}`,
      status: 'completed',
      respondedAt: new Date(),
    };
  }

  async assignPlan(_providerLineId: string, _planName: string): Promise<void> {
    await this.tick();
  }

  async removePlan(_providerLineId: string, _planName: string): Promise<void> {
    await this.tick();
  }

  async addTopup(_providerLineId: string, _topupName: string): Promise<void> {
    await this.tick();
  }

  async getBalances(_providerLineId: string): Promise<BalanceBucket[]> {
    await this.tick();
    return [
      {
        id: 'data',
        type: '*data',
        categories: ['data'],
        value: 10_000_000_000,
        initialValue: 25_000_000_000,
        expirationDate: new Date(Date.now() + 30 * 86_400_000),
        weight: 99,
      },
      {
        id: 'voice',
        type: '*voice',
        categories: ['voice'],
        value: 3_600,
        initialValue: 7_200,
        expirationDate: new Date(Date.now() + 30 * 86_400_000),
        weight: 90,
      },
    ];
  }

  async getUsageSummary(_providerLineId: string): Promise<UsageSummary> {
    await this.tick();
    return {
      dataBytes: 15_000_000_000,
      voiceSeconds: 3_600,
      smsCount: 10,
      recordedAt: new Date(),
    };
  }

  async checkPortability(phoneNumber: string): Promise<PortabilityCheck> {
    await this.tick();
    return { number: phoneNumber, operator: 'PR', isPortable: true };
  }

  async initiatePortIn(_params: PortInParams): Promise<PortInResult> {
    await this.tick();
    return { portInRequestId: `pir_mock_${shortId()}`, status: 'open' };
  }

  async getPortInStatus(providerJobId: string): Promise<PortInStatus> {
    await this.tick();
    return { id: providerJobId, status: 'completed' };
  }

  async cancelPortIn(_providerJobId: string): Promise<void> {
    await this.tick();
  }

  async listTenantDids(_page?: number, _pageSize?: number): Promise<TenantDidPage> {
    await this.tick();
    return { dids: [], meta: { pageNumber: 1, pageSize: 100, total: 0 } };
  }

  async getAssignedNumbers(_providerLineId: string): Promise<PhoneNumber[]> {
    await this.tick();
    return [{ number: '+9725512345678', isPrimary: true, startAt: new Date() }];
  }

  async assignDid(_providerLineId: string, _number: string): Promise<void> {
    await this.tick();
  }

  async releaseDid(_providerLineId: string, _number: string): Promise<void> {
    await this.tick();
  }

  async getJobStatus(providerJobId: string): Promise<ProviderJobResult> {
    await this.tick();
    return { jobId: providerJobId, status: 'done' };
  }

  async getLineDetail(providerLineId: string): Promise<LineDetail> {
    await this.tick();
    return {
      id: providerLineId, status: 'active', isKosher: false,
      sims: [], plans: [], dids: [], suspensions: [], barrings: [], forwards: [], balances: [],
    };
  }

  async refreshLine(_providerLineId: string): Promise<void> { await this.tick(); }
  async hardResetLine(_providerLineId: string): Promise<void> { await this.tick(); }
  async hlrReset(_providerLineId: string): Promise<void> { await this.tick(); }

  async listLineSims(_providerLineId: string): Promise<LineSimInfo[]> { await this.tick(); return []; }

  async getEsimProfile(_simId: string): Promise<EsimProfile> {
    await this.tick();
    return { iccId: '89000000000000000000', activationCode: 'LPA:1$mock.smdp.io$MOCK', smDpPlusAddress: 'mock.smdp.io' };
  }

  async recycleEsimProfile(_simId: string): Promise<void> { await this.tick(); }

  async listLinePlans(_providerLineId: string): Promise<LinePlanInfo[]> { await this.tick(); return []; }

  async replacePlan(_providerLineId: string, _linePlanId: string, _newPlanName: string): Promise<void> { await this.tick(); }

  async listPlansCatalog(): Promise<PlanCatalogEntry[]> {
    await this.tick();
    return [{ id: 'mock-plan-1', name: 'mock-basic', isMain: true }];
  }

  async getAvailableDid(_usedNumbers?: string[]): Promise<string | null> {
    return '+972551234567';
  }

  async getAvailableEsimIccId(_excludeIccIds?: string[]): Promise<string | null> {
    return '89000000000000000001';
  }

  // ── Port-in number authentication (mock: instant success) ─────────────────
  async createNumberAuthentication(_phoneNumber: string): Promise<NumberAuthenticationStatus> {
    await this.tick();
    return 'pending';
  }
  async verifyNumberAuthentication(_phoneNumber: string, _code: string): Promise<boolean> {
    await this.tick();
    return true;
  }
  async getNumberAuthenticationStatus(_phoneNumber: string): Promise<NumberAuthenticationStatus> {
    await this.tick();
    return 'completed';
  }

  async listBarrings(_providerLineId: string): Promise<LineBarring[]> { await this.tick(); return []; }
  async addBarring(_providerLineId: string, type: string): Promise<LineBarring> {
    await this.tick();
    return { id: shortId(), type, createdAt: new Date() };
  }
  async removeBarring(_providerLineId: string, _barringId: string): Promise<void> { await this.tick(); }

  async listForwards(_providerLineId: string): Promise<LineForward[]> { await this.tick(); return []; }
  async addForward(_providerLineId: string, destination: string): Promise<LineForward> {
    await this.tick();
    return { id: shortId(), destination, createdAt: new Date() };
  }
  async removeForward(_providerLineId: string, _forwardId: string): Promise<void> { await this.tick(); }

  async checkPortabilityAvailability(phoneNumber: string): Promise<PortabilityAvailability> {
    await this.tick();
    return { number: phoneNumber, isAvailable: true, operator: 'PR' };
  }

  async listWebhookEndpoints(): Promise<WebhookEndpoint[]> { await this.tick(); return []; }
  async createWebhookEndpoint(url: string, patterns: string[]): Promise<WebhookEndpoint> {
    await this.tick();
    return { id: shortId(), url, isEnabled: true, enabledNotificationPatterns: patterns, createdAt: new Date() };
  }
  async deleteWebhookEndpoint(_id: string): Promise<void> { await this.tick(); }

  async listWebhookConversations(_webhookEndpointId: string): Promise<WebhookConversation[]> { await this.tick(); return []; }

  async listLineDidVoicemails(_providerLineId: string, _lineDidId: string): Promise<LineDidVoicemail[]> { await this.tick(); return []; }
  async createLineDidVoicemail(_providerLineId: string, _lineDidId: string, params: LineDidVoicemailParams): Promise<LineDidVoicemail> {
    await this.tick();
    return { id: shortId(), startAt: new Date(), ...params };
  }
  async updateLineDidVoicemail(_providerLineId: string, _lineDidId: string, voicemailId: string, params: LineDidVoicemailParams): Promise<LineDidVoicemail> {
    await this.tick();
    return { id: voicemailId, startAt: new Date(), ...params };
  }
  async deleteLineDidVoicemail(_providerLineId: string, _lineDidId: string, _voicemailId: string): Promise<void> { await this.tick(); }

  async listLineDidSmsForwarders(_providerLineId: string, _lineDidId: string): Promise<LineDidSmsForwarderSetting[]> { await this.tick(); return []; }
  async addLineDidSmsForwarder(_providerLineId: string, _lineDidId: string, params: LineDidSmsForwarderParams): Promise<LineDidSmsForwarderSetting> {
    await this.tick();
    return { id: shortId(), startAt: new Date(), ...params };
  }
  async removeLineDidSmsForwarder(_providerLineId: string, _lineDidId: string, _settingId: string): Promise<void> { await this.tick(); }

  async listLineClids(_providerLineId: string): Promise<LineClid[]> { await this.tick(); return []; }
  async addLineClid(_providerLineId: string, params: LineClidParams): Promise<LineClid> {
    await this.tick();
    return { id: shortId(), callerId: params.callerId, destinationGroupWeight: params.destinationGroupWeight, service: params.service, startAt: new Date() };
  }
  async removeLineClid(_providerLineId: string, _clidId: string): Promise<void> { await this.tick(); }

  async listAflaloRequests(_number: string): Promise<AflaloRequest[]> { await this.tick(); return []; }
  async createAflaloRequest(number: string, operation: 'open' | 'block'): Promise<AflaloRequest> {
    await this.tick();
    return { id: shortId(), phoneNumber: number, operation, doneAt: new Date() };
  }

  async listTenantIpAddresses(): Promise<TenantIpAddress[]> { await this.tick(); return []; }

  async listEvents(_filters?: { resourceId?: string; type?: string; limit?: number }): Promise<AnnatelEvent[]> {
    await this.tick();
    return [];
  }

  verifyWebhookSignature(_payload: Buffer, _signature: string): boolean {
    return true;
  }

  parseWebhookEvent(payload: Buffer): TelecomEvent {
    const data = JSON.parse(payload.toString('utf8')) as Record<string, unknown>;
    return {
      type: (data.type ?? 'mock.event') as string,
      providerId: 'mock',
      eventId: shortId(),
      occurredAt: new Date(),
      payload: data,
    };
  }
}
