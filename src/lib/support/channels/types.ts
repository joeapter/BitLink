// WhatsApp channel abstraction — shared types for manual and Cloud API providers.
// Phase 1: manual wa.me links only.
// Phase 2: swap in whatsappCloudApi provider when Meta credentials are ready.

export type SupportChannelProvider = "manual" | "cloud_api";

export interface SupportOutboundMessage {
  to: string;          // recipient phone number (E.164 format, e.g. +972581234567)
  body: string;        // plain text message body
  ticketNumber?: string;
}

export interface SupportInboundMessage {
  from: string;        // sender phone number
  body: string;
  whatsappMessageId: string;
  timestamp: Date;
  raw?: unknown;
}

export type SupportMessageStatus = "sent" | "delivered" | "read" | "failed";

export interface SupportChannelResult {
  success: boolean;
  messageId?: string;
  waUrl?: string;      // set for manual provider — open this URL
  error?: string;
}
