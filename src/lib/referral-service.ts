import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/send";
import { buildSalesRepCommissionEmail, buildSalesRepWelcomeEmail } from "@/lib/email/templates";
import { getTelecomProvider } from "@/lib/telecom/provider.registry";
import { withProviderContext } from "@/lib/telecom/provider-context";
import {
  generateReferralCode,
  normalizeReferralCode,
  REFERRAL_BONUS_DEFAULT_TOPUP_NAME,
  REFERRAL_CAP,
  REFERRAL_BONUS_GB,
  REFERRAL_BONUS_TOPUP_ENV,
  SALES_REP_CURRENCY,
  SALES_REP_PAYOUT_AGOROT,
} from "@/lib/referrals";

type DbClient = SupabaseClient;

type SalesRepRow = {
  id: string;
  profile_id: string;
  customer_id: string | null;
  referral_code: string;
  status: string;
  payout_amount_agorot: number;
  currency: string;
  welcome_email_sent_at?: string | null;
};

type CustomerReferralRow = {
  id: string;
  user_id: string | null;
  referral_code: string | null;
  referred_by: string | null;
  full_name?: string | null;
  email?: string | null;
};

type ContactRow = {
  full_name: string | null;
  email: string | null;
};

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bitlink.co.il";

function nowIso() {
  return new Date().toISOString();
}

async function getCustomer(db: DbClient, customerId: string): Promise<CustomerReferralRow | null> {
  const { data } = await db
    .from("customers")
    .select("id, user_id, referral_code, referred_by, full_name, email")
    .eq("id", customerId)
    .maybeSingle();
  return (data as CustomerReferralRow | null) ?? null;
}

async function findSalesRepByCode(db: DbClient, referralCode: string): Promise<SalesRepRow | null> {
  const { data } = await db
    .from("sales_reps")
    .select("id, profile_id, customer_id, referral_code, status, payout_amount_agorot, currency, welcome_email_sent_at")
    .eq("referral_code", referralCode)
    .eq("status", "active")
    .maybeSingle();
  return (data as SalesRepRow | null) ?? null;
}

async function findCustomerByCode(db: DbClient, referralCode: string): Promise<CustomerReferralRow | null> {
  const { data } = await db
    .from("customers")
    .select("id, user_id, referral_code, referred_by, full_name, email")
    .eq("referral_code", referralCode)
    .maybeSingle();
  return (data as CustomerReferralRow | null) ?? null;
}

function referralLink(referralCode: string): string {
  return `${BASE_URL}/checkout?referral=${encodeURIComponent(referralCode)}`;
}

async function getProfileContact(db: DbClient, profileId: string): Promise<ContactRow | null> {
  const { data } = await db.from("profiles").select("full_name, email").eq("id", profileId).maybeSingle();
  return (data as ContactRow | null) ?? null;
}

async function getCustomerContact(db: DbClient, customerId?: string | null): Promise<ContactRow | null> {
  if (!customerId) return null;
  const { data } = await db.from("customers").select("full_name, email").eq("id", customerId).maybeSingle();
  return (data as ContactRow | null) ?? null;
}

async function sendSalesRepWelcomeNotification(
  db: DbClient,
  params: {
    salesRepId: string;
    fullName: string | null;
    email: string | null;
    referralCode: string;
    payoutAmountAgorot: number;
  },
): Promise<boolean> {
  if (!params.email) {
    await db
      .from("sales_reps")
      .update({ welcome_email_error: "missing_email", updated_at: nowIso() })
      .eq("id", params.salesRepId);
    return false;
  }

  const sent = await sendEmail({
    to: params.email,
    subject: "You're now a BitLink Sales Rep",
    html: buildSalesRepWelcomeEmail({
      fullName: params.fullName ?? "there",
      referralLink: referralLink(params.referralCode),
      payoutAmountAgorot: params.payoutAmountAgorot,
    }),
  });

  await db
    .from("sales_reps")
    .update({
      welcome_email_sent_at: sent ? nowIso() : null,
      welcome_email_error: sent ? null : "send_failed",
      updated_at: nowIso(),
    })
    .eq("id", params.salesRepId);

  return sent;
}

