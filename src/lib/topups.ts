export type TopUpId =
  | "data-5gb"
  | "data-10gb"
  | "data-20gb"
  | "data-50gb"
  | "usa-ca-120min"
  | "usa-ca-120min-standard"
  | "local-1000min";

export type TopUp = {
  id: TopUpId;
  name: string;
  description: string;
  priceCents: number;
  currency: "USD";
  stripeEnvKey: string;
  annatelPlanName: string;
  forKosher: boolean;
  badge?: string;
  // How much this topup actually adds to the line's balance meters, so an
  // active grant can be folded into the "Remaining" figure shown in admin
  // and the account portal — not just listed as a separate line item.
  // Only one of these should be set per topup.
  grantsDataBytes?: number;
  grantsVoiceSeconds?: number;
};

export const topups: TopUp[] = [
  {
    id: "data-5gb",
    name: "+5GB Data",
    description: "Add 5GB of high-speed 5G data, valid for 30 days.",
    priceCents: 599,
    currency: "USD",
    stripeEnvKey: "STRIPE_PRICE_TOPUP_DATA_5GB",
    // Same Annatel plan already proven in production via the monthly referral
    // bonus grant (see REFERRAL_BONUS_DEFAULT_TOPUP_NAME in lib/referrals.ts).
    annatelPlanName: "PLAN_DATA_SUPP_5GB",
    forKosher: false,
    grantsDataBytes: 5_000_000_000,
  },
  {
    id: "data-10gb",
    name: "+10GB Data",
    description: "Add 10GB of high-speed 5G data, valid for 30 days.",
    priceCents: 999,
    currency: "USD",
    stripeEnvKey: "STRIPE_PRICE_TOPUP_DATA_10GB",
    annatelPlanName: "PLAN_TOPUP_30D_DATA_10G",
    forKosher: false,
    grantsDataBytes: 10_000_000_000,
  },
  {
    id: "data-20gb",
    name: "+20GB Data",
    description: "Add 20GB of high-speed 5G data, valid for 30 days.",
    priceCents: 1799,
    currency: "USD",
    stripeEnvKey: "STRIPE_PRICE_TOPUP_DATA_20GB",
    annatelPlanName: "PLAN_TOPUP_30D_DATA_20G",
    forKosher: false,
    badge: "Best value",
    grantsDataBytes: 20_000_000_000,
  },
  {
    id: "data-50gb",
    name: "+50GB Data",
    description: "Add 50GB of high-speed 5G data, valid for 30 days.",
    priceCents: 3499,
    currency: "USD",
    stripeEnvKey: "STRIPE_PRICE_TOPUP_DATA_50GB",
    annatelPlanName: "PLAN_TOPUP_30D_DATA_50G",
    forKosher: false,
    grantsDataBytes: 50_000_000_000,
  },
  {
    id: "usa-ca-120min",
    name: "+120 Min USA/CA",
    description: "Add 120 minutes of calling to US and Canadian numbers, valid for 30 days.",
    priceCents: 1499,
    currency: "USD",
    stripeEnvKey: "STRIPE_PRICE_TOPUP_USA_CA_120MIN",
    annatelPlanName: "PLAN_USA_VOICE_30D_120MIN",
    forKosher: true,
  },
  {
    // Same Annatel topup plan as usa-ca-120min above (Annatel's own catalog
    // just labels it a "kosher" topup — nothing about the mechanism is
    // actually kosher-specific). Kept as a separate non-kosher entry rather
    // than loosening the kosher one, so self-serve/reporting that filters by
    // forKosher never mixes the two up. Only reachable today via an admin
    // custom order (CustomOrderBuilder), not the self-serve topup picker.
    id: "usa-ca-120min-standard",
    name: "+120 Min USA/CA",
    description: "Add 120 minutes of calling to US and Canadian numbers, valid for 30 days.",
    priceCents: 1499,
    currency: "USD",
    stripeEnvKey: "STRIPE_PRICE_TOPUP_USA_CA_120MIN",
    annatelPlanName: "PLAN_USA_VOICE_30D_120MIN",
    forKosher: false,
  },
  {
    id: "local-1000min",
    name: "+1,000 Local Min",
    description: "Add 1,000 minutes to Israeli local numbers, valid for 30 days.",
    priceCents: 999,
    currency: "USD",
    stripeEnvKey: "STRIPE_PRICE_TOPUP_LOCAL_1000MIN",
    annatelPlanName: "PLAN_TOPUP_30D_NATIONAL_VOICE_1000MIN",
    forKosher: true,
    grantsVoiceSeconds: 1000 * 60,
  },
];

export function getTopUpsForPlan(isKosher: boolean): TopUp[] {
  return topups.filter((t) => t.forKosher === isKosher);
}

export function getStripeTopUpPriceId(topup: TopUp): string {
  return process.env[topup.stripeEnvKey] ?? "";
}
