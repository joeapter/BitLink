import type { PlanSlug } from "@/lib/plans";

export const bitlinkVoiceRule =
  "Clear, calm, human, premium. Use exact telecom terms only where they help the customer understand the service. Never write for Google at the expense of trust.";

export type LandingPageContent = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  intro: string;
  primaryCta: {
    href: string;
    label: string;
  };
  secondaryCta: {
    href: string;
    label: string;
  };
  highlights: Array<{
    title: string;
    body: string;
  }>;
  details: Array<{
    title: string;
    body: string;
  }>;
  planSlugs: PlanSlug[];
  finalHeading: string;
  finalBody: string;
};

export const landingPages = {
  israelEsim: {
    slug: "/israel-esim",
    metaTitle: "Israel eSIM Plans",
    metaDescription:
      "BitLink helps you choose an Israeli phone plan, activate by eSIM when compatible, and get human support if setup gets confusing.",
    eyebrow: "Israel eSIM",
    h1: "Israel eSIM, with a person behind the setup.",
    intro:
      "BitLink is built for people who want Israeli phone service to feel handled. Choose a monthly plan, activate by eSIM when your device supports it, and get guidance from someone real if the setup starts to feel unclear.",
    primaryCta: {
      href: "/plans",
      label: "View plans",
    },
    secondaryCta: {
      href: "/support",
      label: "Ask about eSIM",
    },
    highlights: [
      {
        title: "An Israeli number",
        body: "Plans are built around a real Israeli phone number, not a temporary workaround.",
      },
      {
        title: "eSIM where it fits",
        body: "Standard plans can support eSIM or physical SIM. We keep the activation path clear before you commit.",
      },
      {
        title: "Support after checkout",
        body: "If activation gets confusing, BitLink support stays close to the process.",
      },
    ],
    details: [
      {
        title: "Useful for arrival, study, and longer stays",
        body: "An eSIM can be the simplest way to get connected without waiting for a physical card, especially when your phone is compatible and your plan includes data.",
      },
      {
        title: "Still clear when eSIM is not the right fit",
        body: "Some phones, plan types, and kosher setups need a physical SIM. The point is not to force one activation method. It is to make the right one easy to understand.",
      },
    ],
    planSlugs: ["student-5g", "max-5g", "basic"],
    finalHeading: "Start with the plan. We will help with the setup.",
    finalBody:
      "Choose the monthly plan that matches your phone use, then let BitLink guide the activation path from there.",
  },
  studentPlans: {
    slug: "/israeli-phone-plans-for-students",
    metaTitle: "Israeli Phone Plans for Students",
    metaDescription:
      "Simple Israeli phone plans for students, with monthly pricing, eSIM options, data choices, and human support from BitLink.",
    eyebrow: "Student phone service",
    h1: "Israeli phone plans for students who need the basics handled.",
    intro:
      "Study, housing, banking, travel, and family calls already create enough logistics. BitLink keeps phone service clear: an Israeli number, monthly plans, guided activation, and support from a real person.",
    primaryCta: {
      href: "/plans",
      label: "Compare student plans",
    },
    secondaryCta: {
      href: "/support",
      label: "Talk through options",
    },
    highlights: [
      {
        title: "Enough data for real use",
        body: "Student and Max plans are shaped around everyday data, local calls, and messages.",
      },
      {
        title: "Family stays reachable",
        body: "Selected plans can add a US, Canadian, or UK local number for people calling from home.",
      },
      {
        title: "Setup is not left to chance",
        body: "Checkout, activation, and support are connected so you know where things stand.",
      },
    ],
    details: [
      {
        title: "Built for the first weeks in Israel",
        body: "A working Israeli number can matter quickly: forms, rides, contacts, school, appointments, and basic day-to-day coordination.",
      },
      {
        title: "A calmer way to choose",
        body: "The plan pages show the monthly price, data, calls, texts, activation method, and add-on notes before checkout.",
      },
    ],
    planSlugs: ["student-5g", "max-5g", "basic"],
    finalHeading: "Choose the plan that matches the semester, not the sales pitch.",
    finalBody:
      "If you are unsure how much data you need, start with the comparison and ask support before checkout.",
  },
  kosherPlans: {
    slug: "/kosher-phone-plans-israel",
    metaTitle: "Kosher Phone Plans in Israel",
    metaDescription:
      "BitLink kosher phone plans for certified kosher phones, with clear voice-only options, physical SIM activation, and human support.",
    eyebrow: "Kosher phone plans",
    h1: "Kosher phone plans with clear limits and real support.",
    intro:
      "Kosher phone service should be straightforward about what is included and what is not. BitLink kosher plans are voice-only options for certified kosher phones, with physical SIM activation and support that keeps the details visible.",
    primaryCta: {
      href: "/plans",
      label: "View kosher plans",
    },
    secondaryCta: {
      href: "/support",
      label: "Ask before choosing",
    },
    highlights: [
      {
        title: "Voice-first plans",
        body: "Kosher Basic and Kosher+ are designed around calling, not data bundles.",
      },
      {
        title: "Physical SIM activation",
        body: "Kosher plans use a physical SIM and require a certified kosher phone.",
      },
      {
        title: "International connection when needed",
        body: "Kosher+ includes minutes to US and Canadian numbers for staying close to family.",
      },
    ],
    details: [
      {
        title: "No hidden data promise",
        body: "The kosher plans are clear about data and SMS limits. If you need internet service, compare the standard phone plans instead.",
      },
      {
        title: "Ask before checkout if compatibility matters",
        body: "If you are choosing for a specific device or community requirement, support can help confirm the right path before you pay.",
      },
    ],
    planSlugs: ["kosher-basic", "kosher-plus"],
    finalHeading: "Keep the plan simple, and the expectations clear.",
    finalBody:
      "Review the included minutes, device requirements, and plan contract before choosing a kosher plan.",
  },
} satisfies Record<string, LandingPageContent>;

