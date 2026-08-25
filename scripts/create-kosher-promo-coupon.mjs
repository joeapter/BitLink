// Creates the Stripe coupon behind the Kosher+ introductory offer.
//
//   node --env-file=.env.production.local scripts/create-kosher-promo-coupon.mjs
//
// The coupon is $5.00 off for 3 months (duration: repeating). Stripe applies
// it to the first three invoices and expires it by itself, so nothing in the
// app has to remember to put the price back up to $24.99.
//
// Creating a coupon charges nobody and changes no existing subscription — it
// is inert until checkout attaches it. Safe to run; safe to re-run, since it
// uses a fixed id and reports an existing coupon rather than making a second.
//
// After it runs, put the printed id in the environment as
// STRIPE_COUPON_KOSHER_PLUS_INTRO (Vercel → project → environment variables)
// and redeploy. Until that variable is set, checkout simply charges the
// regular $24.99 — a missing coupon must never block a sale.

import Stripe from 'stripe';

const COUPON_ID = 'kosher-plus-intro-3mo';
const AMOUNT_OFF_CENTS = 500;
const DURATION_MONTHS = 3;

const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key) {
  console.error('STRIPE_SECRET_KEY is not set. Run with --env-file=.env.production.local');
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: '2026-04-22.dahlia' });
const mode = key.startsWith('sk_live') ? 'LIVE' : 'TEST';

try {
  const existing = await stripe.coupons.retrieve(COUPON_ID);
  console.log(`[${mode}] Coupon already exists — nothing to do.`);
  console.log(`  id:       ${existing.id}`);
  console.log(`  discount: ${(existing.amount_off ?? 0) / 100} ${String(existing.currency).toUpperCase()} off`);
  console.log(`  duration: ${existing.duration}${existing.duration_in_months ? ` (${existing.duration_in_months} months)` : ''}`);
  console.log(`\nSet STRIPE_COUPON_KOSHER_PLUS_INTRO=${existing.id}`);
  process.exit(0);
} catch (err) {
  if (err?.statusCode !== 404) {
    console.error('Failed to check for an existing coupon:', err?.message ?? err);
    process.exit(1);
  }
}

const coupon = await stripe.coupons.create({
  id: COUPON_ID,
  name: 'Kosher+ intro — $19.99 for 3 months',
  amount_off: AMOUNT_OFF_CENTS,
  currency: 'usd',
  duration: 'repeating',
  duration_in_months: DURATION_MONTHS,
  metadata: { bitlink_promo: 'kosher_plus_intro', plan_slug: 'kosher-plus' },
});

console.log(`[${mode}] Created coupon ${coupon.id}`);
console.log(`  $${AMOUNT_OFF_CENTS / 100} off per month for ${DURATION_MONTHS} months`);
console.log(`\nSet STRIPE_COUPON_KOSHER_PLUS_INTRO=${coupon.id}`);
