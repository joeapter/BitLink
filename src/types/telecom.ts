// Core telecom domain types shared across the platform.
// These are BitLink's internal types — not Annatel API types.
// Annatel-specific shapes live in src/lib/telecom/annatel/mappers.ts.

export type ProviderJobStatus = 'pending' | 'processing' | 'done' | 'failed' | 'canceled';

export type LineStatus =
  | 'draft'
  | 'provisioning'
  | 'active'
  | 'suspended'
  | 'paused'
  | 'porting'
  | 'terminated'
  | 'failed';

export type SimStatus =
  | 'inventory'
  | 'reserved'
  | 'provisioning'
  | 'active'
  | 'suspended'
  | 'retired'
  | 'failed';

export type SuspensionReason = 'billing' | 'voluntary' | 'block' | 'fraud' | 'admin' | 'freeze';

// Port-in ownership authentication (SMS code to the ported number).
// 'none' = no authentication exists for the number yet.
export type NumberAuthenticationStatus =
  | 'none'
  | 'pending'
  | 'completed'
  | 'expired'
  | 'overriden'
  | 'locked';

export type ProvisioningJobType =
  | 'create_line'
  | 'modify_line'
  | 'suspend_line'
  | 'reactivate_line'
  | 'terminate_line'
  | 'assign_sim'
  | 'replace_sim'
  | 'assign_plan'
  | 'remove_plan'
  | 'add_topup'
  | 'trigger_ota'
  | 'port_in';

// ----------------------------------------------------------------
// Provider input/output types
// ----------------------------------------------------------------

export interface LineCreateParams {
  externalId: string;
  planName: string;
  iccId?: string;
  phoneNumber?: string;
  email?: string;
  language?: string;
  identityNumber?: string;
  portInParams?: {
    number: string;
    identityNumber: string;
    authenticationType: 'sms_code' | 'ivr';
  };
  isKosher?: boolean;
  metadata?: Record<string, unknown>;
}

export interface LineResult {
  providerLineId: string | null; // null when provider hasn't assigned it yet (async BulkRequest still open)
  providerJobId: string;
  status: ProviderJobStatus;
}

export interface BalanceBucket {
  id: string;
  type: string;
  categories: string[];
  value: number;
  initialValue: number;
  expirationDate: Date;
  weight: number;
}

export interface UsageSummary {
  dataBytes: number;
  voiceSeconds: number;
  smsCount: number;
  recordedAt: Date;
}

export interface OtaParams {
  ehplmn?: string;
  spn?: string;
  refreshType?: string;
}

export interface OtaStatus {
  id: string;
  iccId: string;
  status: 'pending' | 'completed' | 'failed';
  respondedAt?: Date;
}

export interface PortabilityCheck {
  number: string;
  operator: string;
  isPortable: boolean;
}

export interface PortInParams {
  lineId: string;
  number: string;
  identityNumber: string;
  authenticationType: 'sms_code' | 'ivr';
  idempotencyKey: string;
}

export interface PortInResult {
  portInRequestId: string;
  status: string;
}

export interface PortInStatus {
  id: string;
  status: string;
  transferTime?: Date;
  transferredAt?: Date;
  error?: string;
}

export interface PhoneNumber {
  number: string;
  isPrimary: boolean;
  startAt: Date;
  endAt?: Date;
  // The line_did's own id at the provider — required to call any per-number
  // sub-resource (voicemail, SMS forwarding, CLID). Optional because older
  // call sites that only ever needed the number itself don't set it.
  id?: string;
}

export interface TenantDid {
  number: string;
  createdAt: Date;
  isOpenToPortOut: boolean;
  isTechnical: boolean;
  portedFromOperator?: string;
  portedToOperator?: string;
  returnedByOperator?: string;
}

export interface TenantDidPage {
  dids: TenantDid[];
  meta: { pageNumber: number; pageSize: number; total: number };
}

export interface ProviderJobResult {
  jobId: string;
  status: ProviderJobStatus;
  lineId?: string;
  error?: string;
  rawResponse?: unknown;
}

export interface TelecomEvent {
  type: string;
  providerId: string;
  eventId?: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
}

// ── Extended line detail ──────────────────────────────────────────────────────

export interface LineSimInfo {
  id: string;
  iccId: string;
  isMain: boolean;
  type: 'esim' | 'sim_card';
  activationCode?: string;       // eSIM only — the LPA activation string
  activationCodeToken?: string;  // eSIM only
  smDpPlusAddress?: string;      // eSIM only — SM-DP+ server
  confirmationCode?: string;     // eSIM only
}