export const faqItems = [
  {
    question: "Can BitLink set me up with an Israeli phone number?",
    answer:
      "Yes. BitLink plans are built around Israeli phone service, with plan details shown before checkout and activation handled after payment confirmation. Service is subject to availability, eligibility, and final BitLink confirmation.",
  },
  {
    question: "Can I use eSIM?",
    answer:
      "Standard BitLink plans can support eSIM or physical SIM, depending on your device and setup. Kosher plans use a physical SIM. If eSIM compatibility is important, ask support before checkout.",
  },
  {
    question: "Which plan is meant for students?",
    answer:
      "Student 5G is designed for most student use. Max 5G is the heavier-data option. Basic is a simpler starting point for lighter phone use.",
  },
  {
    question: "Do kosher plans include data or SMS?",
    answer:
      "No. Kosher Basic and Kosher+ are voice-only plans for certified kosher phones. They use a physical SIM and do not include data or SMS.",
  },
  {
    question: "Can family in the US or Canada reach me more easily?",
    answer:
      "Selected plans can add a US, Canadian, or UK local number for an additional monthly fee. Max 5G and Kosher+ also include a set amount of calling to US and Canadian numbers.",
  },
  {
    question: "Can I keep my international number?",
    answer:
      "Yes — porting an existing US, UK, or Canadian number to your BitLink line is available. It is an honest process: it costs an additional $49.99 fee and typically takes up to 3 business days to complete. If this is important to you, reach out before checkout so the team can walk you through the steps.",
    action: {
      label: "Find out more",
      href: "https://wa.me/972587939426?text=I%20would%20like%20more%20info%20about%20Porting%20My%20existing%20international%20number",
    },
  },
  {
    question: "Can I keep my Israeli number?",
    answer:
      "Yes. Porting an existing Israeli mobile number is straightforward. It generally feels instant and the switch typically completes within 5 to 10 minutes.",
  },
  {
    question: "How do I get help with activation?",
    answer:
      "Use the support page to reach BitLink by WhatsApp, email, phone, or support ticket. A real team member can help with activation, eSIM setup, billing, plan changes, or service questions.",
  },
];
