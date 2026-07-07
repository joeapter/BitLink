// Sales rep notification emails.
// These run outside admin/provisioning requests so slow SMTP never makes UI
// actions look stuck.

import { inngest } from "@/inngest/client";
import { sendEmail } from "@/lib/email/send";
import { buildSalesRepCommissionEmail, buildSalesRepWelcomeEmail } from "@/lib/email/templates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

const log = logger.child({ fn: "notify-sales-rep" });
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bitlink.co.il";

type Contact = {
  full_name: string | null;
  email: string | null;
};

function nowIso() {
  return new Date().toISOString();
}

function referralLink(referralCode: string): string {
  return `${BASE_URL}/checkout?referral=${encodeURIComponent(referralCode)}`;
}

async function getProfileContact(profileId: string): Promise<Contact | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const { data } = await admin.from("profiles").select("full_name, email").eq("id", profileId).maybeSingle();
  return (data as Contact | null) ?? null;
}

async function getCustomerContact(customerId?: string | null): Promise<Contact | null> {
  if (!customerId) return null;
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const { data } = await admin.from("customers").select("full_name, email").eq("id", customerId).maybeSingle();
  return (data as Contact | null) ?? null;
}

export const notifySalesRepWelcome = inngest.createFunction(
  {
    id: "notify-sales-rep-welcome",
    retries: 3,
    concurrency: { limit: 1, key: "event.data.salesRepId" },
  },
  { event: "sales-rep/welcome.requested" },
  async ({ event, step }) => {
    const { salesRepId } = event.data as { salesRepId: string };
    const admin = createSupabaseAdminClient();
    if (!admin) return { skipped: true, reason: "no_admin_client" };

    const salesRep = await step.run("fetch-sales-rep", async () => {
      const { data } = await admin
        .from("sales_reps")
        .select("id, profile_id, customer_id, referral_code, payout_amount_agorot, welcome_email_sent_at")
        .eq("id", salesRepId)
        .maybeSingle();
      return data;
    });

    if (!salesRep) return { skipped: true, reason: "sales_rep_not_found" };
    if (salesRep.welcome_email_sent_at) return { skipped: true, reason: "already_sent" };

    const [profile, customer] = await step.run("fetch-contact", async () => {
      return Promise.all([
        getProfileContact(salesRep.profile_id as string),
        getCustomerContact(salesRep.customer_id as string | null),
      ]);
    });

    const email = profile?.email ?? customer?.email ?? null;
    if (!email) {
      await step.run("stamp-missing-email", async () => {
        await admin
          .from("sales_reps")
          .update({ welcome_email_error: "missing_email", updated_at: nowIso() })
          .eq("id", salesRepId);
      });
      return { skipped: true, reason: "missing_email" };
    }

    const sent = await step.run("send-email", async () => {
      return sendEmail({
        to: email,
        subject: "You're now a BitLink Sales Rep",
        html: buildSalesRepWelcomeEmail({
          fullName: profile?.full_name ?? customer?.full_name ?? "there",
          referralLink: referralLink(salesRep.referral_code as string),
          payoutAmountAgorot: Number(salesRep.payout_amount_agorot ?? 3000),
        }),
      });
    });

    await step.run("stamp-result", async () => {
      await admin
        .from("sales_reps")
        .update({
          welcome_email_sent_at: sent ? nowIso() : null,
          welcome_email_error: sent ? null : "send_failed",
          updated_at: nowIso(),
        })
        .eq("id", salesRepId);
    });

    log.info({ salesRepId, email, sent }, "Sales rep welcome notification complete");
    return { sent };
  },
);

export const notifySalesRepCommission = inngest.createFunction(
  {
    id: "notify-sales-rep-commission",
    retries: 3,
    concurrency: { limit: 1, key: "event.data.commissionId" },
  },
  { event: "sales-rep/commission.created" },
  async ({ event, step }) => {
    const { commissionId } = event.data as { commissionId: string };
    const admin = createSupabaseAdminClient();
    if (!admin) return { skipped: true, reason: "no_admin_client" };

    const commission = await step.run("fetch-commission", async () => {
      const { data } = await admin
        .from("sales_rep_commissions")
        .select("id, sales_rep_id, referred_customer_id, amount_agorot, notification_email_sent_at")
        .eq("id", commissionId)
        .maybeSingle();
      return data;
    });

    if (!commission) return { skipped: true, reason: "commission_not_found" };
    if (commission.notification_email_sent_at) return { skipped: true, reason: "already_sent" };

    const salesRep = await step.run("fetch-sales-rep", async () => {
      const { data } = await admin
        .from("sales_reps")
        .select("id, profile_id, customer_id")
        .eq("id", commission.sales_rep_id as string)
        .maybeSingle();
      return data;
    });

    if (!salesRep) return { skipped: true, reason: "sales_rep_not_found" };

    const [profile, repCustomer, referredCustomer] = await step.run("fetch-contacts", async () => {
      return Promise.all([
        getProfileContact(salesRep.profile_id as string),
        getCustomerContact(salesRep.customer_id as string | null),
        getCustomerContact(commission.referred_customer_id as string | null),
      ]);
    });

    const email = profile?.email ?? repCustomer?.email ?? null;
    if (!email) {
      await step.run("stamp-missing-email", async () => {
        await admin
          .from("sales_rep_commissions")
          .update({ notification_email_error: "missing_email", updated_at: nowIso() })
          .eq("id", commissionId);
      });
      return { skipped: true, reason: "missing_email" };
    }

    const sent = await step.run("send-email", async () => {
      return sendEmail({
        to: email,
        subject: "New BitLink referral commission",
        html: buildSalesRepCommissionEmail({
          fullName: profile?.full_name ?? repCustomer?.full_name ?? "there",
          referredFullName: referredCustomer?.full_name ?? referredCustomer?.email ?? "Your referral",
          amountAgorot: Number(commission.amount_agorot ?? 3000),
          accountUrl: `${BASE_URL}/account/referrals`,
        }),
      });
    });

    await step.run("stamp-result", async () => {
      await admin
        .from("sales_rep_commissions")
        .update({
          notification_email_sent_at: sent ? nowIso() : null,
          notification_email_error: sent ? null : "send_failed",
          updated_at: nowIso(),
        })
        .eq("id", commissionId);
    });

    log.info({ commissionId, email, sent }, "Sales rep commission notification complete");
    return { sent };
  },
);
