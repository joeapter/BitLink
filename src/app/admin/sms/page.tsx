import type { Metadata } from "next";
import { getAdminDb } from "@/lib/db/admin";
import { normalizeToE164 } from "@/lib/sms/send";
import { SmsConsole, type SmsRecipient, type SmsTemplate, type SmsLogRow } from "@/components/admin/SmsConsole";

export const metadata: Metadata = { title: "Admin SMS" };

export default async function AdminSmsPage() {
  const db = await getAdminDb();

  // Customers with their active/paused lines. The Israeli line number lives
  // in telecom_lines.metadata.phone_number; customers.phone is the contact
  // number from checkout (often a US number) and is only a fallback.
  const customers = db
    ? (
        await db
          .from("customers")
          .select("*")
          .is("archived_at", null)
          .order("created_at", { ascending: false })
          .limit(500)
      ).data ?? []
    : [];

  const customerIds = customers.map((c) => c.id as string);
  const lines = db && customerIds.length
    ? (
        await db
          .from("telecom_lines")
          .select("id, customer_id, status, is_kosher, metadata")
          .in("customer_id", customerIds)
          .in("status", ["active", "paused"])
      ).data ?? []
    : [];

  const lineByCustomer = new Map<
    string,
    { lineId: string; phoneNumber: string | null; status: string; isKosher: boolean }
  >();
  for (const line of lines) {
    const customerId = line.customer_id as string;
    const metadata = line.metadata as Record<string, unknown> | null;
    const phoneNumber = (metadata?.phone_number as string | undefined) ?? null;
    const existing = lineByCustomer.get(customerId);
    // Prefer an active line with a number over anything else
    if (!existing || (line.status === "active" && phoneNumber && !existing.phoneNumber)) {
      lineByCustomer.set(customerId, {
        lineId: line.id as string,
        phoneNumber,
        status: line.status as string,
        isKosher: Boolean(line.is_kosher),
      });
    }
  }

  // Who already has SMS-to-email switched on. The admin forwarding actions
  // write audit_logs rows, so the most recent add/remove per line is the
  // current state — far cheaper than an Annatel round trip per customer.
  // Caveat: only catches forwarding set up from the ADMIN side; a customer who
  // switched it on themselves at /account doesn't write an audit log.
  const lineIds = [...lineByCustomer.values()].map((l) => l.lineId);
  const forwarderLogs = db && lineIds.length
    ? (
        await db
          .from("audit_logs")
          .select("entity_id, action, metadata, created_at")
          .eq("entity_type", "telecom_line")
          .in("action", ["sms_forwarder_added", "sms_forwarder_removed"])
          .in("entity_id", lineIds)
          .order("created_at", { ascending: false })
      ).data ?? []
    : [];

  const forwardingByLine = new Map<string, string | null>();
  for (const row of forwarderLogs) {
    const lineId = row.entity_id as string;
    if (forwardingByLine.has(lineId)) continue; // ordered desc — first row wins
    const metadata = row.metadata as Record<string, unknown> | null;
    forwardingByLine.set(
      lineId,
      row.action === "sms_forwarder_added"
        ? ((metadata?.emailRecipientAddress as string | undefined) ?? null)
        : null,
    );
  }

  // Normalize to E.164 here so the sms: links the console builds are dialable
  // regardless of how the number was stored (0551234567, 972…, +972 55-…).
  const recipients: SmsRecipient[] = customers.map((customer) => {
    const line = lineByCustomer.get(customer.id as string);
    const contactPhone = (customer.phone ?? null) as string | null;
    return {
      customerId: customer.id as string,
      name: (customer.full_name ?? null) as string | null,
      email: (customer.email ?? null) as string | null,
      lineNumber: line?.phoneNumber ? normalizeToE164(line.phoneNumber) : null,
      contactPhone: contactPhone ? normalizeToE164(contactPhone) : null,
      lineStatus: line?.status ?? null,
      isKosher: line?.isKosher ?? false,
      forwardingEmail: line ? (forwardingByLine.get(line.lineId) ?? null) : null,
      referralCode: (customer.referral_code ?? null) as string | null,
      optOut: Boolean((customer as Record<string, unknown>).sms_opt_out),
    };
  });

  // Templates + log — tolerate the tables not existing yet (migration 032 is
  // applied by hand in the SQL editor; until then the page still loads).
  let migrationApplied = true;
  let templates: SmsTemplate[] = [];
  let log: SmsLogRow[] = [];
  if (db) {
    const templatesResult = await db
      .from("sms_templates")
      .select("id, name, body")
      .order("created_at", { ascending: true });
    if (templatesResult.error) {
      migrationApplied = false;
    } else {
      templates = (templatesResult.data ?? []) as SmsTemplate[];
      const logResult = await db
        .from("sms_messages")
        .select("id, to_number, body, campaign, status, error, created_at, customers(full_name)")
        .order("created_at", { ascending: false })
        .limit(50);
      log = ((logResult.data ?? []) as unknown[]).map((row) => {
        const r = row as Record<string, unknown>;
        return {
          id: r.id as string,
          toNumber: r.to_number as string,
          body: r.body as string,
          campaign: (r.campaign ?? null) as string | null,
          status: r.status as string,
          error: (r.error ?? null) as string | null,
          createdAt: r.created_at as string,
          customerName: ((r.customers as { full_name?: string | null } | null)?.full_name ?? null) as string | null,
        };
      });
    }
  }

  return (
    <SmsConsole
      recipients={recipients}
      templates={templates}
      log={log}
      migrationApplied={migrationApplied}
    />
  );
}
