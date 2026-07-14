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

// Annatel expects MSISDNs in E.164 (+972…) — confirmed from its own DID
// responses. Local formats like 0555195335 are rejected with a 422.
function normalizeMsisdn(value: string): string {
  const cleaned = value.replace(/[\s\-().]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('00')) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith('972')) return `+${cleaned}`;
  if (/^0\d{8,9}$/.test(cleaned)) return `+972${cleaned.slice(1)}`;
  return cleaned;
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
      // Annatel (Ruben, Jul 2026): the line's number is EITHER a pool DID or a
      // port-in — and for port-ins the dids array must carry the ported number
      // itself. Empirically: omitting dids → "dids can't be blank"; a pool DID
      // alongside port params → "port_in_request_params.number is invalid".
      ...(params.portInParams
        ? {
            dids: [{ number: normalizeMsisdn(params.portInParams.number) }],
            port_in_request_params: {
              number: normalizeMsisdn(params.portInParams.number),
              identity_number: params.portInParams.identityNumber,
              authentication_type: normalizePortAuthenticationType(params.portInParams.authenticationType),
            },
          }
        : params.phoneNumber
          ? { dids: [{ number: normalizeMsisdn(params.phoneNumber) }] }
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
