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
  NumberAuthenticationStatus,
  PortInParams,
  PortInResult,
  PortInStatus,
  DirectPortInResult,
  PhoneNumber,
  TenantDid,
  TenantDidPage,
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
  DirectPortInResult,
  PhoneNumber,
  TenantDid,
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
  assignSim(providerLineId: string, iccId: string, isMain?: boolean): Promise<void>;
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
  getAvailableEsimIccId(excludeIccIds?: string[]): Promise<string | null>;
  getAvailableDid(usedNumbers?: string[]): Promise<string | null>;

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

  // ── Port-in number authentication (SMS ownership proof) ──────
  // Required before a port-in create is accepted; a completed
  // authentication is valid for 15 days.
  createNumberAuthentication(phoneNumber: string): Promise<NumberAuthenticationStatus>;
  verifyNumberAuthentication(phoneNumber: string, code: string): Promise<boolean>;
  getNumberAuthenticationStatus(phoneNumber: string): Promise<NumberAuthenticationStatus>;

  // ── Portability ──────────────────────────────────────────────
  checkPortability(phoneNumber: string): Promise<PortabilityCheck>;
  checkPortabilityAvailability(phoneNumber: string): Promise<PortabilityAvailability>;
  initiatePortIn(params: PortInParams): Promise<PortInResult>;
  getPortInStatus(providerJobId: string): Promise<PortInStatus>;
  cancelPortIn(providerJobId: string): Promise<void>;
  // Ports a number directly onto an already-active line (bulk_requests
  // type:'add', line_id + matching dids/port_in_request_params) instead of
  // through a new-line create. Confirmed accepted by Annatel's validator
  // (a bogus line_id got "line_id does not exist" back) but not yet proven
  // end-to-end — callers should be ready to fall back to createLine() with
  // portInParams if this fails.
  portInDirect(providerLineId: string, number: string, identityNumber: string, authenticationType: 'sms_code' | 'ivr'): Promise<DirectPortInResult>;

  // ── Number (DID) management ──────────────────────────────────
  listTenantDids(page?: number, pageSize?: number): Promise<TenantDidPage>;
  getAssignedNumbers(providerLineId: string): Promise<PhoneNumber[]>;
  assignDid(providerLineId: string, number: string): Promise<void>;
  releaseDid(providerLineId: string, number: string): Promise<void>;

  // ── Webhook endpoints ────────────────────────────────────────
  listWebhookEndpoints(): Promise<WebhookEndpoint[]>;
  createWebhookEndpoint(url: string, patterns: string[], secret?: string): Promise<WebhookEndpoint>;
  deleteWebhookEndpoint(id: string): Promise<void>;

  // ── Events audit log ─────────────────────────────────────────
  listEvents(filters?: { resourceId?: string; type?: string; limit?: number }): Promise<AnnatelEvent[]>;

  // ── Voicemail (per DID) ───────────────────────────────────────
  // Whether BitLink lines have a voicemail box by default is unconfirmed.
  listLineDidVoicemails(providerLineId: string, lineDidId: string): Promise<LineDidVoicemail[]>;
  createLineDidVoicemail(providerLineId: string, lineDidId: string, params: LineDidVoicemailParams): Promise<LineDidVoicemail>;
  updateLineDidVoicemail(providerLineId: string, lineDidId: string, voicemailId: string, params: LineDidVoicemailParams): Promise<LineDidVoicemail>;
  deleteLineDidVoicemail(providerLineId: string, lineDidId: string, voicemailId: string): Promise<void>;

  // ── SMS forwarding (per DID) ──────────────────────────────────
  // Additive backup delivery only — device delivery already works without it.
  listLineDidSmsForwarders(providerLineId: string, lineDidId: string): Promise<LineDidSmsForwarderSetting[]>;
  addLineDidSmsForwarder(providerLineId: string, lineDidId: string, params: LineDidSmsForwarderParams): Promise<LineDidSmsForwarderSetting>;
  removeLineDidSmsForwarder(providerLineId: string, lineDidId: string, settingId: string): Promise<void>;

  // ── Caller ID (CLID) ──────────────────────────────────────────
  // Valid destination_group_name values are unconfirmed — ask Annatel.
  listLineClids(providerLineId: string): Promise<LineClid[]>;
  addLineClid(providerLineId: string, params: LineClidParams): Promise<LineClid>;
  removeLineClid(providerLineId: string, clidId: string): Promise<void>;

  // ── Aflalo requests (Israeli telemarketing-consent, UNCONFIRMED effect) ──
  // Do not call createAflaloRequest against a real customer number without
  // confirming with Annatel what "open"/"block" actually does.
  listAflaloRequests(number: string): Promise<AflaloRequest[]>;
  createAflaloRequest(number: string, operation: 'open' | 'block'): Promise<AflaloRequest>;

  // ── Webhook delivery diagnostics ──────────────────────────────
  listWebhookConversations(webhookEndpointId: string): Promise<WebhookConversation[]>;

  // ── Reference data (read-only) ────────────────────────────────
  // Note: "Manufacturers" is a tag in Annatel's Swagger doc with zero real
  // path operations — no endpoint exists to call, so it's not here.
  listTenantIpAddresses(): Promise<TenantIpAddress[]>;

  // ── Async job polling ────────────────────────────────────────
  getJobStatus(providerJobId: string): Promise<ProviderJobResult>;

  // ── Webhook verification ─────────────────────────────────────
  verifyWebhookSignature(payload: Buffer, signature: string): boolean;
  parseWebhookEvent(payload: Buffer): TelecomEvent;
}
