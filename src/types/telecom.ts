// Core telecom domain types shared across the platform.
// These are BitLink's internal types — not Annatel API types.
// Annatel-specific shapes live in src/lib/telecom/annatel/mappers.ts.

export type ProviderJobStatus = 'pending' | 'processing' | 'done' | 'failed' | 'canceled';

export type LineStatus =
  | 'draft'
  | 'provisioning'
  | 'active'
  | 'suspended'
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

export type SuspensionReason = 'billing' | 'voluntary' | 'block' | 'fraud' | 'admin';

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
