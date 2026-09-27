// `max-5g-120` is the retired 120GB Max. The `max-5g` slug deliberately stays
// with the CURRENT Max so /plans/max-5g keeps its URL, its search equity and
// every link in the guides; customers already on the old one were relabelled to
// the legacy slug, which describes what they actually hold.
export type PlanSlug = "basic" | "kosher-basic" | "kosher-plus" | "student-5g" | "max-5g" | "max-5g-120";

export type BitLinkPlan = {
  slug: PlanSlug;
  name: string;
  shortName: string;
  priceCents: number;
  currency: "USD";
  // Monthly included amounts in machine-readable form (marketing copy lives
  // in features/comparison). null = the plan doesn't include that bucket.
  // Used to size CDR-derived usage meters. Voice = Israeli minutes only.
  allowances: {
    dataBytes: number | null;
    voiceMinutes: number;
    smsCount: number | null;
  };
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
  // The US/Canada/UK local number ships with the plan instead of being the
  // $9.99/mo add-on. Checkout skips billing for it and provisioning attaches
  // it alongside the Israeli number.
  includesIntlNumber?: boolean;
  // Days after purchase in which a full refund is given, no questions asked.
  // Omitted means DEFAULT_REFUND_WINDOW_DAYS. It lives on the plan rather than
  // in copy because the window differs per plan and the promise is quoted in
  // several places — a hardcoded number in a guide and a different one in an
  // email is how a customer ends up being told the wrong thing.
  refundWindowDays?: number;
  // Retired: still billed, still rendered for the customers on it, but never
  // offered again. Public surfaces iterate `publicPlans`; admin, legal and
  // anything resolving a slug an existing subscriber holds use `plans`.
  unlisted?: boolean;
  featured?: boolean;
  badge?: string;
  // A second, quieter badge under the first. Max 5G carries both because the
  // two things worth knowing about it are unrelated: it is the only plan with a
  // foreign number included, AND the one with the most data.
  secondaryBadge?: string;
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

// Launch offer: the one-time activation fee is waived on the flagship 5G plans
// (Student + Max) as a limited-time promotion. This is where sticker-shock
// abandonment shows up — the fee compounds with add-ons into a scary first
// total, and the plans' LTV easily absorbs the $14.99. Basic/Kosher plans keep
// the fee: their margins are thinner and we've seen no fee-driven drop-off
// there. Extend this list only if data shows abandonment on those plans.
export const ACTIVATION_FEE_WAIVED_PLANS: readonly PlanSlug[] = ["student-5g", "max-5g", "max-5g-120"];

export function isActivationFeeWaivedForPlan(slug: string): boolean {
  return (ACTIVATION_FEE_WAIVED_PLANS as readonly string[]).includes(slug);
}

export const plans: BitLinkPlan[] = [
  {
    slug: "basic",
    name: "Basic",
    shortName: "Basic",
    priceCents: 1499,
    currency: "USD",
    allowances: { dataBytes: 1000000000, voiceMinutes: 1000, smsCount: 500 },
    description: "For simple phone use.",
    detail:
      "A clean starting point for people who want reliable monthly service with an Israeli number, basic 5G data, and included calls and texts.",
    seoTitle: "Basic — $14.99/mo Israeli Phone Plan, 1GB 5G",
    seoDescription:
      "Israeli number, 1GB 5G data, 1,000 minutes, 500 SMS. $14.99/month, VAT included where applicable, eSIM or physical SIM. For light phone use in Israel.",
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
      "VAT included where applicable",
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
    priceCents: 3299,
    currency: "USD",
    allowances: { dataBytes: 50000000000, voiceMinutes: 5000, smsCount: 1000 },
    description: "Best for most students.",
    detail:
      "The most popular choice for students — generous 5G data with 5,000 local minutes and 1,000 SMS included, and the option to add a US or Canadian number.",
    seoTitle: "Student 5G — $32.99/mo, 50GB Israeli Phone Plan",
    seoDescription:
      "BitLink's most popular plan: 50GB 5G, 5,000 minutes, 1,000 SMS for $32.99/month. Built for students in Israel. eSIM activation and English WhatsApp support.",
    faq: [
      {
        question: "Is 50GB enough for a semester in Israel?",
        answer:
          "For most students, comfortably. 50GB per month covers daily maps, group chats, social media, music, and moderate video streaming over 5G — which is why Student 5G is BitLink's most popular plan. If you stream video heavily or hotspot a laptop away from Wi-Fi, Max 5G's 200GB gives more headroom for $5 more per month, and throws in a US, Canadian or UK number.",
      },
      {
        question: "Can my parents pay for this plan from abroad?",
        answer:
          "Yes. Checkout is online and priced in US dollars with VAT included where applicable, so a parent in the US, UK, or Canada can pay with their own card while the line activates on the student's phone in Israel. There are no NIS conversion surprises on the statement, and support is available in English if the family has questions before or after signup.",
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
      "VAT included where applicable",
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
    allowances: { dataBytes: 200000000000, voiceMinutes: 5000, smsCount: 1000 },
    description: "Two numbers — Israeli and American.",
    detail:
      "200GB of 5G data with a US, Canadian or UK number included free — so your bank, the IRS and family abroad reach a local number while your Israeli line rings. Plus 5,000 local minutes, 1,000 SMS, and 300 minutes to US and Canadian numbers.",
    seoTitle: "Max 5G — $39.99/mo, 200GB + a Free US Number",
    seoDescription:
      "An Israeli number and a US, Canadian or UK number on one phone, included. 200GB 5G data, 300 minutes to US & Canada. $39.99/month, VAT included where applicable.",
    faq: [
      {
        question: "Who should choose Max 5G?",
        answer:
          "Anyone who needs to exist in two countries at once. Max 5G includes a second number — US, Canadian or UK — on the same phone as your Israeli line, which is what makes it work for olim who still have a bank, a brokerage, an employer or elderly parents abroad. It also carries the most data of any BitLink plan, so it suits heavy streaming, hotspotting a laptop, or working from your phone.",
      },
      {
        question: "Is the US number really included, or is it a trial?",
        answer:
          "Included, permanently, at no extra charge — it is part of the plan rather than a promotion with an end date. On any other plan that same number is $9.99/month, so Max 5G is $49.98 of service at $39.99. You choose US, Canada or UK at checkout and the number is set up alongside your Israeli line.",
      },
      {
        question: "What can I actually do with the included US number?",
        answer:
          "It takes calls and US verification texts. In practice that means bank and brokerage one-time codes, two-factor prompts from US services, the IRS and employer HR lines, and family who dial a local number in their own country instead of calling internationally. It is a real number in that country, not a forwarding trick, and it keeps working if you travel.",
      },
      {
        question: "Does Max 5G include international calling?",
        answer:
          "It includes 300 minutes per month to US and Canadian numbers, on top of 5,000 minutes to Israeli numbers — that covers the calls you make. The included US, Canada or UK number covers the calls they make to you, without anyone dialing internationally.",
      },
    ],
    stripeEnvKey: "STRIPE_PRICE_MAX_5G",
    tone: "An Israeli number and an American one",
    isKosher: false,
    // Bundles the US/Canada/UK number into the plan price, the same mechanism
    // Kosher+ uses. Two reasons this is the right plan to bundle it into:
    //
    // 1. It is the only axis where no Israeli carrier competes at any price.
    //    Max 5G was otherwise a pure gigabyte comparison against carriers
    //    reselling domestic data at a fraction of our wholesale rate, which is
    //    the one fight we lose.
    // 2. The DID costs nothing at the margin. Annatel bills international
    //    numbers per number HELD, not per number assigned, and will not take
    //    spare blocks back — 75 held against 6 assigned as of Sept 2026. Each
    //    one we attach to a plan is already paid for.
    includesIntlNumber: true,
    // Longer than the standard window, and only on this plan. At $39.99 with no
    // free trial in front of it, the refund IS the risk-reducer at checkout —
    // the trial funnel auto-continues onto Basic, so it was never going to sell
    // this plan. Two weeks comfortably covers the period in which someone learns
    // whether coverage is fine and whether their bank's codes actually arrive,
    // while staying short enough not to fund a three-week visit.
    refundWindowDays: 14,
    badge: "Two Numbers",
    secondaryBadge: "Most Data",
    features: [
      "Israeli phone number",
      "US, Canada or UK number included free (normally $9.99/mo)",
      "200GB high-speed 5G data",
      "5,000 minutes to Israeli landlines and mobiles",
      "1,000 SMS to Israeli mobiles",
      "300 minutes to US & Canadian numbers",
      "Receives US bank and 2FA verification codes",
      "eSIM or physical SIM",
      "Priority WhatsApp support",
      "VAT included where applicable",
      "No hidden fees",
    ],
    comparison: {
      data: "200GB 5G",
      calls: "5,000 min + 300 USA/CA",
      texts: "1,000 SMS",
      activation: "eSIM",
    },
  },
  {
    // RETIRED — the 120GB Max, kept only for the customers who bought it.
    //
    // They are not being migrated: their carrier plan is untouched and their
    // billing is unchanged. This entry exists so their usage meter shows the
    // 120GB they actually have rather than the 200GB the current Max carries,
    // which is the precise bug the getPlan() note below warns about.
    //
    // includesIntlNumber is false here, unlike the current Max: these customers
    // bought the number as a $9.99 add-on if they have one at all, so the
    // account page must keep offering it to those who don't.
    //
    // If one of them asks, upgrade them to `max-5g` for free — same price, more
    // data. That is the policy, and it is why this plan is never advertised.
    slug: "max-5g-120",
    name: "Max 5G",
    shortName: "Max",
    priceCents: 3999,
    currency: "USD",
    allowances: { dataBytes: 120000000000, voiceMinutes: 5000, smsCount: 1000 },
    description: "More data, plus USA/CA calling.",
    detail:
      "120GB of 5G data, 5,000 local minutes, 1,000 SMS, and 150 minutes to US and Canadian numbers.",
    seoTitle: "Max 5G — $39.99/mo, 120GB + US/Canada Minutes",
    seoDescription:
      "120GB 5G data plus 150 minutes to US & Canada, 5,000 local minutes. $39.99/month, VAT included where applicable.",
    faq: [
      {
        question: "Can I move to the current Max 5G?",
        answer:
          "Yes, at no extra cost. Max 5G now carries 200GB and 300 minutes to US and Canadian numbers, with a US, Canadian or UK number included, at the same $39.99/month you already pay. Message us and we'll move you across — there is nothing to pay and your number does not change.",
      },
    ],
    stripeEnvKey: "STRIPE_PRICE_MAX_5G",
    tone: "More data for heavy users",
    isKosher: false,
    unlisted: true,
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
    allowances: { dataBytes: null, voiceMinutes: 5000, smsCount: null },
    description: "5,000 minutes on a kosher-certified number.",
    detail:
      "Designed for certified kosher phones — 5,000 minutes to Israeli numbers monthly, voice only. Add a US or Canadian local number for an extra $9.99/mo.",
    seoTitle: "Kosher Basic — $19.99/mo Voice-Only Kosher Plan",
    seoDescription:
      "5,000 minutes to Israeli numbers on a certified kosher phone. Voice only, physical SIM, $19.99/month VAT included where applicable. English support by phone.",
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
      "VAT included where applicable",
      "No hidden fees",
      "US, Canada, or UK local number included (normally $9.99/mo)",
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
    allowances: { dataBytes: null, voiceMinutes: 5000, smsCount: null },
    description: "Kosher calling with a US, Canada, or UK number included.",
    detail:
      "Everything in Kosher Basic, plus 150 minutes to US and Canadian numbers — and a local US, Canada, or UK number included, so family abroad reaches you with a local call.",
    seoTitle: "Kosher+ — $24.99/mo Kosher Plan With a US Number Included",
    seoDescription:
      "Kosher voice-only plan with 5,000 Israeli minutes, 150 minutes to US & Canada, and an included US, Canada, or UK local number. $24.99/month — first 3 months $19.99.",
    faq: [
      {
        question: "What does Kosher+ add over Kosher Basic?",
        answer:
          "For $5 more per month, Kosher+ adds 150 minutes of calling to US and Canadian numbers on top of the same 5,000 minutes to Israeli numbers, and includes a local US, Canada, or UK number so family abroad can call in without dialing internationally — a number that costs $9.99/month on any other plan. Same certified kosher line, same physical SIM, same voice-only limits.",
      },
      {
        question: "Can family in the US or Canada reach me easily on Kosher+?",
        answer:
          "Two ways, both included. Your 150 US/Canada minutes cover the calls you make to them. For the calls they make to you, Kosher+ includes a local number in the US, Canada, or UK — parents dial a regular local number in their own country and it rings your kosher phone in Israel. The line stays voice-only, so that number carries incoming calls and nothing else.",
      },
    ],
    stripeEnvKey: "STRIPE_PRICE_KOSHER_PLUS",
    tone: "Kosher with USA/CA calling",
    isKosher: true,
    includesIntlNumber: true,
    badge: "Kosher",
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

/**
 * Plans still on sale. Every customer-facing list — the plans page, the
 * checkout picker, the comparison table, the sitemap — iterates this.
 * `plans` keeps the retired ones so an existing subscriber's slug still
 * resolves to the right allowances, price and terms.
 */
export const publicPlans = plans.filter((plan) => !plan.unlisted);

export const defaultPlanSlug: PlanSlug = "student-5g";
export const defaultKosherPlanSlug: PlanSlug = "kosher-basic";

// Forgiving: always returns a plan, falling back to the default. Fine for
// display surfaces that need *something*; dangerous anywhere the answer is a
// number the customer will act on — see findPlan.
export function getPlan(slug?: string | null) {
  return plans.find((plan) => plan.slug === slug) ?? plans.find((plan) => plan.slug === defaultPlanSlug)!;
}

// Strict: returns undefined when the slug is missing or unrecognised, so a
// caller has to decide what an unknown plan means rather than silently
// inheriting the default plan's allowances. getPlan()'s fallback is
// student-5g — 50GB — which is how every non-Student customer came to be
// shown a 50GB data meter regardless of what they actually bought.
export function findPlan(slug?: string | null): BitLinkPlan | undefined {
  if (!slug) return undefined;
  return plans.find((plan) => plan.slug === slug);
}

/** The refund window every plan gets unless it names its own. */
export const DEFAULT_REFUND_WINDOW_DAYS = 3;

/**
 * Days after purchase in which this plan is refunded in full, no questions
 * asked. Quote this rather than writing a number into copy — the window is not
 * the same on every plan.
 *
 * Note the promise is administered by hand ("message us"), deliberately: seeing
 * every request is what makes a pattern of abuse visible. So treat the number
 * as the floor advertised, not a limit to enforce to the hour.
 */
export function refundWindowDays(slug?: string | null): number {
  return findPlan(slug)?.refundWindowDays ?? DEFAULT_REFUND_WINDOW_DAYS;
}

export function getStripePriceId(plan: BitLinkPlan) {
  return process.env[plan.stripeEnvKey] ?? "";
}

// Annatel plan name strings — must match exactly what Annatel returns from /plans catalog.
// Updated June 2026 from production API probe.
const ANNATEL_PLAN_NAMES: Record<PlanSlug, string> = {
  "basic":        "PLAN_BITLINK_NATIONAL_1000MIN_1GB_202606",
  "student-5g":   "PLAN_BITLINK_NATIONAL_5000MIN_50GB_202606",
  "max-5g":       "PLAN_BITLINK_NATIONAL_5000MIN_USA_300MIN_200GB_202607",
  "max-5g-120":   "PLAN_BITLINK_NATIONAL_5000MIN_USA_150MIN_120GB_202606",
  "kosher-basic": "PLAN_BITLINK_KOSHER_NATIONAL_5000MIN_202606",
  "kosher-plus":  "PLAN_BITLINK_KOSHER_NATIONAL_5000MIN_USA_150MIN_202606",
};

export function getAnnatelPlanName(slug: string): string {
  return ANNATEL_PLAN_NAMES[slug as PlanSlug] ?? slug;
}
