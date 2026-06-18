export type PlanSlug = "basic" | "kosher-basic" | "kosher-plus" | "student-5g" | "max-5g";

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
  isKosher: boolean;
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
    isKosher: false,
    features: [
      "Israeli phone number",
      "1GB high-speed 5G data",
      "Calls — 1,000 minutes to Israeli landlines and mobiles",
      "Texts — 500 SMS to Israeli mobiles",
      "eSIM or physical SIM",
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
    slug: "student-5g",
    name: "Student 5G",
    shortName: "Student",
    priceCents: 3499,
    currency: "USD",
    description: "Best for most students.",
    detail:
      "The most popular choice for students — generous 5G data with 5,000 local minutes and 1,000 SMS included, and the option to add a US or Canadian number.",
    stripeEnvKey: "STRIPE_PRICE_STUDENT_5G",
    tone: "Best for most students",
    isKosher: false,
    featured: true,
    badge: "Most Popular",
    features: [
      "Israeli phone number",
      "50GB high-speed 5G data",
      "5,000 minutes to Israeli landlines and mobiles",
      "1,000 SMS to Israeli mobiles",
      "eSIM or physical SIM",
      "WhatsApp support",
      "VAT included",
      "No hidden fees",
      "US/Canada/UK number available as add-on: +$9.99/mo",
    ],
    comparison: {
      data: "50GB 5G",
      calls: "5,000 min",
      texts: "1,000 SMS",
      activation: "eSIM",
    },
  },
  {
    slug: "max-5g",
    name: "Max 5G",
    shortName: "Max",
    priceCents: 3999,
    currency: "USD",
    description: "More data, plus USA/CA calling.",
    detail:
      "120GB of 5G data for students who stream and stay connected all day — includes 5,000 local minutes, 1,000 SMS, and 150 minutes to US and Canadian numbers.",
    stripeEnvKey: "STRIPE_PRICE_MAX_5G",
    tone: "More data for heavy users",
    isKosher: false,
    badge: "Most Data",
    features: [
      "Israeli phone number",
      "120GB high-speed 5G data",
      "5,000 minutes to Israeli landlines and mobiles",
      "1,000 SMS to Israeli mobiles",
      "150 minutes to US & Canadian numbers",
      "eSIM or physical SIM",
      "Priority WhatsApp support",
      "VAT included",
      "No hidden fees",
      "US/Canada/UK number available as add-on: +$9.99/mo",
    ],
    comparison: {
      data: "120GB 5G",
      calls: "5,000 min + 150 USA/CA",
      texts: "1,000 SMS",
      activation: "eSIM",
    },
  },
  {
    slug: "kosher-basic",
    name: "Kosher Basic",
    shortName: "Kosher Basic",
    priceCents: 1999,
    currency: "USD",
    description: "5,000 minutes on a kosher-certified number.",
    detail:
      "Designed for certified kosher phones — 5,000 minutes to Israeli numbers monthly, voice only. Add a US or Canadian local number for an extra $9.99/mo.",
    stripeEnvKey: "STRIPE_PRICE_KOSHER_BASIC",
    tone: "For kosher-certified devices",
    isKosher: true,
    badge: "Kosher",
    features: [
      "Kosher phone number",
      "5,000 minutes to Israeli numbers",
      "Only compatible with a certified kosher phone",
      "No data or SMS — voice only",
      "Physical SIM card",
      "VAT included",
      "No hidden fees",
      "US/Canada local number available as add-on: +$9.99/mo",
    ],
    comparison: {
      data: "None",
      calls: "5,000 min",
      texts: "None",
      activation: "Physical SIM",
    },
  },
  {
    slug: "kosher-plus",
    name: "Kosher+",
    shortName: "Kosher+",
    priceCents: 2499,
    currency: "USD",
    description: "Kosher calling with USA/CA international minutes.",
    detail:
      "Everything in Kosher Basic, plus 150 minutes to US and Canadian numbers — for staying connected with family back home.",
    stripeEnvKey: "STRIPE_PRICE_KOSHER_PLUS",
    tone: "Kosher with USA/CA calling",
    isKosher: true,
    badge: "Kosher",
    features: [
      "Kosher phone number",
      "5,000 minutes to Israeli numbers",
      "150 minutes to US & Canadian numbers",
      "Only compatible with a certified kosher phone",
      "No data or SMS — voice only",
      "Physical SIM card",
      "VAT included",
      "No hidden fees",
      "US/Canada local number available as add-on: +$9.99/mo",
    ],
    comparison: {
      data: "None",
      calls: "5,000 min + 150 USA/CA",
      texts: "None",
      activation: "Physical SIM",
    },
  },
];

export const usCanadaNumberAddOn: AddOn = {
  id: "us-canada-number",
  tagline: "Add a US, Canadian, or UK local number",
  body: "Let family back home call you like a local call — no international dialing, no calling cards, no stress.",
  priceCents: 999,
  currency: "USD",
};

export const defaultPlanSlug: PlanSlug = "student-5g";
export const defaultKosherPlanSlug: PlanSlug = "kosher-basic";

export function getPlan(slug?: string | null) {
  return plans.find((plan) => plan.slug === slug) ?? plans.find((plan) => plan.slug === defaultPlanSlug)!;
}

export function getStripePriceId(plan: BitLinkPlan) {
  return process.env[plan.stripeEnvKey] ?? "";
}

// Annatel plan name strings — must match exactly what Annatel returns from /plans catalog.
// Updated June 2026 from production API probe.
const ANNATEL_PLAN_NAMES: Record<PlanSlug, string> = {
  "basic":        "PLAN_BITLINK_NATIONAL_1000MIN_1GB_202606",
  "student-5g":   "PLAN_BITLINK_NATIONAL_5000MIN_50GB_202606",
  "max-5g":       "PLAN_BITLINK_NATIONAL_5000MIN_USA_150MIN_120GB_202606",
  "kosher-basic": "PLAN_BITLINK_KOSHER_NATIONAL_5000MIN_202606",
  "kosher-plus":  "PLAN_BITLINK_KOSHER_NATIONAL_5000MIN_USA_150MIN_202606",
};

export function getAnnatelPlanName(slug: string): string {
  return ANNATEL_PLAN_NAMES[slug as PlanSlug] ?? slug;
}
