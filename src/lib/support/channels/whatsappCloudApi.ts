// Phase 2 WhatsApp provider — Meta WhatsApp Cloud API.
// INACTIVE until env vars are set. Nothing here runs in Phase 1.
//
// Required env vars (add to Vercel when ready):
//   WHATSAPP_PHONE_NUMBER_ID      — from Meta Business Manager → WhatsApp → Phone numbers
//   WHATSAPP_ACCESS_TOKEN         — System User permanent token from Meta Business Manager
//   WHATSAPP_VERIFY_TOKEN         — any secret string you choose; used to verify webhook registration
//   WHATSAPP_BUSINESS_ACCOUNT_ID  — your WABA ID from Meta Business Manager
//
// Setup steps (Phase 2):
//   1. Create Meta Business account at business.facebook.com
//   2. Add WhatsApp Business product → add phone number
//   3. Create System User with WhatsApp permissions → generate permanent token
//   4. Register webhook at developers.facebook.com → point to /api/webhooks/whatsapp
//   5. Subscribe to messages, message_deliveries, message_reads events
//   6. Set the env vars above in Vercel dashboard
//   7. Change WHATSAPP_PROVIDER=cloud_api in env vars

import type { SupportOutboundMessage, SupportChannelResult, SupportInboundMessage } from "./types";

const GRAPH_API = "https://graph.facebook.com/v19.0";

function isConfigured(): boolean {
  return !!(
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    process.env.WHATSAPP_ACCESS_TOKEN
  );
}

export async function sendTextMessage(msg: SupportOutboundMessage): Promise<SupportChannelResult> {
  if (!isConfigured()) {
    return { success: false, error: "WhatsApp Cloud API not configured — set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN" };
  }

  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const token   = process.env.WHATSAPP_ACCESS_TOKEN!;

  const to = msg.to.startsWith("+") ? msg.to.slice(1) : msg.to;

  const res = await fetch(`${GRAPH_API}/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: msg.body, preview_url: false },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { success: false, error: JSON.stringify(err) };
  }

  const data = await res.json();
  return { success: true, messageId: data?.messages?.[0]?.id };
}

export function parseInboundPayload(payload: unknown): SupportInboundMessage[] {
  // TODO: parse Meta webhook payload format
  // Payload structure: payload.entry[].changes[].value.messages[]
  const messages: SupportInboundMessage[] = [];
  try {
    const entries = (payload as Record<string, unknown>)?.entry as unknown[];
    for (const entry of entries ?? []) {
      const changes = (entry as Record<string, unknown>)?.changes as unknown[];
      for (const change of changes ?? []) {
        const value = (change as Record<string, unknown>)?.value as Record<string, unknown>;
        const msgs  = value?.messages as unknown[] ?? [];
        for (const m of msgs) {
          const msg = m as Record<string, unknown>;
          messages.push({
            from:               String(msg.from ?? ""),
            body:               String((msg.text as Record<string, unknown>)?.body ?? ""),
            whatsappMessageId:  String(msg.id ?? ""),
            timestamp:          new Date(Number(msg.timestamp ?? 0) * 1000),
            raw:                m,
          });
        }
      }
    }
  } catch {
    // malformed payload — return empty
  }
  return messages;
}
