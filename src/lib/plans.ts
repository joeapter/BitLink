export type PlanSlug = "basic" | "kosher-basic" | "kosher-plus" | "student-5g" | "max-5g";

export type BitLinkPlan = {
  slug: PlanSlug;
  name: string;
  shortName: string;
  priceCents: number;
  currency: "USD";
  description: string;
  detail: string;
  seoTitle: string;
  seoDescription: string;
  faq: Array<{
    question: string;
    answer: string;
  }>;
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
    seoTitle: "Basic — $14.99/mo Israeli Phone Plan, 1GB 5G",
    seoDescription:
      "Israeli number, 1GB 5G data, 1,000 minutes, 500 SMS. $14.99/month, VAT included, eSIM or physical SIM. For light phone use in Israel.",
    faq: [
      {
        question: "Who is the Basic plan for?",
        answer:
          "Basic fits light phone use: an Israeli number for calls, texts, and the occasional map check, mostly on Wi-Fi. Its 1GB of 5G data runs out fast with daily social media, streaming, or navigation — most people who use their phone all day are better served by Student 5G's 50GB. If you mainly need a working Israeli number rather than mobile data, Basic is the clean, inexpensive starting point.",
      },
      {
        question: "Can I upgrade from Basic later?",
        answer:
          "Yes. There's no long-term contract on any BitLink plan, so you can move up to Student 5G or Max 5G whenever your usage changes. Your Israeli number stays exactly the same through the switch — just message support on WhatsApp and the team will handle the change.",
      },
    ],
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
    seoTitle: "Student 5G — $34.99/mo, 50GB Israeli Phone Plan",
    seoDescription:
      "BitLink's most popular plan: 50GB 5G, 5,000 minutes, 1,000 SMS for $34.99/month. Built for students in Israel. eSIM activation and English WhatsApp support.",
    faq: [
      {
        question: "Is 50GB enough for a semester in Israel?",
        answer:
          "For most students, comfortably. 50GB per month covers daily maps, group chats, social media, music, and moderate video streaming over 5G — which is why Student 5G is BitLink's most popular plan. If you stream video heavily or hotspot a laptop away from Wi-Fi, Max 5G's 120GB gives more headroom for $5 more per month.",
      },
      {
        question: "Can my parents pay for this plan from abroad?",
        answer:
          "Yes. Checkout is online and priced in US dollars with VAT included, so a parent in the US, UK, or Canada can pay with their own card while the line activates on the student's phone in Israel. There are no NIS conversion surprises on the statement, and support is available in English if the family has questions before or after signup.",
      },
    ],
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
    seoTitle: "Max 5G — $39.99/mo, 120GB + US/Canada Minutes",
    seoDescription:
      "120GB 5G data plus 150 minutes to US & Canada, 5,000 local minutes. $39.99/month, VAT included. The plan for olim staying close to family abroad.",
    faq: [
      {
        question: "Who should choose Max 5G?",
        answer:
          "Max 5G is built for two situations that often overlap: heavy data use — streaming, hotspotting a laptop, working from your phone — and staying close to family abroad, with 150 minutes of calling to US and Canadian numbers included every month at no extra cost. It tends to suit olim in their first year and anyone whose phone is their main work tool.",
      },
      {
        question: "Does Max 5G include international calling?",
        answer:
          "It includes 150 minutes per month to US and Canadian numbers, on top of 5,000 minutes to Israeli numbers. If family calls you more than you call them, the US/Canada/UK local number add-on ($9.99/month) gives them a number that's local on their end, so they can reach you without international dialing at all.",
      },
    ],
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
    seoTitle: "Kosher Basic — $19.99/mo Voice-Only Kosher Plan",
    seoDescription:
      "5,000 minutes to Israeli numbers on a certified kosher phone. Voice only, physical SIM, $19.99/month VAT included. English support by phone.",
    faq: [
      {
        question: "Which phones work with Kosher Basic?",
        answer:
          "Kosher Basic requires a certified kosher phone and activates on a physical SIM only — it isn't compatible with smartphones or eSIM. If you're unsure whether a specific device qualifies, or you're choosing for a community or yeshiva requirement, BitLink support can confirm compatibility before you pay.",
      },
      {
        question: "Is the Kosher Basic line rabbinically recognized?",
        answer:
          "Yes. BitLink's kosher lines are recognized by Vaadat Harabanim L'inyanei Tikshoret, the Rabbinical Committee for Communications (registered association no. 580440824), so the number works the way kosher-phone communities and institutions expect a kosher line to work.",
      },
    ],
    stripeEnvKey: "STRIPE_PRICE_KOSHER_BASIC",
    tone: "For kosher-certified devices",
    isKosher: true,
    badge: "Kosher",
    features: [
      "Kosher phone number",
      "Line recognized by Vaadat Harabanim",
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
    seoTitle: "Kosher+ — $24.99/mo Kosher Plan + US/CA Minutes",
    seoDescription:
      "Kosher voice-only plan with 5,000 Israeli minutes plus 150 minutes to US & Canada. $24.99/month, physical SIM, VAT included.",
    faq: [
      {
        question: "What does Kosher+ add over Kosher Basic?",
        answer:
          "For $5 more per month, Kosher+ adds 150 minutes of calling to US and Canadian numbers on top of the same 5,000 minutes to Israeli numbers. It's the kosher plan for staying in regular touch with family abroad — same certified kosher line, same physical SIM, same voice-only limits.",
      },
      {
        question: "Can family in the US or Canada reach me easily on Kosher+?",
        answer:
          "Two ways. Your included 150 US/Canada minutes cover the calls you make to them. For the calls they make to you, the US or Canada local-number add-on ($9.99/month) gives your line a number that's local on their end — parents dial a regular local number and it rings your kosher phone in Israel.",
      },
    ],
    stripeEnvKey: "STRIPE_PRICE_KOSHER_PLUS",
    tone: "Kosher with USA/CA calling",
    isKosher: true,
    badge: "Kosher",
    features: [
      "Kosher phone number",
      "Line recognized by Vaadat Harabanim",
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
