export type TopUpId =
  | "data-10gb"
  | "data-20gb"
  | "data-50gb"
  | "usa-ca-120min"
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
};

export const topups: TopUp[] = [
  {
    id: "data-10gb",
    name: "+10GB Data",
    description: "Add 10GB of high-speed 5G data, valid for 30 days.",
    priceCents: 999,
    currency: "USD",
    stripeEnvKey: "STRIPE_PRICE_TOPUP_DATA_10GB",
    annatelPlanName: "PLAN_TOPUP_30D_DATA_10G",
    forKosher: false,
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
    id: "local-1000min",
    name: "+1,000 Local Min",
    description: "Add 1,000 minutes to Israeli local numbers, valid for 30 days.",
    priceCents: 999,
    currency: "USD",
    stripeEnvKey: "STRIPE_PRICE_TOPUP_LOCAL_1000MIN",
    annatelPlanName: "PLAN_TOPUP_30D_NATIONAL_VOICE_1000MIN",
    forKosher: true,
  },
];

export function getTopUpsForPlan(isKosher: boolean): TopUp[] {
  return topups.filter((t) => t.forKosher === isKosher);
}

export function getStripeTopUpPriceId(topup: TopUp): string {
  return process.env[topup.stripeEnvKey] ?? "";
}
