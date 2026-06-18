// Stripe client singleton — server-side only.
// Module-level cache means one Stripe instance per process, not per request.
// Use getStripeClient() everywhere instead of constructing Stripe directly.

import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  _stripe = new Stripe(key, { apiVersion: '2026-04-22.dahlia', typescript: true });
  return _stripe;
}

export function getStripeWebhookSecret(): string {
  // .trim() prevents accidental leading/trailing whitespace from .env.local
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  return secret;
}