export interface LinePlanInfo {
  id: string;
  planId: string;
  planName: string;
  isMain: boolean;
  startAt: Date;
  endAt?: Date;
}

export interface LineSuspension {
  id: string;
  type: string;
  createdAt: Date;
}

export interface LineBarring {
  id: string;
  type: string;
  createdAt: Date;
}

export interface LineForward {
  id: string;
  destination: string;
  createdAt: Date;
}

export interface LineDetail {
  id: string;                    // Annatel line ID
  status: string;
  email?: string;
  language?: string;
  isKosher?: boolean;
  isVoltEnabled?: boolean;
  isAbroadRoamingEnabled?: boolean;
  sims: LineSimInfo[];
  plans: LinePlanInfo[];
  dids: PhoneNumber[];
  suspensions: LineSuspension[];
  barrings: LineBarring[];
  forwards: LineForward[];
  balances: BalanceBucket[];
}

export interface EsimProfile {
  iccId: string;
  activationCode: string;        // Full LPA string: LPA:1$SM-DP-ADDRESS$...
  smDpPlusAddress: string;
  activationCodeToken?: string;
  confirmationCode?: string;
}

export interface PlanCatalogEntry {
  id: string;
  name: string;
  isMain: boolean;
}

export interface PortabilityAvailability {
  number: string;
  isAvailable: boolean;
  operator?: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  isEnabled: boolean;
  enabledNotificationPatterns: string[];
  createdAt: Date;
}

export interface AnnatelEvent {
  id: string;
  type: string;
  ref: string;
  resourceId: string;
  resourceObject: string;
  data: Record<string, unknown>;
  occurredAt: Date;
  tenantId: string;
}

// ── Voicemail (per DID) ───────────────────────────────────────────────────────
// Confirmed real endpoints (Annatel Swagger, Jul 2026). Whether BitLink lines
// have a voicemail box provisioned by default is unconfirmed — ask Annatel.

export interface LineDidVoicemailParams {
  email?: string;
  fullname?: string;
  language?: string;
  greetingLanguage?: string;
  password?: string;
  timezone?: string;
  areRecordingsSavedOnServer?: boolean;
  areRecordingsSentToEmail?: boolean;
}

export interface LineDidVoicemail extends LineDidVoicemailParams {
  id: string;
  startAt: Date;
  endAt?: Date;
}

// ── SMS forwarding (per DID) ──────────────────────────────────────────────────
// Optional, additive: forwards a COPY of incoming SMS to an email or Telegram
// chat. Device delivery already works without this configured.

export interface LineDidSmsForwarderParams {
  emailRecipientAddress?: string;
  emailSenderAddress?: string;
  emailSenderName?: string;
  telegramChatId?: string;
  forwardByTragofone?: boolean;
}

export interface LineDidSmsForwarderSetting extends LineDidSmsForwarderParams {
  id: string;
  startAt: Date;
  endAt?: Date;
}

// ── Caller ID (CLID) ──────────────────────────────────────────────────────────
// Per-destination-group outbound caller ID. Which destination_group_name
// values are valid is unconfirmed — ask Annatel before relying on this.

export interface DestinationGroup {
  id: string;
  name: string;
  defaultWeight: number;
}

export interface LineClidParams {
  callerId: string;
  destinationGroupName: string;
  destinationGroupWeight?: number;
  service: string;
}

export interface LineClid {
  id: string;
  callerId: string;
  destinationGroup?: DestinationGroup;
  destinationGroupWeight?: number;
  service: string;
  prefix?: string;
  startAt: Date;
  endAt?: Date;
}

// ── Aflalo requests (Israeli telemarketing-consent, UNCONFIRMED semantics) ───
// "open"/"block" per number — near-certainly related to Israel's Chok Aflalo
// telemarketing-consent law, but the exact effect is unconfirmed. Don't call
// createAflaloRequest against a real customer number without checking with
// Annatel first.

export interface AflaloRequest {
  id: string;
  phoneNumber: string;
  operation: 'open' | 'block';
  doneAt?: Date;
}

// ── Webhook delivery diagnostics ─────────────────────────────────────────────

export interface WebhookConversation {
  id: string;
  httpStatus: number;
  requestUrl: string;
  requestedAt: Date;
  respondedAt?: Date;
  status: string;
  requestBody?: string;
  responseBody?: string;
  clientErrorMessage?: string;
}

// ── Reference data (read-only) ───────────────────────────────────────────────

export interface TenantIpAddress {
  id: string;
  ip: string;
  isPrivate: boolean;
  useArea: string;
  startAt: Date;
  endAt?: Date;
}
