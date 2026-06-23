// BitLink — Stripe add-on price seed script.
//
// Creates the US/Canada/UK local number add-on product and recurring price.
// Idempotent: reuses existing product/price if already present.
//
// Run:
//   node --env-file=.env.local scripts/seed-stripe-addon.mjs

import Stripe from 'stripe';

const { STRIPE_SECRET_KEY } = process.env;
if (!STRIPE_SECRET_KEY) {
  console.error('ERROR: STRIPE_SECRET_KEY is not set. Run with: node --env-file=.env.local scripts/seed-stripe-addon.mjs');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2026-04-22.dahlia' });

async function main() {
  const isLive = !STRIPE_SECRET_KEY.startsWith('sk_test_');
  console.log(`BitLink — Stripe add-on seed (${isLive ? 'LIVE MODE ⚠️' : 'test mode'})\n`);

  // ── Find or create product ───────────────────────────────────────────────
  const existing = await stripe.products.search({
    query: `metadata['addon_id']:'intl_number'`,
    limit: 1,
  });

  let product;
  if (existing.data.length > 0) {
    product = existing.data[0];
    console.log(`product  reused   ${product.name} (${product.id})`);
  } else {
    product = await stripe.products.create({
      name: 'US / Canada / UK local number',
      description: 'Local number add-on — lets family call you without international dialing.',
      metadata: { addon_id: 'intl_number', source: 'bitlink_seed' },
    });
    console.log(`product  created  ${product.name} (${product.id})`);
  }

  // ── Find or create $9.99/mo recurring price ──────────────────────────────
  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
    type: 'recurring',
    limit: 5,
  });

  const TARGET_CENTS = 999;
  const match = prices.data.find((p) => p.unit_amount === TARGET_CENTS);
  let price;

  if (match) {
    price = match;
    console.log(`price    reused   $${(price.unit_amount / 100).toFixed(2)}/mo (${price.id})`);
  } else {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: TARGET_CENTS,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { addon_id: 'intl_number', source: 'bitlink_seed' },
    });
    console.log(`price    created  $${(price.unit_amount / 100).toFixed(2)}/mo (${price.id})`);
  }

  console.log(`\nSTRIPE_PRICE_US_CANADA_ADDON=${price.id}`);
  console.log(`\nAdd to Vercel:\n  echo "${price.id}" | vercel env add STRIPE_PRICE_US_CANADA_ADDON production`);
  console.log(`  echo "${price.id}" | vercel env add STRIPE_PRICE_US_CANADA_ADDON development`);
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
