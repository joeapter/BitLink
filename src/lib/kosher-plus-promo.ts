// Kosher+ introductory promotion.
//
// The offer: Kosher+ is $24.99/month and includes a US, Canada, or UK local
// number (normally a $9.99/month add-on). The first three months are $19.99.
// After the intro period the price returns to $24.99 and the number STAYS
// included — there is no second charge to start later and nothing to cancel.
//
// Two independent mechanisms make that work, and they are deliberately kept
// apart:
//
//   1. The included number is a property of the PLAN (plans.ts →
//      includesIntlNumber). It has no end date. Even after this promo is over,
//      Kosher+ still ships with the number.
//
//   2. The $5 discount is a Stripe coupon with duration=repeating,
//      duration_in_months=3. Stripe applies and expires it on its own, so
//      nothing here has to remember to put the price back up. Ending the promo
//      means new customers stop getting the coupon; customers already inside
//      their three months keep it until Stripe expires it naturally.
//
// If the coupon is not configured, checkout proceeds at the regular price
// rather than failing — a missing env var must never block a sale.

import { getPlan } from '@/lib/plans';

export const KOSHER_PLUS_PROMO = {
  planSlug: 'kosher-plus' as const,
  introPriceCents: 1999,
  regularPriceCents: 2499,
  months: 3,
  /**
   * Last day new customers can start on the intro price. Runs through Sukkot
   * so the window covers the start of the Israeli school year and the chagim,
   * which is when kosher phones for children are actually bought. Change this
   * date to extend or end the promo — nothing else needs editing.
   */
  endsAt: new Date('2026-10-21T00:00:00Z'),
};

export const KOSHER_PLUS_PROMO_COUPON_ENV = 'STRIPE_COUPON_KOSHER_PLUS_INTRO';

/** Discount off the monthly price, in cents, for the intro period. */
export const kosherPlusPromoDiscountCents =
  KOSHER_PLUS_PROMO.regularPriceCents - KOSHER_PLUS_PROMO.introPriceCents;

export function isKosherPlusPromoWindowOpen(now: Date = new Date()): boolean {
  return now < KOSHER_PLUS_PROMO.endsAt;
}

/**
 * The Stripe coupon to attach at checkout, or null when the promo shouldn't
 * apply — wrong plan, window closed, or no coupon configured.
 *
 * Server-only: reads the coupon id from the environment so the id is never
 * shipped to the browser.
 */
export function kosherPlusPromoCouponId(
  planSlug: string,
  now: Date = new Date(),
): string | null {
  if (planSlug !== KOSHER_PLUS_PROMO.planSlug) return null;
  if (!isKosherPlusPromoWindowOpen(now)) return null;
  return process.env[KOSHER_PLUS_PROMO_COUPON_ENV]?.trim() || null;
}

/**
 * Whether to SHOW the intro pricing in marketing copy and checkout.
 *
 * Deliberately gated on the coupon EXISTING, not just on the date window: the
 * discount is only real if checkout can actually attach the coupon, and a page
 * advertising $19.99 while Stripe charges $24.99 is the worst possible failure
 * here. One condition drives both the promise and the price.
 *
 * Server-only — it reads the coupon id. Client components must receive the
 * result as a prop rather than calling this directly.
 */
export function showKosherPlusPromo(planSlug: string, now: Date = new Date()): boolean {
  return kosherPlusPromoCouponId(planSlug, now) !== null;
}

/** True when this plan ships with the international number included. */
export function planIncludesIntlNumber(planSlug: string): boolean {
  return getPlan(planSlug).includesIntlNumber === true;
}
