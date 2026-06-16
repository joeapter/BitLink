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
} from '@/types/telecom';

export interface TelecomProvider {
  readonly providerId: string;

  // ── Line lifecycle ────────────────────────────────────────────
  createLine(params: LineCreateParams): Promise<LineResult>;
  getLineStatus(providerLineId: string): Promise<LineStatus>;
  getLineDetail(providerLineId: string): Promise<LineDetail>;
  suspendLine(providerLineId: string, reason: SuspensionReason): Promise<void>;
  reactivateLine(providerLineId: string): Promise<void>;
  terminateLine(providerLineId: string): Promise<void>;
  refreshLine(providerLineId: string): Promise<void>;
  hardResetLine(providerLineId: string): Promise<void>;
  hlrReset(providerLineId: string): Promise<void>;

  // ── SIM management ───────────────────────────────────────────
  assignSim(providerLineId: string, iccId: string): Promise<void>;
  replaceSim(providerLineId: string, newIccId: string): Promise<void>;
  listLineSims(providerLineId: string): Promise<LineSimInfo[]>;
  getEsimProfile(simId: string): Promise<EsimProfile>;
  recycleEsimProfile(simId: string): Promise<void>;
  triggerOta(providerLineId: string, iccId: string, params: OtaParams): Promise<string>;
  getOtaStatus(providerLineId: string, otaRequestId: string): Promise<OtaStatus>;

  // ── Plan management ──────────────────────────────────────────
  assignPlan(providerLineId: string, planName: string): Promise<void>;
  removePlan(providerLineId: string, planName: string): Promise<void>;
  replacePlan(providerLineId: string, linePlanId: string, newPlanName: string): Promise<void>;
  listLinePlans(providerLineId: string): Promise<LinePlanInfo[]>;
  listPlansCatalog(): Promise<PlanCatalogEntry[]>;
  addTopup(providerLineId: string, topupName: string): Promise<void>;

  // ── Usage & balance ──────────────────────────────────────────
  getBalances(providerLineId: string): Promise<BalanceBucket[]>;
  getUsageSummary(providerLineId: string): Promise<UsageSummary>;

  // ── Barrings ─────────────────────────────────────────────────
  listBarrings(providerLineId: string): Promise<LineBarring[]>;
  addBarring(providerLineId: string, type: string): Promise<LineBarring>;
  removeBarring(providerLineId: string, barringId: string): Promise<void>;

  // ── Call forwarding ──────────────────────────────────────────
  listForwards(providerLineId: string): Promise<LineForward[]>;
  addForward(providerLineId: string, destination: string): Promise<LineForward>;
  removeForward(providerLineId: string, forwardId: string): Promise<void>;

  // ── Portability ──────────────────────────────────────────────
  checkPortability(phoneNumber: string): Promise<PortabilityCheck>;
  checkPortabilityAvailability(phoneNumber: string): Promise<PortabilityAvailability>;
  initiatePortIn(params: PortInParams): Promise<PortInResult>;
  getPortInStatus(providerJobId: string): Promise<PortInStatus>;
  cancelPortIn(providerJobId: string): Promise<void>;

  // ── Number (DID) management ──────────────────────────────────
  getAssignedNumbers(providerLineId: string): Promise<PhoneNumber[]>;
  assignDid(providerLineId: string, number: string): Promise<void>;
  releaseDid(providerLineId: string, number: string): Promise<void>;

  // ── Webhook endpoints ────────────────────────────────────────
  listWebhookEndpoints(): Promise<WebhookEndpoint[]>;
  createWebhookEndpoint(url: string, patterns: string[], secret?: string): Promise<WebhookEndpoint>;
  deleteWebhookEndpoint(id: string): Promise<void>;

  // ── Events audit log ─────────────────────────────────────────
  listEvents(filters?: { resourceId?: string; type?: string; limit?: number }): Promise<AnnatelEvent[]>;

  // ── Async job polling ────────────────────────────────────────
  getJobStatus(providerJobId: string): Promise<ProviderJobResult>;

  // ── Webhook verification ─────────────────────────────────────
  verifyWebhookSignature(payload: Buffer, signature: string): boolean;
  parseWebhookEvent(payload: Buffer): TelecomEvent;
}
