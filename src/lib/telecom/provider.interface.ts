// TelecomProvider interface — the abstraction that isolates BitLink from any
// specific carrier or MVNO API. Every provider (Annatel, future providers) must
// implement this interface. No business logic should ever import an Annatel
// type directly — always go through this interface.

export type {
  LineCreateParams,
  LineResult,
  LineStatus,
  SimStatus,
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
  ProviderJobStatus,
  TelecomEvent,
} from '@/types/telecom';

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

export interface TelecomProvider {
  readonly providerId: string;

  // ── Line lifecycle ────────────────────────────────────────────
  createLine(params: LineCreateParams): Promise<LineResult>;
  getLineStatus(providerLineId: string): Promise<LineStatus>;
  suspendLine(providerLineId: string, reason: SuspensionReason): Promise<void>;
  reactivateLine(providerLineId: string): Promise<void>;
  terminateLine(providerLineId: string): Promise<void>;

  // ── SIM management ───────────────────────────────────────────
  assignSim(providerLineId: string, iccId: string): Promise<void>;
  replaceSim(providerLineId: string, newIccId: string): Promise<void>;
  triggerOta(providerLineId: string, iccId: string, params: OtaParams): Promise<string>;
  getOtaStatus(providerLineId: string, otaRequestId: string): Promise<OtaStatus>;

  // ── Plan management ──────────────────────────────────────────
  assignPlan(providerLineId: string, planName: string): Promise<void>;
  removePlan(providerLineId: string, planName: string): Promise<void>;
  addTopup(providerLineId: string, topupName: string): Promise<void>;

  // ── Usage & balance ──────────────────────────────────────────
  getBalances(providerLineId: string): Promise<BalanceBucket[]>;
  getUsageSummary(providerLineId: string): Promise<UsageSummary>;

  // ── Portability ──────────────────────────────────────────────
  checkPortability(phoneNumber: string): Promise<PortabilityCheck>;
  initiatePortIn(params: PortInParams): Promise<PortInResult>;
  getPortInStatus(providerJobId: string): Promise<PortInStatus>;
  cancelPortIn(providerJobId: string): Promise<void>;

  // ── Number (DID) management ──────────────────────────────────
  getAssignedNumbers(providerLineId: string): Promise<PhoneNumber[]>;
  assignDid(providerLineId: string, number: string): Promise<void>;
  releaseDid(providerLineId: string, number: string): Promise<void>;

  // ── Async job polling ────────────────────────────────────────
  // Fallback for when webhooks don't arrive — poll provider job status directly.
  getJobStatus(providerJobId: string): Promise<ProviderJobResult>;

  // ── Webhook verification ─────────────────────────────────────
  verifyWebhookSignature(payload: Buffer, signature: string): boolean;
  parseWebhookEvent(payload: Buffer): TelecomEvent;
}