async function sendSalesRepCommissionNotification(
  db: DbClient,
  params: {
    commissionId: string;
    salesRep: SalesRepRow;
    referredCustomerId: string;
    amountAgorot: number;
  },
): Promise<boolean> {
  const [profile, repCustomer, referredCustomer] = await Promise.all([
    getProfileContact(db, params.salesRep.profile_id),
    getCustomerContact(db, params.salesRep.customer_id),
    getCustomerContact(db, params.referredCustomerId),
  ]);

  const email = profile?.email ?? repCustomer?.email ?? null;
  if (!email) {
    await db
      .from("sales_rep_commissions")
      .update({ notification_email_error: "missing_email", updated_at: nowIso() })
      .eq("id", params.commissionId);
    return false;
  }

  const sent = await sendEmail({
    to: email,
    subject: "New BitLink referral commission",
    html: buildSalesRepCommissionEmail({
      fullName: profile?.full_name ?? repCustomer?.full_name ?? "there",
      referredFullName: referredCustomer?.full_name ?? referredCustomer?.email ?? "Your referral",
      amountAgorot: params.amountAgorot,
      accountUrl: `${BASE_URL}/account/referrals`,
    }),
  });

  await db
    .from("sales_rep_commissions")
    .update({
      notification_email_sent_at: sent ? nowIso() : null,
      notification_email_error: sent ? null : "send_failed",
      updated_at: nowIso(),
    })
    .eq("id", params.commissionId);

  return sent;
}

export async function ensureCustomerReferralCode(db: DbClient, customerId: string): Promise<string | null> {
  const customer = await getCustomer(db, customerId);
  const existing = normalizeReferralCode(customer?.referral_code);
  if (existing) return existing;

  for (let attempt = 0; attempt < 3; attempt++) {
    const referralCode = generateReferralCode();
    const { data, error } = await db
      .from("customers")
      .update({ referral_code: referralCode, updated_at: nowIso() })
      .eq("id", customerId)
      .select("referral_code")
      .maybeSingle();

    if (!error && data?.referral_code) return data.referral_code as string;
  }

  return null;
}

export async function makeCustomerSalesRep(
  db: DbClient,
  params: {
    customerId: string;
    createdBy: string;
  },
): Promise<{ salesRepId: string | null; referralCode?: string; emailSent?: boolean; error?: string }> {
  const { data: customer } = await db
    .from("customers")
    .select("id, user_id, referral_code, full_name, email")
    .eq("id", params.customerId)
    .maybeSingle();

  const userId = (customer?.user_id ?? null) as string | null;
  if (!customer || !userId) {
    return { salesRepId: null, error: "Customer needs a BitLink login before becoming a sales rep." };
  }

  const referralCode =
    normalizeReferralCode(customer.referral_code as string | null) ??
    (await ensureCustomerReferralCode(db, params.customerId)) ??
    generateReferralCode("REP");

  const { data: existingRep } = await db
    .from("sales_reps")
    .select("id, status, welcome_email_sent_at")
    .eq("profile_id", userId)
    .maybeSingle();

  const shouldSendWelcome = existingRep?.status !== "active" || !existingRep?.welcome_email_sent_at;

  const { data, error } = await db
    .from("sales_reps")
    .upsert(
      {
        profile_id: userId,
        customer_id: params.customerId,
        referral_code: referralCode,
        status: "active",
        payout_amount_agorot: SALES_REP_PAYOUT_AGOROT,
        currency: SALES_REP_CURRENCY,
        created_by: params.createdBy,
        updated_at: nowIso(),
      },
      { onConflict: "profile_id", ignoreDuplicates: false },
    )
    .select("id")
    .maybeSingle();

  if (error) return { salesRepId: null, error: error.message };

  const salesRepId = (data?.id as string | undefined) ?? (existingRep?.id as string | undefined) ?? null;

  await db.from("audit_logs").insert({
    actor_user_id: params.createdBy,
    action: "sales_rep_enabled",
    entity_type: "customer",
    entity_id: params.customerId,
    metadata: { salesRepId, referralCode },
  });

  const emailSent = salesRepId && shouldSendWelcome
    ? await sendSalesRepWelcomeNotification(db, {
        salesRepId,
        fullName: (customer.full_name as string | null) ?? null,
        email: (customer.email as string | null) ?? null,
        referralCode,
        payoutAmountAgorot: SALES_REP_PAYOUT_AGOROT,
      })
    : undefined;

  return { salesRepId, referralCode, emailSent };
}

export async function recordReferralForLine(
  db: DbClient,
  lineId: string,
): Promise<{ referralId?: string; salesRepId?: string; skipped?: string }> {
  const { data: line } = await db
    .from("telecom_lines")
    .select("id, customer_id")
    .eq("id", lineId)
    .maybeSingle();

  const referredCustomerId = (line?.customer_id ?? null) as string | null;
  if (!referredCustomerId) return { skipped: "line_without_customer" };

  return recordReferralForCustomerLine(db, { referredCustomerId, referredLineId: lineId });
}

