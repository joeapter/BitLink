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
  PortInParams,
  PortInResult,
  PortInStatus,
  PhoneNumber,
  ProviderJobResult,
  TelecomEvent,
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
