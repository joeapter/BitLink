// Maps Annatel API shapes to BitLink internal types.
// All Annatel-specific field names are contained here.

import type {
  LineCreateParams,
  LineResult,
  ProviderJobStatus,
  BalanceBucket,
  SuspensionReason,
} from '@/types/telecom';

type AnnatelBulkStatus = 'open' | 'done' | 'failed' | 'canceled';

export interface AnnatelBulkRequest {
  id: string;
  line_id: string | null;
  status: AnnatelBulkStatus;
  type: 'create' | 'add' | 'remove';
}

export interface AnnatelOcsBalance {
  id: string;
  type: string;
  categories: string[];
  value: number;
  initial_value: number;
  expiration_date: string;
  uuid: string;
  weight: number;
}

const SUSPENSION_MAP: Record<SuspensionReason, string> = {
  billing: 'billing_block',
  voluntary: 'voluntary_block',
  block: 'block',
  fraud: 'fraud_block',
  admin: 'admin_block',
  // Confirmed with Annatel (Jul 2026): 'freeze' holds the line, number, and
  // SIM — used by the customer-facing "Pause My Plan" feature.
  freeze: 'freeze',
};

const JOB_STATUS_MAP: Record<AnnatelBulkStatus, ProviderJobStatus> = {
  open: 'pending',
  done: 'done',
  failed: 'failed',
  canceled: 'canceled',
};

function normalizePortAuthenticationType(value: unknown): 'sms_code' | 'ivr' {
  return value === 'ivr' ? 'ivr' : 'sms_code';
}

export const AnnatelMappers = {
  toCreateBulkRequest(params: LineCreateParams): Record<string, unknown> {
    return {
      type: 'create',
      external_id: params.externalId,
      is_kosher: params.isKosher ?? false,
      plan: { plan_name: params.planName },
      language: params.language ?? 'he_IL',
      ...(params.email ? { email: params.email } : {}),
      ...(params.identityNumber ? { identity_number: params.identityNumber } : {}),
      ...(params.iccId ? { sims: [{ icc_id: params.iccId }] } : {}),
      ...(params.phoneNumber ? { dids: [{ number: params.phoneNumber }] } : {}),
      ...(params.portInParams
        ? {
            port_in_request_params: {
              number: params.portInParams.number,
              identity_number: params.portInParams.identityNumber,
              authentication_type: normalizePortAuthenticationType(params.portInParams.authenticationType),
            },
          }
        : {}),
    };
  },

  toLineResult(response: AnnatelBulkRequest): LineResult {
    return {
      providerLineId: response.line_id ?? null,
      providerJobId: response.id,
      status: AnnatelMappers.toProviderJobStatus(response.status),
    };
  },

  toProviderJobStatus(status: AnnatelBulkStatus): ProviderJobStatus {
    return JOB_STATUS_MAP[status] ?? 'pending';
  },

  toSuspensionType(reason: SuspensionReason): string {
    return SUSPENSION_MAP[reason] ?? 'block';
  },

  toBalanceBuckets(balances: AnnatelOcsBalance[]): BalanceBucket[] {
    return balances.map((b) => ({
      id: b.id,
      type: b.type,
      categories: b.categories,
      value: b.value,
      initialValue: b.initial_value,
      expirationDate: new Date(b.expiration_date),
      weight: b.weight,
    }));
  },
};