export async function recordReferralForCustomerLine(
  db: DbClient,
  params: {
    referredCustomerId: string;
    referredLineId: string;
    referralCode?: string | null;
  },
): Promise<{ referralId?: string; salesRepId?: string; skipped?: string }> {
  const referredCustomer = await getCustomer(db, params.referredCustomerId);
  if (!referredCustomer) return { skipped: "customer_not_found" };

  const referralCode = normalizeReferralCode(params.referralCode) ?? normalizeReferralCode(referredCustomer.referred_by);
  if (!referralCode) return { skipped: "no_referral_code" };

  const salesRep = await findSalesRepByCode(db, referralCode);
  const referrerCustomer = salesRep ? null : await findCustomerByCode(db, referralCode);
  const referrerCustomerId = salesRep?.customer_id ?? referrerCustomer?.id ?? null;

  if (!salesRep && !referrerCustomerId) return { skipped: "referral_code_not_found" };
  if (referrerCustomerId === params.referredCustomerId) return { skipped: "self_referral" };
  if (salesRep?.profile_id && salesRep.profile_id === referredCustomer.user_id) return { skipped: "self_referral" };

  const activeAt = nowIso();
  const referralPatch = {
    referrer_customer_id: referrerCustomerId,
    referred_customer_id: params.referredCustomerId,
    referred_line_id: params.referredLineId,
    sales_rep_id: salesRep?.id ?? null,
    referral_code: referralCode,
    status: "active",
    reward_type: "data_gb",
    reward_value_cents: null,
    reward_value_agorot: salesRep ? salesRep.payout_amount_agorot : null,
    activated_at: activeAt,
    updated_at: activeAt,
  };

  const { data: existingReferral } = await db
    .from("referrals")
    .select("id")
    .eq("referred_line_id", params.referredLineId)
    .maybeSingle();

  const referralResult = existingReferral?.id
    ? await db
        .from("referrals")
        .update(referralPatch)
        .eq("id", existingReferral.id)
        .select("id")
        .maybeSingle()
    : await db
        .from("referrals")
        .insert({ ...referralPatch, created_at: activeAt })
        .select("id")
        .maybeSingle();

  const referralId = (referralResult.data?.id as string | undefined) ?? existingReferral?.id;

  if (salesRep?.id && referralId) {
    const { data: existingCommission } = await db
      .from("sales_rep_commissions")
      .select("id, notification_email_sent_at")
      .eq("sales_rep_id", salesRep.id)
      .eq("referred_line_id", params.referredLineId)
      .maybeSingle();

    if (existingCommission?.id) {
      await db
        .from("sales_rep_commissions")
        .update({
          referral_id: referralId,
          referred_customer_id: params.referredCustomerId,
          amount_agorot: salesRep.payout_amount_agorot,
          currency: salesRep.currency || SALES_REP_CURRENCY,
          updated_at: activeAt,
        })
        .eq("id", existingCommission.id);

      if (!existingCommission.notification_email_sent_at) {
        await sendSalesRepCommissionNotification(db, {
          commissionId: existingCommission.id as string,
          salesRep,
          referredCustomerId: params.referredCustomerId,
          amountAgorot: salesRep.payout_amount_agorot,
        });
      }
    } else {
      const { data: commission } = await db
        .from("sales_rep_commissions")
        .insert({
          sales_rep_id: salesRep.id,
          referral_id: referralId,
          referred_customer_id: params.referredCustomerId,
          referred_line_id: params.referredLineId,
          amount_agorot: salesRep.payout_amount_agorot,
          currency: salesRep.currency || SALES_REP_CURRENCY,
          status: "pending",
          earned_at: activeAt,
        })
        .select("id")
        .maybeSingle();

      if (commission?.id) {
        await sendSalesRepCommissionNotification(db, {
          commissionId: commission.id as string,
          salesRep,
          referredCustomerId: params.referredCustomerId,
          amountAgorot: salesRep.payout_amount_agorot,
        });
      }
    }
  }

  return {
    referralId,
    salesRepId: salesRep?.id,
  };
}

