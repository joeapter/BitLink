// Plan catalogue for the native Plans tab.
//
// Mirrors src/lib/plans.ts in the web app. It's duplicated rather than fetched
// because the site exposes no public plans endpoint, and a plans list that can
// fail to load is worse than one that's a release behind. When pricing or
// allowances change on the web, change them here too and ship a build.

export type NativePlan = {
  slug: string;
  name: string;
  price: string;
  tagline: string;
  detail: string;
  badge?: string;
  featured?: boolean;
  specs: { data: string; calls: string; texts: string; activation: string };
  features: string[];
};

export const fiveGPlans: NativePlan[] = [
  {
    slug: "basic",
    name: "Basic",
    price: "$14.99",
    tagline: "For simple phone use.",
    detail:
      "A clean starting point for people who want reliable monthly service with an Israeli number, basic 5G data, and included calls and texts.",
    specs: { data: "1GB 5G", calls: "1,000 min", texts: "500 SMS", activation: "eSIM" },
    features: [
      "Israeli phone number",
      "1GB high-speed 5G data",
      "Calls — 1,000 minutes to Israeli landlines and mobiles",
      "Texts — 500 SMS to Israeli mobiles",
      "eSIM or physical SIM",
      "WhatsApp support",
      "VAT included where applicable",
      "No hidden fees",
    ],
  },
  {
    slug: "student-5g",
    name: "Student 5G",
    price: "$34.99",
    tagline: "Best for most students.",
    detail:
      "The most popular choice for students — generous 5G data with 5,000 local minutes and 1,000 SMS included, and the option to add a US or Canadian number.",
    badge: "Most Popular",
    featured: true,
    specs: { data: "50GB 5G", calls: "5,000 min", texts: "1,000 SMS", activation: "eSIM" },
    features: [
      "Israeli phone number",
      "50GB high-speed 5G data",
      "5,000 minutes to Israeli landlines and mobiles",
      "1,000 SMS to Israeli mobiles",
      "eSIM or physical SIM",
      "WhatsApp support",
      "VAT included where applicable",
      "No hidden fees",
      "US/Canada/UK number available as add-on: +$9.99/mo",
    ],
  },
  {
    slug: "max-5g",
    name: "Max 5G",
    price: "$39.99",
    tagline: "More data, plus USA/CA calling.",
    detail:
      "120GB of 5G data for students who stream and stay connected all day — includes 5,000 local minutes, 1,000 SMS, and 150 minutes to US and Canadian numbers.",
    badge: "Most Data",
    specs: {
      data: "120GB 5G",
      calls: "5,000 min + 150 USA/CA",
      texts: "1,000 SMS",
      activation: "eSIM",
    },
    features: [
      "Israeli phone number",
      "120GB high-speed 5G data",
      "5,000 minutes to Israeli landlines and mobiles",
      "1,000 SMS to Israeli mobiles",
      "150 minutes to US & Canadian numbers",
      "eSIM or physical SIM",
      "Priority WhatsApp support",
      "VAT included where applicable",
      "No hidden fees",
      "US/Canada/UK number available as add-on: +$9.99/mo",
    ],
  },
];

export const kosherPlans: NativePlan[] = [
  {
    slug: "kosher-basic",
    name: "Kosher Basic",
    price: "$19.99",
    tagline: "5,000 minutes on a kosher-certified number.",
    detail:
      "Designed for certified kosher phones — 5,000 minutes to Israeli numbers monthly, voice only. Add a US or Canadian local number for an extra $9.99/mo.",
    badge: "Kosher",
    specs: { data: "None", calls: "5,000 min", texts: "None", activation: "Physical SIM" },
    features: [
      "Kosher phone number",
      "Line recognized by Vaadat Harabanim",
      "5,000 minutes to Israeli numbers",
      "Only compatible with a certified kosher phone",
      "No data or SMS — voice only",
      "Physical SIM card",
      "VAT included where applicable",
      "No hidden fees",
    ],
  },
  {
    slug: "kosher-plus",
    name: "Kosher+",
    price: "$24.99",
    tagline: "Kosher calling with a US, Canada, or UK number included.",
    detail:
      "Everything in Kosher Basic, plus 150 minutes to US and Canadian numbers — and a local US, Canada, or UK number included, so family abroad reaches you with a local call.",
    badge: "Kosher",
    featured: true,
    specs: {
      data: "None",
      calls: "5,000 min + 150 USA/CA",
      texts: "None",
      activation: "Physical SIM",
    },
    features: [
      "Kosher phone number",
      "Line recognized by Vaadat Harabanim",
      "5,000 minutes to Israeli numbers",
      "150 minutes to US & Canadian numbers",
      "Only compatible with a certified kosher phone",
      "No data or SMS — voice only",
      "Physical SIM card",
      "VAT included where applicable",
      "No hidden fees",
      "US, Canada, or UK local number included (normally $9.99/mo)",
    ],
  },
];

export const allPlans: NativePlan[] = [...fiveGPlans, ...kosherPlans];

/**
 * Look up a plan by the slug stored on a line. Returns undefined rather than
 * falling back to a default: showing a customer the wrong plan name is worse
 * than showing the raw slug, and the web app's findPlan() makes the same
 * choice for the same reason.
 */
export function findPlanBySlug(slug?: string | null): NativePlan | undefined {
  if (!slug) return undefined;
  return allPlans.find((plan) => plan.slug === slug);
}
