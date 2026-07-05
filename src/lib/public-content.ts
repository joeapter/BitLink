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
  qaBlocks: Array<{
    question: string;
    answer: string;
  }>;
  planSlugs: PlanSlug[];
  relatedLinks?: Array<{
    href: string;
    label: string;
  }>;
  finalHeading: string;
  finalBody: string;
};

export const landingPages = {
  israelEsim: {
    slug: "/israel-esim",
    metaTitle: "Israel eSIM with a Real Israeli Phone Number",
    metaDescription:
      "Unlike travel eSIMs, BitLink includes an Israeli number — for banks, SMS codes, and calls. Activate in minutes from $14.99/month. Human help if setup gets confusing.",
    eyebrow: "Israel eSIM",
    h1: "Israel eSIM, with a person behind the setup.",
    intro:
      "Yes — Israel supports eSIM, and BitLink's standard plans (Basic, Student 5G, and Max 5G) activate by eSIM on compatible devices, with a physical SIM available as a backup. Choose a monthly plan from $14.99, and get guidance from a real person if the setup starts to feel unclear.",
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
    qaBlocks: [
      {
        question: "Does Israel support eSIM?",
        answer:
          "Yes. Israel's mobile networks support eSIM, and BitLink's standard plans — Basic, Student 5G, and Max 5G — can activate on an eSIM if your device is unlocked and eSIM-compatible (most iPhones from XS onward and most recent Android flagships qualify). You choose your plan and pay through a secure checkout, then BitLink provisions an Israeli number and emails the eSIM activation QR code once your line is live, which typically takes a few minutes. If your device does not support eSIM, or you would simply rather have a physical card, the same plans ship as a physical SIM instead — nothing about pricing or data changes. Kosher-certified phones require a physical SIM specifically, since kosher devices are not built to support eSIM activation. If you are not sure which category your phone falls into, BitLink support can confirm compatibility over WhatsApp before you check out.",
      },
      {
        question: "How much data is included with an Israel eSIM?",
        answer:
          "It depends on the plan, not the activation method — eSIM and physical SIM draw from the same data allowances. Basic includes 1GB of high-speed 5G data for $14.99/month, enough for light use like messaging and maps. Student 5G includes 50GB for $34.99/month, BitLink's most popular plan, sized for daily social media, navigation, and moderate streaming. Max 5G includes 120GB for $39.99/month and adds 150 minutes of calling to US and Canadian numbers, built for people who stream heavily or use their phone as a hotspot. Basic includes 1,000 minutes and 500 SMS to Israeli numbers; Student 5G and Max 5G include 5,000 minutes and 1,000 SMS. All plans include VAT and no hidden fees. If you are unsure how much data you typically use per month, BitLink support can help you estimate before you commit to a plan.",
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
      "Student phone plans in Israel from BitLink start at $34.99/month for Student 5G — 50GB of data, 5,000 local minutes, and 1,000 SMS, our most popular plan. Study, housing, banking, and family calls already create enough logistics; BitLink keeps phone service clear with an Israeli number, guided activation, and support from a real person.",
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
    qaBlocks: [
      {
        question: "How much does a phone plan cost in Israel?",
        answer:
          "BitLink phone plans in Israel range from $14.99 to $39.99 per month, with no contract beyond the monthly term, VAT included, and no hidden fees. Basic is $14.99/month with 1GB of 5G data, 1,000 minutes, and 500 SMS — a fit for light, occasional use. Student 5G is $34.99/month with 50GB of data, 5,000 minutes, and 1,000 SMS, and is BitLink's most popular plan among students. Max 5G is $39.99/month with 120GB of data, 5,000 minutes, 1,000 SMS, and 150 minutes of calling to US and Canadian numbers, built for heavier daily use. Every plan can activate by eSIM or physical SIM, and a US, Canadian, or UK local number can be added to any plan for an extra $9.99/month so family back home can call you like a local call.",
      },
      {
        question: "How much data do I need for a semester in Israel?",
        answer:
          "Most students studying in Israel are comfortable with 50GB per month, which is what BitLink's Student 5G plan includes for $34.99/month — enough for daily maps, messaging, social media, and moderate streaming over 5G. If you stream video heavily, use your phone as a mobile hotspot for a laptop, or expect to be away from campus Wi-Fi often, Max 5G's 120GB for $39.99/month gives more headroom and adds 150 minutes of US/Canada calling. For lighter use — mostly messaging and occasional browsing — Basic's 1GB for $14.99/month can be enough, though most students outgrow it within the first week. If you're unsure, BitLink support can help estimate usage from your typical phone habits before you choose.",
      },
    ],
    planSlugs: ["student-5g", "max-5g", "basic"],
    relatedLinks: [
      { href: "/israeli-phone-plans-for-olim", label: "Phone plans for new olim" },
      { href: "/students", label: "BitLink for students" },
    ],
    finalHeading: "Choose the plan that matches the semester, not the sales pitch.",
    finalBody:
      "If you are unsure how much data you need, start with the comparison and ask support before checkout.",
  },
  kosherPlans: {
    slug: "/kosher-phone-plans-israel",
    metaTitle: "Kosher Phone Plans in Israel",
    metaDescription:
      "Kosher phone plans on lines recognized by Vaadat Harabanim — voice-only service for certified kosher phones from $19.99/month, physical SIM, human support in English.",
    eyebrow: "Kosher phone plans",
    h1: "Kosher phone plans with clear limits and real support.",
    intro:
      "Kosher phone plans in Israel from BitLink start at $19.99/month for 5,000 minutes of voice-only calling on a certified kosher phone, on lines recognized by Vaadat Harabanim L'inyanei Tikshoret. Kosher Basic and Kosher+ are physical-SIM-only by design, with no data or SMS included, and support that keeps every limit visible before checkout.",
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
        title: "Recognized certification, stated plainly",
        body: "BitLink's kosher lines are recognized by Vaadat Harabanim L'inyanei Tikshoret (registered association no. 580440824), the rabbinical committee that oversees kosher phone service in Israel. If your community or institution requires specific certification details, support can confirm them before checkout.",
      },
      {
        title: "Ask before checkout if compatibility matters",
        body: "If you are choosing for a specific device or community requirement, support can help confirm the right path before you pay.",
      },
    ],
    qaBlocks: [
      {
        question: "Are BitLink's kosher lines rabbinically certified?",
        answer:
          "Yes. BitLink's kosher lines are recognized by Vaadat Harabanim L'inyanei Tikshoret — the Rabbinical Committee for Communications, registered association no. 580440824 — the body that oversees kosher phone service in Israel. Both Kosher Basic and Kosher+ run on these recognized kosher lines, require a certified kosher phone, and activate on a physical SIM only. Because the recognition applies to the line itself, the number works the way yeshivos, seminaries, and kosher-phone communities expect a kosher number to work. If your institution or community asks for specific certification details before you sign up, [BitLink support](/support) can confirm everything before you pay, so there are no surprises after checkout.",
      },
      {
        question: "How much does a kosher phone plan cost in Israel?",
        answer:
          "BitLink offers two kosher phone plans in Israel. Kosher Basic is $19.99/month and includes 5,000 minutes of calling to Israeli numbers, voice-only, on a physical SIM. Kosher+ is $24.99/month and includes the same 5,000 Israeli minutes plus 150 minutes of calling to US and Canadian numbers, for staying in touch with family abroad. Both plans require a certified kosher phone and a physical SIM — they do not support eSIM activation, since kosher devices aren't built for it. VAT is included and there are no hidden fees on either plan. A US or Canadian local number can be added to either plan for an extra $9.99/month, letting family back home reach you with a local call instead of an international one.",
      },
      {
        question: "Do kosher phone plans in Israel include data?",
        answer:
          "No. Both Kosher Basic and Kosher+ are voice-only by design — they include calling minutes but no mobile data and no SMS, in line with how certified kosher phones are built and certified. This is a deliberate limit, not a missing feature: if you need internet data on your line, a kosher-certified phone isn't able to use it, so BitLink's standard plans (Basic, Student 5G, Max 5G) are the right comparison instead. Those start at $14.99/month and include 5G data ranging from 1GB to 120GB alongside calls and SMS, but require a standard (non-kosher) device. If you're choosing for a specific community requirement or device, BitLink support can confirm what's compatible before you check out.",
      },
    ],
    planSlugs: ["kosher-basic", "kosher-plus"],
    finalHeading: "Keep the plan simple, and the expectations clear.",
    finalBody:
      "Review the included minutes, device requirements, and plan contract before choosing a kosher plan.",
  },
  olimPlans: {
    slug: "/israeli-phone-plans-for-olim",
    metaTitle: "Israeli Phone Plans for Olim",
    metaDescription:
      "Israeli phone plans for new olim, with monthly pricing, eSIM options, US/Canada calling add-ons, and human support from BitLink.",
    eyebrow: "Phone plans for olim",
    h1: "Israeli phone plans for olim who need the basics handled.",
    intro:
      "Phone plans for new olim in Israel from BitLink start at $14.99/month, with Max 5G at $39.99/month built around staying close to family abroad — 120GB of data plus 150 minutes of calling to US and Canadian numbers. Klita already means enough paperwork and new systems; BitLink keeps phone service simple with a real Israeli number, guided activation, and support from a real person.",
    primaryCta: {
      href: "/plans",
      label: "Compare olim plans",
    },
    secondaryCta: {
      href: "/support",
      label: "Talk through options",
    },
    highlights: [
      {
        title: "An Israeli number from day one",
        body: "Forms, banks, Kupat Cholim, and daily errands go smoother with a working Israeli number from the start.",
      },
      {
        title: "Stay close to family abroad",
        body: "Add a US, Canadian, or UK local number so parents and kids back home can call like it's a local call.",
      },
      {
        title: "Support through klita, not just checkout",
        body: "Activation and account support stay reachable by WhatsApp while you settle in, not just on signup day.",
      },
    ],
    details: [
      {
        title: "Built for the first weeks of aliyah",
        body: "A working Israeli number can matter immediately: Misrad HaPnim appointments, banks, schools, shul, and everyday coordination with a new community.",
      },
      {
        title: "Clear pricing before you commit",
        body: "The plan pages show the monthly price, data, calls, texts, and activation method up front, so there are no surprises after checkout.",
      },
    ],
    qaBlocks: [
      {
        question: "How much does a phone plan cost for new olim in Israel?",
        answer:
          "BitLink phone plans range from $14.99 to $39.99 per month, with no long-term contract beyond the monthly term, VAT included, and no hidden fees. Basic is $14.99/month with 1GB of 5G data, 1,000 minutes, and 500 SMS, a fit for light use while you're getting settled. Student 5G is $34.99/month with 50GB of data, 5,000 minutes, and 1,000 SMS, BitLink's most popular plan for everyday use. Max 5G is $39.99/month with 120GB of data, 5,000 minutes, 1,000 SMS, and 150 minutes of calling to US and Canadian numbers built in, which tends to suit olim families staying in close touch with relatives abroad during the first year. Every plan can activate by eSIM or physical SIM, and a US, Canadian, or UK local number can be added to any plan for an extra $9.99/month.",
      },
      {
        question: "Which BitLink plan is best for olim staying in touch with family back home?",
        answer:
          "Max 5G, at $39.99/month, is built for exactly that: 120GB of data plus 150 minutes of calling to US and Canadian numbers included at no extra cost, alongside 5,000 Israeli minutes and 1,000 SMS. If family calls you more than you call them, adding a US, Canadian, or UK local number for $9.99/month lets them dial a number that's local to them instead of an international one, on any plan including Basic or Student 5G. For olim without a specific calling pattern yet, Student 5G at $34.99/month with 50GB of data is a reasonable starting point, and BitLink support can help you switch plans later if your usage changes once you're settled.",
      },
    ],
    planSlugs: ["max-5g", "student-5g", "basic"],
    relatedLinks: [
      { href: "/aliyah", label: "Aliyah phone service" },
      { href: "/israeli-phone-plans-for-students", label: "Student phone plans" },
    ],
    finalHeading: "Choose the plan that fits your klita, not just your data.",
    finalBody:
      "If you are unsure how much data or calling you need for the first few months, start with the comparison and ask support before checkout.",
  },
} satisfies Record<string, LandingPageContent>;

