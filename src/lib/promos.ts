// Unlisted, link-only discount promos — not customer-facing coupon codes.
// Each one is only ever reached via a specific unlisted landing page (e.g.
// /partners/neveh-zion-discount) that links into checkout with ?promo=<code>.
// The discount itself is always resolved server-side from this table in
// create-checkout-session/route.ts — a client can send whatever promoCode it
// wants, but only a code present here has any effect on price.

export interface Promo {
  label: string;
  orgReferralCode: string;
  skipActivationFee: boolean;
  // Discounted monthly price for the US/Canada/UK add-on, in cents. null
  // means no discount on the add-on for this promo.
  intlAddonPriceCents: number | null;
}

export const PROMOS: Record<string, Promo> = {
  "neveh-discount": {
    label: "Neveh Zion discount",
    orgReferralCode: "ORG-34CC7856",
    skipActivationFee: true,
    intlAddonPriceCents: 599,
  },
};

export function getPromo(code?: string | null): Promo | null {
  if (!code) return null;
  return PROMOS[code] ?? null;
}
