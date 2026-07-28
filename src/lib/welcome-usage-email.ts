// First-usage welcome email.
//
// Sent once a line records its FIRST real network usage (a CDR row) — not at
// signup, not at activation. Gating on real usage instead of provisioning
// status means this lands right when the customer actually starts using
// their line, which for an eSIM set up before landing can be days after
// activation. Checked on every CDR/FTP pull (ingest-cdrs).
//
// Idempotent per line via telecom_lines.metadata.welcome_usage_email_sent_at
// — once set, a line is never rechecked.

import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/send";
import { buildFirstUsageWelcomeEmail } from "@/lib/email/templates";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "welcome-usage-email" });

export type WelcomeUsageEmailRunResult = {
  checked: number;
  sent: number;
  errors: number;
};

export async function processFirstUsageWelcomeEmails(admin: SupabaseClient): Promise<WelcomeUsageEmailRunResult> {
  const result: WelcomeUsageEmailRunResult = { checked: 0, sent: 0, errors: 0 };

  // Active lines that haven't been welcomed yet.
  const { data: candidateLines } = await admin
    .from("telecom_lines")
    .select("id, customer_id")
    .eq("status", "active")
    .is("metadata->>welcome_usage_email_sent_at", null);

  if (!candidateLines?.length) return result;
  result.checked = candidateLines.length;

  const lineIds = candidateLines.map((l) => l.id);

  // Which of those now have at least one CDR row — i.e. real usage happened.
  const { data: usageRows } = await admin
    .from("cdr_records")
    .select("telecom_line_id")
    .in("telecom_line_id", lineIds);

  const linesWithUsage = new Set((usageRows ?? []).map((r) => r.telecom_line_id as string));
  if (!linesWithUsage.size) return result;

  const customerIds = [...new Set(candidateLines.filter((l) => linesWithUsage.has(l.id)).map((l) => l.customer_id).filter(Boolean))] as string[];
  const { data: customerRows } = customerIds.length
    ? await admin.from("customers").select("id, full_name, email").in("id", customerIds)
    : { data: [] };
  const customersById = new Map((customerRows ?? []).map((c) => [c.id, c]));

  for (const line of candidateLines) {
    if (!linesWithUsage.has(line.id)) continue;

    const customer = line.customer_id ? customersById.get(line.customer_id) : null;
    const now = new Date().toISOString();

    try {
      if (customer?.email) {
        await sendEmail({
          to: customer.email,
          subject: "You're connected!",
          html: buildFirstUsageWelcomeEmail({ fullName: customer.full_name ?? "" }),
        });
        result.sent++;
      }

      // Stamp regardless of whether an email was actually sent (e.g. no
      // email on file) — this is a one-shot welcome, not a retry queue.
      const { data: fresh } = await admin.from("telecom_lines").select("metadata").eq("id", line.id).single();
      await admin
        .from("telecom_lines")
        .update({
          metadata: { ...((fresh?.metadata ?? {}) as object), welcome_usage_email_sent_at: now } as never,
          updated_at: now,
        })
        .eq("id", line.id);
    } catch (err) {
      result.errors++;
      log.error({ lineId: line.id, error: err instanceof Error ? err.message : String(err) }, "Failed to send first-usage welcome email");
    }
  }

  log.info(result, "First-usage welcome email run complete");
  return result;
}
