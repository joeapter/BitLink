// Phase 1 WhatsApp provider — generates wa.me links for manual sending.
// No Meta credentials required. Staff opens the link on their phone.

import type { SupportOutboundMessage, SupportChannelResult } from "./types";

const SUPPORT_NUMBER = "972587939426"; // BitLink support WhatsApp (no + or dashes)

export function buildCustomerWaUrl(msg: SupportOutboundMessage): SupportChannelResult {
  const to = msg.to.replace(/[^0-9]/g, "");
  const text = encodeURIComponent(msg.body);
  return {
    success: true,
    waUrl: `https://wa.me/${to}?text=${text}`,
  };
}

export function buildSupportWaUrl(prefillText: string): string {
  return `https://wa.me/${SUPPORT_NUMBER}?text=${encodeURIComponent(prefillText)}`;
}

export function buildTicketPrefill(opts: {
  ticketNumber: string;
  customerName: string;
  bitlinkPhone?: string | null;
  category: string;
  details: string;
}): string {
  return [
    `Hi BitLink 👋 I need help with my line.`,
    `Ticket: ${opts.ticketNumber}`,
    `Name: ${opts.customerName}`,
    opts.bitlinkPhone ? `BitLink number: ${opts.bitlinkPhone}` : null,
    `Issue: ${opts.category}`,
    `Details: ${opts.details}`,
  ]
    .filter(Boolean)
    .join("\n");
}