function firstOfMonthIso(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function getReferralBonusTopupName(): string {
  return process.env[REFERRAL_BONUS_TOPUP_ENV]?.trim() || REFERRAL_BONUS_DEFAULT_TOPUP_NAME;
}

type BonusRunResult = {
  month: string;
  topupName: string | null;
  applied: number;
  skipped: number;
  failed: number;
};

export async function processMonthlyReferralBonuses(db: DbClient, date = new Date()): Promise<BonusRunResult> {
  const grantMonth = firstOfMonthIso(date);
  const topupName = getReferralBonusTopupName();
  const result: BonusRunResult = { month: grantMonth, topupName, applied: 0, skipped: 0, failed: 0 };

  const { data: referrals } = await db
    .from("referrals")
    .select("id, sales_rep_id, referrer_customer_id, referred_line_id, activated_at, created_at")
    .eq("status", "active")
    .not("referrer_customer_id", "is", null)
    .not("referred_line_id", "is", null)
    .order("activated_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  type MonthlyReferralRow = NonNullable<typeof referrals>[number];
  const referralsByCustomer = new Map<string, MonthlyReferralRow[]>();
  for (const referral of referrals ?? []) {
    const referrerCustomerId = referral.referrer_customer_id as string | null;
    if (!referrerCustomerId) continue;
    const existing = referralsByCustomer.get(referrerCustomerId) ?? [];
    existing.push(referral);
    referralsByCustomer.set(referrerCustomerId, existing);
  }

  for (const [referrerCustomerId, customerReferrals] of referralsByCustomer.entries()) {
    const { data: beneficiaryLine } = await db
      .from("telecom_lines")
      .select("id, provider_line_id, is_kosher")
      .eq("customer_id", referrerCustomerId)
      .eq("status", "active")
      .eq("is_kosher", false)
      .not("provider_line_id", "is", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!beneficiaryLine?.id || !beneficiaryLine.provider_line_id) continue;

    const activeReferrals: Array<{ referredLineId: string; salesRepId: string | null }> = [];
    const seenReferredLineIds = new Set<string>();
    for (const referral of customerReferrals) {
      const referredLineId = referral.referred_line_id as string | null;
      if (!referredLineId) continue;
      if (seenReferredLineIds.has(referredLineId)) continue;
      seenReferredLineIds.add(referredLineId);

      const { data: referredLine } = await db
        .from("telecom_lines")
        .select("id, status")
        .eq("id", referredLineId)
        .maybeSingle();

      if (referredLine?.status === "active") {
        activeReferrals.push({
          referredLineId,
          salesRepId: (referral.sales_rep_id ?? null) as string | null,
        });
      }
      if (activeReferrals.length >= REFERRAL_CAP) break;
    }

    for (const activeReferral of activeReferrals) {
      const referredLineId = activeReferral.referredLineId;

      const { data: existingGrant } = await db
        .from("referral_bonus_grants")
        .select("id, status")
        .eq("beneficiary_customer_id", referrerCustomerId)
        .eq("beneficiary_line_id", beneficiaryLine.id)
        .eq("referred_line_id", referredLineId)
        .eq("grant_month", grantMonth)
        .maybeSingle();

      if (existingGrant?.status === "applied") {
        result.skipped++;
        continue;
      }

      const grantPatch = {
        sales_rep_id: activeReferral.salesRepId,
        referrer_customer_id: referrerCustomerId,
        beneficiary_customer_id: referrerCustomerId,
        beneficiary_line_id: beneficiaryLine.id as string,
        referred_line_id: referredLineId,
        grant_month: grantMonth,
        bonus_gb: REFERRAL_BONUS_GB,
        provider_line_id: beneficiaryLine.provider_line_id as string,
        provider_topup_name: topupName,
        updated_at: nowIso(),
      };

      const grantId = existingGrant?.id as string | undefined;
      const pendingGrant = {
        ...grantPatch,
        status: "pending",
        error: null,
      };
      if (grantId) {
        await db.from("referral_bonus_grants").update(pendingGrant).eq("id", grantId);
      } else {
        await db.from("referral_bonus_grants").insert(pendingGrant);
      }

      try {
        const provider = getTelecomProvider();
        await withProviderContext(
          {
            correlationId: crypto.randomUUID(),
            telecomLineId: beneficiaryLine.id as string,
          },
          () => provider.addTopup(beneficiaryLine.provider_line_id as string, topupName),
        );

        await db
          .from("referral_bonus_grants")
          .update({
            status: "applied",
            error: null,
            applied_at: nowIso(),
            updated_at: nowIso(),
          })
          .eq("beneficiary_customer_id", referrerCustomerId)
          .eq("beneficiary_line_id", beneficiaryLine.id)
          .eq("referred_line_id", referredLineId)
          .eq("grant_month", grantMonth);
        result.applied++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await db
          .from("referral_bonus_grants")
          .update({
            status: "failed",
            error: message,
            updated_at: nowIso(),
          })
          .eq("beneficiary_customer_id", referrerCustomerId)
          .eq("beneficiary_line_id", beneficiaryLine.id)
          .eq("referred_line_id", referredLineId)
          .eq("grant_month", grantMonth);
        result.failed++;
      }
    }
  }

  return result;
}
