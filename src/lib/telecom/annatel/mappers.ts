// Maps Annatel API shapes to BitLink internal types.
// All Annatel-specific field names are contained here.

import type {
  LineCreateParams,
  LineResult,
  ProviderJobStatus,
  BalanceBucket,
  SuspensionReason,
  LineDidVoicemail,
  LineDidVoicemailParams,
  LineDidSmsForwarderSetting,
  LineClid,
  AflaloRequest,
  WebhookConversation,
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

export interface AnnatelWebhookConversation {
  id: string;
  http_status: number;
  request_url: string;
  requested_at: string;
  responded_at?: string;
  status: string;
  request_body?: string;
  response_body?: string;
  client_error_message?: string;
}

export interface AnnatelVoicemail {
  id: string;
  email?: string;
  fullname?: string;
  language?: string;
  greeting_language?: string;
  password?: string;
  timezone?: string;
  are_recordings_saved_on_server?: boolean;
  are_recordings_sent_to_email?: boolean;
  start_at: string;
  end_at?: string;
}

export interface AnnatelSmsForwarderSetting {
  id: string;
  email_recipient_address?: string;
  email_sender_address?: string;
  email_sender_name?: string;
  telegram_chat_id?: string;
  forward_by_tragofone?: boolean;
  start_at: string;
  end_at?: string;
}

export interface AnnatelClid {
  id: string;
  caller_id: string;
  destination_group?: { id: string; name: string; default_weight: number };
  destination_group_weight?: number;
  service: string;
  prefix?: string;
  start_at: string;
  end_at?: string;
}

export interface AnnatelAflaloRequest {
  id: string;
  phone_number: string;
  operation: 'open' | 'block';
  done_at?: string;
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

  toVoicemail(v: AnnatelVoicemail): LineDidVoicemail {
    return {
      id: v.id,
      email: v.email,
      fullname: v.fullname,
      language: v.language,
      greetingLanguage: v.greeting_language,
      password: v.password,
      timezone: v.timezone,
      areRecordingsSavedOnServer: v.are_recordings_saved_on_server,
      areRecordingsSentToEmail: v.are_recordings_sent_to_email,
      startAt: new Date(v.start_at),
      endAt: v.end_at ? new Date(v.end_at) : undefined,
    };
  },

  fromVoicemailParams(params: LineDidVoicemailParams): Record<string, unknown> {
    return {
      email: params.email,
      fullname: params.fullname,
      language: params.language,
      greeting_language: params.greetingLanguage,
      password: params.password,
      timezone: params.timezone,
      are_recordings_saved_on_server: params.areRecordingsSavedOnServer,
      are_recordings_sent_to_email: params.areRecordingsSentToEmail,
    };
  },

  toSmsForwarderSetting(s: AnnatelSmsForwarderSetting): LineDidSmsForwarderSetting {
    return {
      id: s.id,
      emailRecipientAddress: s.email_recipient_address,
      emailSenderAddress: s.email_sender_address,
      emailSenderName: s.email_sender_name,
      telegramChatId: s.telegram_chat_id,
      forwardByTragofone: s.forward_by_tragofone,
      startAt: new Date(s.start_at),
      endAt: s.end_at ? new Date(s.end_at) : undefined,
    };
  },

  toClid(c: AnnatelClid): LineClid {
    return {
      id: c.id,
      callerId: c.caller_id,
      destinationGroup: c.destination_group
        ? { id: c.destination_group.id, name: c.destination_group.name, defaultWeight: c.destination_group.default_weight }
        : undefined,
      destinationGroupWeight: c.destination_group_weight,
      service: c.service,
      prefix: c.prefix,
      startAt: new Date(c.start_at),
      endAt: c.end_at ? new Date(c.end_at) : undefined,
    };
  },

  toAflaloRequest(a: AnnatelAflaloRequest): AflaloRequest {
    return {
      id: a.id,
      phoneNumber: a.phone_number,
      operation: a.operation,
      doneAt: a.done_at ? new Date(a.done_at) : undefined,
    };
  },

  toWebhookConversation(c: AnnatelWebhookConversation): WebhookConversation {
    return {
      id: c.id,
      httpStatus: c.http_status,
      requestUrl: c.request_url,
      requestedAt: new Date(c.requested_at),
      respondedAt: c.responded_at ? new Date(c.responded_at) : undefined,
      status: c.status,
      requestBody: c.request_body,
      responseBody: c.response_body,
      clientErrorMessage: c.client_error_message,
    };
  },
};
