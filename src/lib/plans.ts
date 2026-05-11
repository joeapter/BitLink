export type PlanSlug =
  | "israel-basic"
  | "israel-plus"
  | "data-plus"
  | "unlimited-data-plus";

export type BitLinkPlan = {
  slug: PlanSlug;
  name: string;
  shortName: string;
  priceCents: number;
  currency: "USD";
  description: string;
  detail: string;
  longDistance?: string;
  stripeEnvKey: string;
  tone: string;
  featured?: boolean;
  features: string[];
  comparison: {
    data: string;
    international: string;
    activation: string;
    support: string;
  };
};

export const plans: BitLinkPlan[] = [
  {
    slug: "israel-basic",
    name: "Israel Basic",
    shortName: "Basic",
    priceCents: 3499,
    currency: "USD",
    description: "Simple monthly Israeli service for everyday calling and connectivity.",
    detail:
      "A clean starting point for people who want reliable monthly service without a complicated bundle.",
    stripeEnvKey: "STRIPE_PRICE_ISRAEL_BASIC",
    tone: "Everyday connection",
    features: [
      "Monthly Israeli service",
      "Simple plan setup",
      "Online account access",
      "Activation handled by the BitLink team",
    ],
    comparison: {
      data: "Everyday use",
      international: "Available as an upgrade",
      activation: "Manual MVP activation",
      support: "Human support",
    },
  },
  {
    slug: "israel-plus",
    name: "Israel Plus",
    shortName: "Plus",
    priceCents: 4999,
    currency: "USD",
    description: "Includes outgoing calls to USA, Canada, UK, and Australia.",
    detail:
      "A stronger everyday plan for customers who call abroad and still want simple monthly billing.",
    longDistance: "200 minutes/month",
    stripeEnvKey: "STRIPE_PRICE_ISRAEL_PLUS",
    tone: "Local plus international",
    featured: true,
    features: [
      "Outgoing calls to USA, Canada, UK, and Australia",
      "200 long-distance minutes per month",
      "Simple monthly billing",
      "Activation handled by the BitLink team",
    ],
    comparison: {
      data: "Everyday use",
      international: "200 minutes/month",
      activation: "Manual MVP activation",
      support: "Priority-aware support",
    },
  },
  {
    slug: "data-plus",
    name: "Data Plus",
    shortName: "Data",
    priceCents: 5999,
    currency: "USD",
    description: "More data, more flexibility, and international calling included.",
    detail:
      "Built for people who use their phone throughout the day and want international calling included.",
    stripeEnvKey: "STRIPE_PRICE_DATA_PLUS",
    tone: "Flexible data rhythm",
    features: [
      "Designed for heavier everyday data use",
      "International calling included",
      "Online subscription visibility",
      "Activation handled by the BitLink team",
    ],
    comparison: {
      data: "More flexible use",
      international: "Included",
      activation: "Manual MVP activation",
      support: "Human support",
    },
  },
  {
    slug: "unlimited-data-plus",
    name: "Unlimited Data Plus",
    shortName: "Unlimited",
    priceCents: 7999,
    currency: "USD",
    description: "Unlimited-feeling data experience with international calling included.",
    detail:
      "Designed for heavy everyday use with a smoother, more generous data experience.",
    stripeEnvKey: "STRIPE_PRICE_UNLIMITED_DATA_PLUS",
    tone: "Heavy daily use",
    features: [
      "Unlimited-feeling data experience",
      "International calling included",
      "Designed for heavy everyday use",
      "Activation handled by the BitLink team",
    ],
    comparison: {
      data: "Unlimited-feeling",
      international: "Included",
      activation: "Manual MVP activation",
      support: "Human support",
    },
  },
];

export const defaultPlanSlug: PlanSlug = "israel-plus";

export function getPlan(slug?: string | null) {
  return plans.find((plan) => plan.slug === slug) ?? plans.find((plan) => plan.slug === defaultPlanSlug)!;
}

export function getStripePriceId(plan: BitLinkPlan) {
  return process.env[plan.stripeEnvKey] ?? "";
}
