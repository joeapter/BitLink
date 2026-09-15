// Unlisted, link-only discount promos — not customer-facing coupon codes.
// Each one is only ever reached via a specific unlisted landing page (e.g.
// /partners/neveh-zion-discount) that links into checkout with ?promo=<code>.
// The discount itself is always resolved server-side from this table in
// create-checkout-session/route.ts — a client can send whatever promoCode it
// wants, but only a code present here has any effect on price.

export type PromoIntlCountry = "us" | "canada" | "uk";

export interface Promo {
  label: string;
  // Empty when the offer isn't tied to an organisation — the customer's own
  // referral attribution is then left alone.
  orgReferralCode: string;
  skipActivationFee: boolean;
  // Discounted monthly price for the US/Canada/UK add-on, in cents. null
  // means no discount on the add-on for this promo.
  intlAddonPriceCents: number | null;
  // Offers sold as one combined monthly price rather than a plan plus a
  // discounted add-on. Checkout collapses the two rows into a single line
  // under this name. The total is always derived from the plan price plus
  // intlAddonPriceCents, never written down, so it cannot drift out of sync.
  //
  // Stripe still bills two items, so the customer's invoice lists the plan and
  // the add-on separately even though checkout shows one figure.
  bundleLabel: string | null;
  // Switches the international number on from the first render and fixes its
  // country, so someone arriving on an offer link doesn't have to find the
  // toggle. null leaves the choice to the customer.
  presetIntlCountry: PromoIntlCountry | null;
}

export const PROMOS: Record<string, Promo> = {
  "neveh-discount": {
    label: "Neveh Zion discount",
    orgReferralCode: "ORG-34CC7856",
    skipActivationFee: true,
    intlAddonPriceCents: 599,
    bundleLabel: null,
    presetIntlCountry: null,
  },
  "elul-zman": {
    label: "Elul zman email campaign (Neveh Zion parent list)",
    orgReferralCode: "ORG-34CC7856",
    skipActivationFee: true,
    intlAddonPriceCents: 599,
    bundleLabel: null,
    presetIntlCountry: null,
  },
  // The self-serve twin of the `us-number-bundle` preset in
  // CustomOrderBuilder, for people arriving from /us-number-in-israel who want
  // a US number to receive IRS, bank and 2FA codes. Same $17.99/mo the builder
  // sells by hand, so the two routes can't quote different prices.
  //
  // Deliberately unlisted: at $17.99 it undercuts Basic ($14.99) plus the
  // add-on ($9.99) bought separately, so it must not appear on /plans.
  //
  // The discount sits on the add-on rather than the plan because the plan
  // bills from a fixed Stripe price ID that webhooks map back to a plan slug —
  // an ad-hoc price_data plan line would break plan detection and upgrades.
  // $14.99 plan + $3.00 add-on = the $17.99 total.
  "us-number-bundle": {
    label: "US number bundle",
    orgReferralCode: "",
    skipActivationFee: true,
    intlAddonPriceCents: 300,
    bundleLabel: "Basic + US number",
    presetIntlCountry: "us",
  },
};

export function getPromo(code?: string | null): Promo | null {
  if (!code) return null;
  return PROMOS[code] ?? null;
}
