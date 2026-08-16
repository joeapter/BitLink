// Outbound SMS via Twilio's REST API (plain fetch — no SDK dependency).
//
// Env:
//   TWILIO_ACCOUNT_SID  — AC...
//   TWILIO_AUTH_TOKEN
//   TWILIO_FROM         — sender: an E.164 Twilio number, an alphanumeric
//                         sender ID (e.g. "BitLink", works for IL delivery),
//                         or a Messaging Service SID (MG...).
//
// Annatel's tenant API has no outbound-SMS endpoint (verified against their
// OpenAPI spec — only port-auth texts, per-DID forwarding, and SMPP routing
// configs), so a third-party gateway is the only way to message customers.

import { logger } from '@/lib/logger';

const log = logger.child({ lib: 'sms' });

export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM,
  );
}

// Accepts the formats numbers appear in across our tables ("0551234567",
// "972551234567", "+972 55-123-4567") and returns E.164, or null if the
// input can't be a real mobile number.
export function normalizeToE164(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, '');
  if (!digits) return null;
  if (digits.startsWith('+')) return digits.length >= 11 ? digits : null;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  if (digits.startsWith('972')) return `+${digits}`;
  if (digits.startsWith('05') && digits.length === 10) return `+972${digits.slice(1)}`;
  // US/Canada 10-digit
  if (digits.length === 10 && !digits.startsWith('0')) return `+1${digits}`;
  return null;
}

export interface SendSmsResult {
  sid: string;
  status: string;
}

export async function sendSms(to: string, body: string): Promise<SendSmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!accountSid || !authToken || !from) {
    throw new Error('SMS is not configured — set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM');
  }

  const params = new URLSearchParams({ To: to, Body: body });
  // MG... = Messaging Service SID; anything else is a From number/sender ID.
  if (from.startsWith('MG')) params.set('MessagingServiceSid', from);
  else params.set('From', from);

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | { sid?: string; status?: string; message?: string; code?: number }
    | null;

  if (!response.ok || !payload?.sid) {
    const message = payload?.message ?? `Twilio HTTP ${response.status}`;
    log.warn({ to, code: payload?.code, error: message }, 'SMS send failed');
    throw new Error(message);
  }

  return { sid: payload.sid, status: payload.status ?? 'queued' };
}