export const faqItems = [
  {
    question: "Can BitLink set me up with an Israeli phone number?",
    answer:
      "Yes. Every BitLink plan includes a real Israeli phone number, not a temporary workaround. Plans range from $14.99/month for [Basic](/plans/basic) (1GB data, 1,000 minutes, 500 SMS) up to $39.99/month for [Max 5G](/plans/max-5g) (120GB data, 5,000 minutes, plus 150 minutes to US and Canadian numbers). You choose a plan, see the exact data, minutes, and price before checkout, then pay through a secure flow. BitLink provisions your number and line right after payment, and activation is usually ready within 3 to 5 minutes — you can watch the status live in your account portal. Activation can happen by eSIM or physical SIM depending on your plan and device. Service is subject to availability, eligibility, and final BitLink confirmation, but for the vast majority of customers an Israeli number is live and usable the same day they sign up.",
  },
  {
    question: "Can I use eSIM?",
    answer:
      "Yes, for most plans and devices. BitLink's [standard plans](/plans) — Basic, Student 5G, and Max 5G — can activate by eSIM on a compatible, unlocked device, or by physical SIM if you'd rather have a card or your phone doesn't support eSIM. Kosher Basic and Kosher+ always use a physical SIM, since certified kosher phones aren't built for eSIM activation. When eSIM is available, BitLink emails the activation QR code once your line is live, typically within a few minutes of payment confirmation, and you scan it directly from your phone's settings — no waiting for a card to ship. If you're not sure whether your specific device supports eSIM, BitLink support can confirm compatibility over WhatsApp before you check out, so there are no surprises after payment.",
  },
  {
    question: "What mobile network does BitLink use?",
    answer:
      "BitLink runs primarily on the Partner network, one of Israel's major national carriers, with Pelephone — another major Israeli network — as a secondary network. Partner's network has been in commercial operation since 1999, when it launched under the Orange brand — so while BitLink itself is a new company, the infrastructure carrying your calls and data has been serving Israel for over 25 years. In practice that means nationwide coverage and 5G service on the same infrastructure most Israelis use every day, not a small or regional network. There's nothing to choose or configure at checkout: your line is set up on the network automatically when it's provisioned. If you want to sanity-check signal for a specific spot — a yeshiva campus, a moshav, a particular neighborhood — [BitLink support](/support) can tell you what to expect there before you commit to a plan.",
  },
  {
    question: "Which plan is meant for students?",
    answer:
      "[Student 5G](/plans/student-5g), at $34.99/month, is BitLink's most popular plan and the one designed for most student use: 50GB of high-speed 5G data, 5,000 minutes to Israeli numbers, and 1,000 SMS, with an optional US/Canada/UK number add-on for $9.99/month. [Max 5G](/plans/max-5g), at $39.99/month, is the heavier-data option — 120GB of data plus 150 minutes of built-in calling to US and Canadian numbers — for students who stream constantly or use their phone as a hotspot. Basic, at $14.99/month with 1GB of data, 1,000 minutes, and 500 SMS, is a simpler starting point for lighter phone use, though most students studying or living in Israel outgrow 1GB within the first week. All three include an Israeli number, VAT, and no hidden fees, and can activate by eSIM or physical SIM.",
  },
  {
    question: "Do kosher plans include data or SMS?",
    answer:
      "No, and this is intentional rather than a missing feature. [Kosher Basic](/plans/kosher-basic) ($19.99/month) and [Kosher+](/plans/kosher-plus) ($24.99/month) are voice-only plans built for certified kosher phones, which aren't designed to use mobile data or SMS at all. The lines themselves are recognized by Vaadat Harabanim L'inyanei Tikshoret, the Rabbinical Committee for Communications. Kosher Basic includes 5,000 minutes of calling to Israeli numbers on a physical SIM. Kosher+ includes the same 5,000 Israeli minutes plus 150 minutes to US and Canadian numbers, for staying connected with family abroad. Both can add a US or Canadian local number for an extra $9.99/month. If you need mobile data on your line, a kosher-certified device can't support it, so BitLink's standard plans — Basic, Student 5G, and Max 5G, starting at $14.99/month — are the right comparison instead, though they require a standard, non-kosher phone.",
  },
  {
    question: "Can family in the US or Canada reach me more easily?",
    answer:
      "Yes. Any BitLink plan can add a US, Canadian, or UK local number for an additional $9.99/month, so family back home dials a number that's local to them — no international dialing, calling cards, or per-minute international rates on their end. On top of that, [Max 5G](/plans/max-5g) and [Kosher+](/plans/kosher-plus) also include a set amount of built-in calling from your Israeli line to US and Canadian numbers — 150 minutes per month on both plans — at no extra cost. Basic and Student 5G don't include US/Canada minutes by default but can still add the local-number add-on. If staying easily reachable by family abroad matters to you, Max 5G or Kosher+ are the plans built around that specific need.",
  },
  {
    question: "Can I keep my international number?",
    answer:
      "Yes — porting an existing US, UK, or Canadian number onto your BitLink line is available, and BitLink is upfront about the real cost and timeline rather than glossing over it. International porting carries an additional $49.99 fee on top of your plan price and typically takes up to 3 business days to complete, since it involves coordination with your current international carrier rather than just BitLink's own network. During that window your old number stays active until the port finishes, so there's usually no gap in service. This is different from porting an Israeli number, which is far faster. If keeping your existing international number matters to you, [reach out to the team](/support) before checkout — they'll confirm your carrier supports porting and walk you through the steps so there are no surprises.",
    action: {
      label: "Find out more",
      href: "https://wa.me/972587939426?text=I%20would%20like%20more%20info%20about%20Porting%20My%20existing%20international%20number",
    },
  },
  {
    question: "Can I keep my Israeli number?",
    answer:
      "Yes, and it's a much simpler process than international porting. Because both your old carrier and BitLink operate on Israeli telecom infrastructure, porting an existing Israeli mobile number is straightforward and doesn't carry the multi-day coordination that international porting does. It generally feels instant from the customer's side and typically completes within 5 to 10 minutes once initiated. There's no separate porting fee for Israeli numbers the way there is for international ones. You can start the process during signup or afterward [through support](/support), and BitLink will confirm once the switch to your new line is complete.",
  },
  {
    question: "Does BitLink have a referral program?",
    answer:
      "Yes, and it pays in data rather than one-off discounts. Every customer account includes a personal referral link. Each friend who signs up through your link and stays an active customer adds 5GB of bonus data to your plan every month, up to 25GB per month. The bonus is ongoing — it applies each month for as long as your referrals stay active, not just once at signup. Referral and reward status is tracked in your account portal, and the current terms are shown at signup. If you're arriving with a group of friends or bringing several family lines, referrals can meaningfully raise your monthly data at no cost — see the [referral page](/refer) for how it works.",
  },
  {
    question: "How do I get help with activation?",
    answer:
      "Use the [support page](/support) to reach BitLink by WhatsApp, email, phone, or support ticket — whichever channel is easiest for you. A real team member, not a bot, can help with activation status, eSIM setup and QR code issues, physical SIM shipping and tracking, billing questions, plan changes, or general service questions. WhatsApp tends to get the fastest response since it's the channel the support team monitors most closely, and it's the same number used throughout the BitLink site for quick questions. If your issue relates to an order in progress — like an eSIM that hasn't arrived yet or a SIM card still in transit — having your account email ready when you reach out helps the team find your order faster.",
  },
];
