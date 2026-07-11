// BitLink — Stripe topup price seed script.
//
// Creates a product + recurring monthly price for each catalog entry in
// src/lib/topups.ts. The recurring price is used directly as a subscription
// item for admin "paid + monthly" grants; one-time purchases (self-serve
// buy-now, admin "paid + once") reuse the same product via inline price_data
// on an invoice item instead of this price object.
//
// Idempotent: reuses existing product/price if already present.
//
// Run:
//   node --env-file=.env.local scripts/seed-stripe-topups.mjs

import Stripe from 'stripe';

const { STRIPE_SECRET_KEY } = process.env;
if (!STRIPE_SECRET_KEY) {
  console.error('ERROR: STRIPE_SECRET_KEY is not set. Run with: node --env-file=.env.local scripts/seed-stripe-topups.mjs');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2026-04-22.dahlia' });

const CATALOG = [
  { id: 'data-5gb', name: '+5GB Data', priceCents: 599, envKey: 'STRIPE_PRICE_TOPUP_DATA_5GB' },
  { id: 'data-10gb', name: '+10GB Data', priceCents: 999, envKey: 'STRIPE_PRICE_TOPUP_DATA_10GB' },
  { id: 'data-20gb', name: '+20GB Data', priceCents: 1799, envKey: 'STRIPE_PRICE_TOPUP_DATA_20GB' },
  { id: 'data-50gb', name: '+50GB Data', priceCents: 3499, envKey: 'STRIPE_PRICE_TOPUP_DATA_50GB' },
  { id: 'usa-ca-120min', name: '+120 Min USA/CA', priceCents: 1499, envKey: 'STRIPE_PRICE_TOPUP_USA_CA_120MIN' },
  { id: 'local-1000min', name: '+1,000 Local Min', priceCents: 999, envKey: 'STRIPE_PRICE_TOPUP_LOCAL_1000MIN' },
];

async function main() {
  const isLive = !STRIPE_SECRET_KEY.startsWith('sk_test_');
  console.log(`BitLink — Stripe topup seed (${isLive ? 'LIVE MODE ⚠️' : 'test mode'})\n`);

  const results = [];

  for (const entry of CATALOG) {
    const existingProducts = await stripe.products.search({
      query: `metadata['topup_id']:'${entry.id}'`,
      limit: 1,
    });

    let product;
    if (existingProducts.data.length > 0) {
      product = existingProducts.data[0];
      console.log(`product  reused   ${product.name} (${product.id})`);
    } else {
      product = await stripe.products.create({
        name: `Topup: ${entry.name}`,
        description: `${entry.name} — one-time purchase or recurring monthly gift.`,
        metadata: { topup_id: entry.id, source: 'bitlink_seed' },
      });
      console.log(`product  created  ${product.name} (${product.id})`);
    }

    const prices = await stripe.prices.list({ product: product.id, active: true, type: 'recurring', limit: 5 });
    const match = prices.data.find((p) => p.unit_amount === entry.priceCents);
    let price;

    if (match) {
      price = match;
      console.log(`price    reused   $${(price.unit_amount / 100).toFixed(2)}/mo (${price.id})`);
    } else {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: entry.priceCents,
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: { topup_id: entry.id, source: 'bitlink_seed' },
      });
      console.log(`price    created  $${(price.unit_amount / 100).toFixed(2)}/mo (${price.id})`);
    }

    results.push({ envKey: entry.envKey, priceId: price.id });
    console.log('');
  }

  console.log('Env vars:');
  for (const r of results) console.log(`${r.envKey}=${r.priceId}`);

  console.log('\nAdd to Vercel:');
  for (const r of results) {
    console.log(`  echo "${r.priceId}" | vercel env add ${r.envKey} production`);
  }
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
