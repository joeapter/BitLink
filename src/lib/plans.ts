export type PlanSlug = "basic" | "unlimited-kosher" | "student-5g" | "max-5g";

export type BitLinkPlan = {
  slug: PlanSlug;
  name: string;
  shortName: string;
  priceCents: number;
  currency: "USD";
  description: string;
  detail: string;
  stripeEnvKey: string;
  tone: string;
  featured?: boolean;
  badge?: string;
  features: string[];
  comparison: {
    data: string;
    calls: string;
    texts: string;
    activation: string;
  };
};

export type AddOn = {
  id: string;
  tagline: string;
  body: string;
  priceCents: number;
  currency: "USD";
};

export const plans: BitLinkPlan[] = [
  {
    slug: "basic",
    name: "Basic",
    shortName: "Basic",
    priceCents: 1499,
    currency: "USD",
    description: "For simple phone use.",
    detail:
      "A clean starting point for people who want reliable monthly service with an Israeli number, basic 5G data, and included calls and texts.",
    stripeEnvKey: "STRIPE_PRICE_BASIC",
    tone: "For simple phone use",
    features: [
      "Israeli phone number",
      "1GB high-speed 5G data",
      "Calls — 1,000 minutes to Israeli landlines and mobiles",
      "Texts — 500 SMS to Israeli mobiles",
      "eSIM activation",
      "WhatsApp support",
      "VAT included",
      "No hidden fees",
    ],
    comparison: {
      data: "1GB 5G",
      calls: "1,000 min",
      texts: "500 SMS",
      activation: "eSIM",
    },
  },
  {
    slug: "unlimited-kosher",
    name: "Unlimited Kosher",
    shortName: "Kosher",
    priceCents: 1999,
    currency: "USD",
    description: "Unlimited calls on a kosher-certified number.",
    detail:
      "Designed for certified kosher phones — unlimited calls to Israeli and North American mobiles, plus landlines across 30+ countries. Add a US or Canadian local number for an extra $9.99/mo.",
    stripeEnvKey: "STRIPE_PRICE_UNLIMITED_KOSHER",
    tone: "For kosher-certified devices",
    badge: "Kosher",
    features: [
      "Kosher phone number",
      "Unlimited calls to Israeli, US & Canadian mobiles",
      "Calls to landlines in 30+ destinations",
      "Only compatible with a certified kosher phone",
      "No data or SMS — voice only",
      "VAT included",
      "No hidden fees",
      "US/Canada local number available as add-on: +$9.99/mo",
    ],
    comparison: {
      data: "None",
      calls: "Unlimited",
      texts: "None",
      activation: "Physical SIM",
    },
  },
  {
    slug: "student-5g",
    name: "Student 5G",
    shortName: "Student",
    priceCents: 3499,
    currency: "USD",
    description: "Best for most students.",
    detail:
      "The most popular choice for students — generous 5G data with local calls and texts included, and the option to add a US or Canadian number.",
    stripeEnvKey: "STRIPE_PRICE_STUDENT_5G",
    tone: "Best for most students",
    featured: true,
    badge: "Most Popular",
    features: [
      "Israeli phone number",
      "50GB high-speed 5G data",
      "Local calls and texts",
      "eSIM activation",
      "WhatsApp support",
      "VAT included",
      "No hidden fees",
      "US/Canada local number available as add-on: +$9.99/mo",
    ],
    comparison: {
      data: "50GB 5G",
      calls: "Local",
      texts: "Local",
      activation: "eSIM",
    },
  },
  {
    slug: "max-5g",
    name: "Max 5G",
    shortName: "Max",
    priceCents: 3999,
    currency: "USD",
    description: "More data for heavy users.",
    detail:
      "120GB of 5G data for students who stream, navigate, and stay connected all day — with priority support and the option to add a US or Canadian number.",
    stripeEnvKey: "STRIPE_PRICE_MAX_5G",
    tone: "More data for heavy users",
    badge: "Most Data",
    features: [
      "Israeli phone number",
      "120GB high-speed 5G data",
      "Local calls and texts",
      "eSIM activation",
      "Priority WhatsApp support",
      "VAT included",
      "No hidden fees",
      "US/Canada local number available as add-on: +$9.99/mo",
    ],
    comparison: {
      data: "120GB 5G",
      calls: "Local",
      texts: "Local",
      activation: "eSIM",
    },
  },
];

export const usCanadaNumberAddOn: AddOn = {
  id: "us-canada-number",
  tagline: "Add a US or Canadian local number",
  body: "Let family back home call you like a local call — no international dialing, no calling cards, no stress.",
  priceCents: 999,
  currency: "USD",
};

export const defaultPlanSlug: PlanSlug = "student-5g";

export function getPlan(slug?: string | null) {
  return plans.find((plan) => plan.slug === slug) ?? plans.find((plan) => plan.slug === defaultPlanSlug)!;
}

export function getStripePriceId(plan: BitLinkPlan) {
  return process.env[plan.stripeEnvKey] ?? "";
}
