// WhatsApp Cloud API webhook — GET verifies the endpoint with Meta, POST receives messages.
// Phase 1: POST just logs raw payloads to support_webhook_events. No auto-replies.
// Phase 2: parse inbound messages and create/update support tickets.

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseInboundPayload } from "@/lib/support/channels/whatsappCloudApi";

// GET — Meta webhook verification handshake
export async function GET(req: NextRequest) {
  const mode      = req.nextUrl.searchParams.get("hub.mode");
  const token     = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!verifyToken) {
    return new NextResponse("WHATSAPP_VERIFY_TOKEN not configured", { status: 503 });
  }

  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// POST — receive inbound messages and status updates from Meta
export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const db = createSupabaseAdminClient();

  // Always store raw payload — useful for debugging
  if (db) {
    const messages = parseInboundPayload(payload);
    const eventType = messages.length > 0 ? "inbound_message" : "status_update";

    await db.from("support_webhook_events").insert({
      provider:    "whatsapp",
      event_type:  eventType,
      raw_payload: payload as Record<string, unknown>,
      processed:   false,
    }).then(null, () => null);

    // TODO (Phase 2): for each inbound message:
    //   1. Find or create support_ticket by whatsapp_number
    //   2. Insert into support_messages (direction: inbound, channel: whatsapp)
    //   3. Send notification to staff
  }

  // Meta requires 200 OK within 5 seconds — always return success
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
