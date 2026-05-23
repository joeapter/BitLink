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
