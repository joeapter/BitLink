export const REFERRAL_CAP = 5;
export const REFERRAL_BONUS_GB = 5;
export const SALES_REP_PAYOUT_AGOROT = 3000;
export const SALES_REP_CURRENCY = "ILS";
export const REFERRAL_BONUS_TOPUP_ENV = "ANNATEL_REFERRAL_BONUS_TOPUP_NAME";
export const REFERRAL_BONUS_DEFAULT_TOPUP_NAME = "PLAN_DATA_SUPP_5GB";

export function normalizeReferralCode(value?: string | null): string | null {
  const code = value?.trim();
  return code ? code.toUpperCase() : null;
}

export function generateReferralCode(prefix = "BL"): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export function formatAgorot(amountAgorot: number, currency = SALES_REP_CURRENCY): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amountAgorot / 100);
}
