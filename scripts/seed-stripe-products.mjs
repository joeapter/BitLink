// BitLink — Stripe product + price seed script.
//
// Creates Stripe products and recurring monthly prices for all BitLink plans.
// Idempotent: existing products/prices are reused, not duplicated.
// Also syncs stripe_price_id into the Supabase plans table.
//
// Run:
//   node --env-file=.env.local scripts/seed-stripe-products.mjs
//
// After running, the plans table will have stripe_price_id populated.
// The checkout flow reads price IDs from the DB — no env vars required.
//
// ─────────────────────────────────────────────────────────────────────────────
// Local testing with Stripe CLI (after seeding):
//
//   1. Terminal 1 — Next.js dev server:
//        npm run dev
//
//   2. Terminal 2 — Inngest dev server:
//        npm run inngest:dev
//
//   3. Terminal 3 — Stripe CLI webhook forwarding:
//        stripe listen --forward-to localhost:3000/api/webhooks/stripe
//
//   4. Test checkout creation (copy the URL from the response):
//        curl -s -X POST http://localhost:3000/api/stripe/create-checkout-session \
//          -H "Content-Type: application/json" \
//          -d '{"planSlug":"israel-plus","fullName":"Test User","email":"test@example.com","phone":"+15551234567","isKosher":false,"isEsim":false}' \
//          | jq .
//
//   5. Open the returned URL in a browser, complete checkout with Stripe test card:
//        Card: 4242 4242 4242 4242  Exp: 12/34  CVC: 123
//
//   6. Watch Next.js logs for:
//        INFO: Stripe event received  (type: checkout.session.completed)
//        INFO: Subscriber created, telecom line drafted, provisioning job queued
//        INFO: Provisioning job dispatched to Inngest
//        INFO: Provision line starting
//        INFO: Stale job reconciliation complete
// ─────────────────────────────────────────────────────────────────────────────

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const { STRIPE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!STRIPE_SECRET_KEY) {
  console.error('ERROR: STRIPE_SECRET_KEY is not set. Run with: node --env-file=.env.local scripts/seed-stripe-products.mjs');
  process.exit(1);
}
if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2026-04-22.dahlia' });
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PLANS = [
  {
    slug: 'israel-basic',
    name: 'Israel Basic',
    description: 'Simple monthly Israeli service for everyday calling and connectivity.',
    priceCents: 3499,
    sortOrder: 0,
  },
  {
    slug: 'israel-plus',
    name: 'Israel Plus',
    description: 'Includes outgoing calls to USA, Canada, UK, and Australia — 200 minutes/month.',
    priceCents: 4999,
    sortOrder: 1,
  },
  {
    slug: 'data-plus',
    name: 'Data Plus',
    description: 'More data, more flexibility, and international calling included.',
    priceCents: 5999,
    sortOrder: 2,
  },
  {
    slug: 'unlimited-data-plus',
    name: 'Unlimited Data Plus',
    description: 'Unlimited-feeling data experience with international calling included.',
    priceCents: 7999,
    sortOrder: 3,
  },
];

async function seedPlan(plan) {
  // ── Find or create Stripe product ───────────────────────────────────────
  const existingProducts = await stripe.products.search({
    query: `metadata['plan_slug']:'${plan.slug}'`,
    limit: 1,
  });

  let product;
  if (existingProducts.data.length > 0) {
    product = existingProducts.data[0];
    console.log(`  product  reused   ${product.name} (${product.id})`);
  } else {
    product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: { plan_slug: plan.slug, source: 'bitlink_seed' },
    });
    console.log(`  product  created  ${product.name} (${product.id})`);
  }

  // ── Find or create recurring monthly price ───────────────────────────────
  const existingPrices = await stripe.prices.list({
    product: product.id,
    active: true,
    type: 'recurring',
    limit: 5,
  });

  // Prefer a price at the exact expected amount; fall back to first active price.
  const matchingPrice = existingPrices.data.find((p) => p.unit_amount === plan.priceCents);
  let price;

  if (matchingPrice) {
    price = matchingPrice;
    console.log(`  price    reused   $${(price.unit_amount / 100).toFixed(2)}/mo (${price.id})`);
  } else if (existingPrices.data.length > 0) {
    price = existingPrices.data[0];
    console.log(`  price    reused   $${(price.unit_amount / 100).toFixed(2)}/mo (${price.id}) [amount differs from config — update priceCents if needed]`);
  } else {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.priceCents,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan_slug: plan.slug, source: 'bitlink_seed' },
    });
    console.log(`  price    created  $${(price.unit_amount / 100).toFixed(2)}/mo (${price.id})`);
  }

  // ── Upsert plan row in Supabase ──────────────────────────────────────────
  const { error } = await supabase
    .from('plans')
    .upsert(
      {
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        monthly_price_cents: plan.priceCents,
        currency: 'usd',
        stripe_price_id: price.id,
        active: true,
        features: [],
        sort_order: plan.sortOrder,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'slug', ignoreDuplicates: false },
    );

  if (error) {
    console.error(`  supabase ERROR: ${error.message}`);
  } else {
    console.log(`  supabase plans.${plan.slug}.stripe_price_id = ${price.id}`);
  }

  return { plan, productId: product.id, priceId: price.id };
}

async function main() {
  const isLive = !STRIPE_SECRET_KEY.startsWith('sk_test_');
  console.log(`BitLink — Stripe seed (${isLive ? 'LIVE MODE' : 'test mode'})\n`);

  if (isLive) {
    console.warn('⚠  LIVE MODE DETECTED. Prices created here will be charged to real customers.\n');
  }

  const results = [];
  for (const plan of PLANS) {
    console.log(`[${plan.slug}]`);
    const result = await seedPlan(plan);
    results.push(result);
    console.log('');
  }

  console.log('=== Seed complete ===');
  console.log('stripe_price_id values are now stored in the Supabase plans table.');
  console.log('The checkout flow reads price IDs from the DB — no additional env vars needed.\n');

  console.log('=== Stripe price IDs (for reference / legacy env var support) ===');
  const envKeyMap = {
    'israel-basic': 'STRIPE_PRICE_ISRAEL_BASIC',
    'israel-plus': 'STRIPE_PRICE_ISRAEL_PLUS',
    'data-plus': 'STRIPE_PRICE_DATA_PLUS',
    'unlimited-data-plus': 'STRIPE_PRICE_UNLIMITED_DATA_PLUS',
  };
  for (const { plan, priceId } of results) {
    const key = envKeyMap[plan.slug];
    if (key) console.log(`${key}=${priceId}`);
  }
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
