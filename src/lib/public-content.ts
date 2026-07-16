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
  comparisonTable?: {
    heading: string;
    body?: string;
    columns: [string, string];
    rows: Array<{
      label: string;
      a: string;
      b: string;
    }>;
  };
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
    h1: "Israel eSIM with a real Israeli phone number.",
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
    comparisonTable: {
      heading: "Travel eSIM vs. a BitLink Israel eSIM",
      body: "Travel eSIMs are a fine way to buy pure data. The difference is the phone number — and everything in Israel that depends on having one.",
      columns: ["Travel eSIM (data-only)", "BitLink Israel eSIM"],
      rows: [
        {
          label: "Israeli phone number (+972)",
          a: "No — data only",
          b: "Yes — included with every plan",
        },
        {
          label: "Israeli SMS verification codes (banks, Bit, Pango, deliveries)",
          a: "No",
          b: "Yes",
        },
        {
          label: "Calls to and from Israeli numbers",
          a: "Internet calls only",
          b: "Included minutes on every plan",
        },
        {
          label: "5G data in Israel",
          a: "Yes",
          b: "Yes — 1GB to 120GB monthly",
        },
        {
          label: "After your trip",
          a: "Expires",
          b: "Cancel anytime, or pause for $10/mo and keep your number",
        },
        {
          label: "Help when setup gets confusing",
          a: "App and email self-serve",
          b: "Real people on WhatsApp, in English",
        },
      ],
    },
    planSlugs: ["student-5g", "max-5g", "basic"],
    relatedLinks: [
      { href: "/keep-your-number", label: "Porting your number" },
      { href: "/israeli-phone-plans-for-olim", label: "Phone plans for new olim" },
    ],
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
          "BitLink phone plans in Israel range from $14.99 to $39.99 per month, with no contract beyond the monthly term, VAT included, and no hidden fees. Basic is $14.99/month with 1GB of 5G data, 1,000 minutes, and 500 SMS — a fit for light, occasional use. Student 5G is $34.99/month with 50GB of data, 5,000 minutes, and 1,000 SMS, and is BitLink's most popular plan among students. Max 5G is $39.99/month with 120GB of data, 5,000 minutes, 1,000 SMS, and 150 minutes of calling to US and Canadian numbers, built for heavier daily use. Every plan can activate by eSIM or physical SIM, and a US, Canadian, or UK local number can be added to any plan for an extra $9.99/month — family back home calls you like a local call, and the number receives US verification texts too.",
      },
      {
        question: "How much data do I need for a semester in Israel?",
        answer:
          "Most students studying in Israel are comfortable with 50GB per month, which is what BitLink's Student 5G plan includes for $34.99/month — enough for daily maps, messaging, social media, and moderate streaming over 5G. If you stream video heavily, use your phone as a mobile hotspot for a laptop, or expect to be away from campus Wi-Fi often, Max 5G's 120GB for $39.99/month gives more headroom and adds 150 minutes of US/Canada calling. For lighter use — mostly messaging and occasional browsing — Basic's 1GB for $14.99/month can be enough, though most students outgrow it within the first week. If you're unsure, BitLink support can help estimate usage from your typical phone habits before you choose.",
      },
      {
        question: "Do I need an Israeli bank account or credit card?",
        answer:
          "No. Checkout is online and priced in US dollars with VAT included, so a regular US, UK, or Canadian card works — which is also why many parents simply pay for the line from home while the student uses it in Israel. There's no in-store visit and no Israeli bank account required to get started, a real difference from signing up with a traditional Israeli carrier. If anything extra is ever needed for your specific situation, [support](/support) will tell you before you pay, not after.",
      },
      {
        question: "Can I set up my Israeli number before I fly?",
        answer:
          "Yes, and it's the order of operations most students should use. Checkout happens online from anywhere, and on an eSIM-compatible phone the activation QR code arrives by email within minutes of payment — so your Israeli number can be live before you board, and your phone connects the moment you land. No airport SIM kiosk, no first-week scramble. If your program requires a kosher device, the physical-SIM kosher plans take a little more planning around your arrival date, and [support](/support) will help you time it.",
      },
    ],
    planSlugs: ["student-5g", "max-5g", "basic"],
    relatedLinks: [
      { href: "/israeli-phone-plans-for-olim", label: "Phone plans for new olim" },
      { href: "/yeshiva-seminary-phone-plans", label: "Yeshiva & seminary plans" },
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
          "BitLink phone plans range from $14.99 to $39.99 per month, with no long-term contract beyond the monthly term, VAT included, and no hidden fees. Basic is $14.99/month with 1GB of 5G data, 1,000 minutes, and 500 SMS, a fit for light use while you're getting settled. Student 5G is $34.99/month with 50GB of data, 5,000 minutes, and 1,000 SMS, BitLink's most popular plan for everyday use. Max 5G is $39.99/month with 120GB of data, 5,000 minutes, 1,000 SMS, and 150 minutes of calling to US and Canadian numbers built in, which tends to suit olim families staying in close touch with relatives abroad during the first year. Every plan can activate by eSIM or physical SIM, and a US, Canadian, or UK local number can be added to any plan for an extra $9.99/month — it receives US verification texts as well as calls.",
      },
      {
        question: "Do I need an Israeli phone number for banks, Kupat Cholim, and apps like Bit?",
        answer:
          "Practically, yes. Israeli banks, Kupat Cholim, government services, delivery companies, and everyday apps like Bit and Pango verify you by sending an SMS code to an Israeli mobile number — and most of them won't accept a foreign number or a data-only travel eSIM. That's why a real Israeli number is one of the first things to sort out during klita: without one, you can find yourself unable to open a bank account, register with a kupah, or pay for parking. Every BitLink plan includes a real Israeli number, so verification codes, callbacks from the bank, and appointment reminders all just work from day one.",
      },
      {
        question: "Can I set up my phone service before my aliyah flight?",
        answer:
          "Yes. Checkout is online, and on an eSIM-compatible phone the activation QR code arrives by email within minutes of payment — so your Israeli number can be live before your flight, ready for the arrival paperwork that starts almost immediately. If you're also [keeping your US, UK, or Canadian number](/keep-your-number), it's worth messaging support before you travel: the team will confirm your current carrier supports porting and sequence the steps around your arrival date, so nothing overlaps badly during your first week.",
      },
      {
        question: "Which BitLink plan is best for olim staying in touch with family back home?",
        answer:
          "Max 5G, at $39.99/month, is built for exactly that: 120GB of data plus 150 minutes of calling to US and Canadian numbers included at no extra cost, alongside 5,000 Israeli minutes and 1,000 SMS. If family calls you more than you call them, adding a US, Canadian, or UK local number for $9.99/month lets them dial a number that's local to them instead of an international one, on any plan including Basic or Student 5G. For olim without a specific calling pattern yet, Student 5G at $34.99/month with 50GB of data is a reasonable starting point, and BitLink support can help you switch plans later if your usage changes once you're settled.",
      },
      {
        question: "Should I just buy a SIM at the airport when I land?",
        answer:
          "It works on day one, but it's the most common way olim lose their number later. Airport and kiosk SIMs are often registered to the seller rather than to you — and an Israeli number port has to match the original registration, so a number that was never registered to you usually can't follow you to a real plan. Idle prepaid numbers also expire within roughly 6–12 months. Since the bank, Misrad HaPnim, and gov.il will all know you by whatever number you give them in week one, it's worth starting with a number you actually own — [the airport SIM trap guide](/guides/airport-sim-trap-israel) covers the full mechanics, including what to do if you're already registered everywhere with an airport number.",
      },
    ],
    planSlugs: ["max-5g", "student-5g", "basic"],
    relatedLinks: [
      { href: "/aliyah", label: "Aliyah phone service" },
      { href: "/us-number-in-israel", label: "US number add-on" },
      { href: "/israeli-phone-plans-for-students", label: "Student phone plans" },
    ],
    finalHeading: "Choose the plan that fits your klita, not just your data.",
    finalBody:
      "If you are unsure how much data or calling you need for the first few months, start with the comparison and ask support before checkout.",
  },
  keepYourNumber: {
    slug: "/keep-your-number",
    metaTitle: "Keep Your Number — Port to BitLink",
    metaDescription:
      "Port your Israeli number to BitLink free in about 5–10 minutes, or bring your US, UK, or Canadian number for $49.99. Your old number stays live until the switch completes.",
    eyebrow: "Number porting",
    h1: "Keep your number. Switch to BitLink in minutes.",
    intro:
      "Porting an Israeli mobile number to BitLink is free and typically completes in 5 to 10 minutes. Bringing a US, UK, or Canadian number takes 3 to 5 business days and a one-time $49.99 fee. Either way, your old number stays active until the moment the switch completes — so you're never unreachable in between.",
    primaryCta: {
      href: "/plans",
      label: "Choose your plan",
    },
    secondaryCta: {
      href: "/support",
      label: "Ask about porting",
    },
    highlights: [
      {
        title: "Israeli numbers: minutes, not days",
        body: "Both carriers run on Israeli telecom infrastructure, so the port generally feels instant — typically 5 to 10 minutes once initiated, with no porting fee.",
      },
      {
        title: "US, UK & Canadian numbers welcome",
        body: "International porting carries a one-time $49.99 fee and typically completes within 3 to 5 business days, coordinated with your current carrier.",
      },
      {
        title: "No gap in service",
        body: "Your old number keeps working until the port completes, so calls and messages arrive throughout the switch.",
      },
    ],
    details: [
      {
        title: "How an Israeli port works",
        body: "Start during signup or afterward through support. You confirm ownership of the number, BitLink initiates the port with your current carrier, and the number goes live on your new line — usually within minutes. Your plan price doesn't change.",
      },
      {
        title: "How an international port works",
        body: "Reach out before checkout so the team can confirm your US, UK, or Canadian carrier supports porting. Once initiated, the port takes 3 to 5 business days, and you keep using your old number normally until it completes. Once live on BitLink, the ported number keeps receiving calls and US texts — including bank and service verification codes, tested with real Chase and Google codes.",
      },
      {
        title: "What you'll need",
        body: "Your current number and proof you own the account. For international ports, your current carrier will typically also ask for an account number and a transfer PIN — support will walk you through where to find them.",
      },
    ],
    qaBlocks: [
      {
        question: "How long does porting my number to BitLink take?",
        answer:
          "It depends on where the number lives. Porting an Israeli mobile number is fast — both your old carrier and BitLink operate on Israeli telecom infrastructure, so the switch typically completes within 5 to 10 minutes of being initiated and feels close to instant from your side. Porting an international number from the US, UK, or Canada involves coordination with your current carrier abroad, so it typically takes 3 to 5 business days. In both cases your old number stays active until the port finishes, so there's no window where people can't reach you. If timing matters — say you're landing on a specific date — [reach out to support](/support) and the team will help you sequence the port around your plans.",
      },
      {
        question: "What does it cost to keep my number?",
        answer:
          "Porting an Israeli number to BitLink is free — there's no fee on top of your monthly plan. Porting an international number from the US, UK, or Canada carries a one-time $49.99 fee, which covers the coordination with your current carrier abroad. BitLink states this up front rather than burying it: it's the real cost, there are no other porting charges, and your monthly plan price is unaffected either way. Compare that with keeping an old US plan alive just to hold onto the number — often $10–$40 every month — and a one-time port usually pays for itself quickly.",
      },
      {
        question: "Does my old number stay active during the port?",
        answer:
          "Yes. Number porting is designed so the old line keeps working until the new one takes over. For Israeli ports that window is minutes; for international ports it can be 3 to 5 business days — and through that whole period your existing SIM keeps receiving calls and messages as normal. The handover itself is the moment your number goes live on BitLink, and the team confirms with you once it's complete.",
      },
      {
        question: "Can I start the porting process before I arrive in Israel?",
        answer:
          "Yes — and for international numbers it's actually the smart order of operations. [Message support](/support) before you travel: the team confirms your current US, UK, or Canadian carrier supports porting, tells you exactly which details to gather (usually an account number and transfer PIN), and maps the steps around your arrival date. Israeli number ports happen once your BitLink line is active, which itself takes only minutes by eSIM — so even that can be done on the day you land.",
      },
      {
        question: "Will my US bank and verification texts still arrive after porting?",
        answer:
          "Yes. A number ported to BitLink stays a real, live mobile number — calls and SMS keep arriving on your phone in Israel, including the verification codes US banks and services send. This has been tested with real Chase and Google codes arriving on a BitLink US number. It's the key difference from parking a number on a VoIP or forwarding service, which financial institutions often refuse to text: a ported BitLink number keeps the logins that depend on it working. As with any port, test your most important accounts while your old plan is still active — good practice regardless of carrier.",
      },
      {
        question: "Can I port my number out of BitLink later?",
        answer:
          "Yes — any time, to any Israeli carrier, and BitLink deliberately keeps that door open. Every BitLink line is left open for porting out: no blocks, no release process to chase, no exit fee, and an Israeli port completes in minutes. This matters more than it sounds — many prepaid and kiosk SIMs in Israel are registered in a way that makes the number effectively unportable later ([the airport SIM trap](/guides/airport-sim-trap-israel) explains how people get stuck). BitLink's position is simple: your number is yours, and we'd rather keep customers with good service than with a locked door.",
      },
    ],
    planSlugs: ["student-5g", "max-5g", "basic"],
    relatedLinks: [
      { href: "/israel-esim", label: "Israel eSIM" },
      { href: "/israeli-phone-plans-for-olim", label: "Phone plans for new olim" },
    ],
    finalHeading: "Bring the number everyone already has.",
    finalBody:
      "Choose a plan, tell us which number you're keeping, and BitLink handles the switch with your old carrier.",
  },
  yeshivaPlans: {
    slug: "/yeshiva-seminary-phone-plans",
    metaTitle: "Yeshiva & Seminary Phone Plans in Israel",
    metaDescription:
      "Phone plans for yeshiva and seminary students: kosher lines recognized by Vaadat Harabanim from $19.99/mo, standard student plans from $14.99/mo, USD billing parents can pay from abroad.",
    eyebrow: "Yeshiva & seminary",
    h1: "Phone plans for yeshiva and seminary students in Israel.",
    intro:
      "BitLink covers both paths a yeshiva or seminary student might need: voice-only kosher plans from $19.99/month on lines recognized by Vaadat Harabanim L'inyanei Tikshoret, and standard student plans from $14.99/month for programs that allow smartphones. Parents pay in USD from abroad, support answers in English, and the setup is guided from checkout to first call.",
    primaryCta: {
      href: "/plans",
      label: "Compare plans",
    },
    secondaryCta: {
      href: "/support",
      label: "Ask about school requirements",
    },
    highlights: [
      {
        title: "Kosher lines, properly recognized",
        body: "BitLink's kosher lines are recognized by Vaadat Harabanim L'inyanei Tikshoret (registered association no. 580440824) — the recognition yeshivos and kosher-phone communities look for.",
      },
      {
        title: "Parents pay from abroad",
        body: "Plans are priced and charged in USD with VAT included, so a parent in the US, UK, or Canada pays with their own card while the line runs on the student's phone in Israel.",
      },
      {
        title: "A standard path where it's allowed",
        body: "For programs that permit smartphones, Student 5G gives 50GB of data, 5,000 minutes, and 1,000 SMS for $34.99/month — BitLink's most popular plan.",
      },
    ],
    details: [
      {
        title: "Check your program's phone policy first",
        body: "Many yeshivos require certified kosher devices; many seminaries allow smartphones with conditions. The policy decides which BitLink path fits, so confirm it before buying a device — and ask support if you're unsure which plan matches a specific school's rules.",
      },
      {
        title: "Arrive with the phone already working",
        body: "Standard plans can activate by eSIM within minutes of checkout, before you fly. Kosher plans use a physical SIM, so they take a little more planning — support will help you time it around your arrival.",
      },
      {
        title: "For administrators: partner with BitLink",
        body: "Yeshivos, seminaries, and shuls can get a dedicated signup link for their students, with referrals tracked and the institution supported through BitLink's referral program. Reach out through the support page to set one up for your school.",
      },
    ],
    qaBlocks: [
      {
        question: "Do yeshivas and seminaries require kosher phones?",
        answer:
          "It varies by institution, and the school's policy — not the carrier — is what decides. Many chareidi yeshivos require a certified kosher device on a recognized kosher line, in which case [Kosher Basic](/plans/kosher-basic) ($19.99/month) or [Kosher+](/plans/kosher-plus) ($24.99/month, adds 150 US/Canada minutes) is the right path. Many seminaries and yeshivos permit smartphones, sometimes with a filtering requirement, where [Student 5G](/plans/student-5g) at $34.99/month fits most students. Check with the school office before buying a device — and if the policy is ambiguous, [BitLink support](/support) can tell you which plans other students at the same program typically use.",
      },
      {
        question: "Are BitLink's kosher lines accepted by yeshivos?",
        answer:
          "BitLink's kosher lines are recognized by Vaadat Harabanim L'inyanei Tikshoret — the Rabbinical Committee for Communications, registered association no. 580440824 — which is the recognition kosher-phone communities and institutions generally look for. The lines are voice-only on a physical SIM and require a certified kosher phone. If a school or mashgiach wants to confirm the certification details before a student signs up, [support](/support) can provide them in writing.",
      },
      {
        question: "Can parents manage and pay for the line from the US?",
        answer:
          "Yes — this is one of the main reasons families choose BitLink. Checkout is online and priced in US dollars with VAT included, so a parent pays with their own card and sees a predictable USD charge each month, not a shekel amount that moves with the exchange rate. Support is in English by WhatsApp, phone, and email, so a parent can ask questions or sort out an issue directly, without needing the student to translate. Adding a [US, Canadian, or UK local number](/us-number-in-israel) for $9.99/month also lets family call the student like a local call — and the number receives US verification texts, so a student's American bank login keeps working from Israel.",
      },
      {
        question: "Does BitLink work with schools directly?",
        answer:
          "Yes. BitLink's organization program gives a yeshiva, seminary, or shul its own signup link to share with incoming students. Signups through the link are tracked, and the institution is supported through BitLink's referral program. It costs the school nothing and gives students a vetted, English-speaking option for a task that otherwise lands on the office staff during the busiest week of the year. Administrators can [reach out through support](/support) to set it up.",
      },
    ],
    planSlugs: ["kosher-basic", "student-5g", "kosher-plus"],
    relatedLinks: [
      { href: "/kosher-phone-plans-israel", label: "Kosher phone plans" },
      { href: "/israeli-phone-plans-for-students", label: "Student phone plans" },
      { href: "/keep-your-number", label: "Porting your number" },
    ],
    finalHeading: "Two clean paths. One clear setup.",
    finalBody:
      "Choose the kosher or standard plan your program calls for — and ask support anything before checkout, device rules included.",
  },
  usNumber: {
    slug: "/us-number-in-israel",
    metaTitle: "US Number in Israel — $9.99/mo Add-On",
    metaDescription:
      "Add a US, Canadian, or UK local number to any BitLink plan for $9.99/month. Family dials a local number, your phone rings in Israel — and US bank & verification texts arrive too.",
    eyebrow: "US / Canada / UK number",
    h1: "A US number that rings — and texts — in Israel.",
    intro:
      "Add a US, Canadian, or UK local number to any BitLink plan for $9.99/month. Family and clients back home dial a number that's local to them — no international dialing, no calling cards — and the call rings your phone in Israel. It works on every plan, including kosher lines. And it's not just calls: the number receives US text messages too, including the verification codes American banks and services send — tested with real Chase and Google codes arriving in Israel.",
    primaryCta: {
      href: "/plans",
      label: "Choose a plan",
    },
    secondaryCta: {
      href: "/support",
      label: "Ask about the add-on",
    },
    highlights: [
      {
        title: "Local on their end",
        body: "Parents, grandparents, and clients dial a regular local number in their own country. For them, calling you costs what any local call costs.",
      },
      {
        title: "Works with every plan",
        body: "The add-on attaches to any BitLink plan — Basic through Max 5G, and US/Canada numbers on the kosher plans too.",
      },
      {
        title: "One account, one bill",
        body: "The number rides alongside your Israeli line for a flat $9.99/month, on the same USD bill — no second carrier to manage.",
      },
    ],
    comparisonTable: {
      heading: "Add-on vs. keeping your old US plan alive",
      body: "A lot of people land in Israel still paying a US carrier just so family can reach them. Here's the honest comparison.",
      columns: ["Keeping your old US plan", "BitLink US/CA/UK add-on"],
      rows: [
        {
          label: "Monthly cost",
          a: "$10–$40+ depending on carrier",
          b: "$9.99 flat, on any plan",
        },
        {
          label: "Where calls ring",
          a: "Your US SIM — with roaming behavior that varies by carrier",
          b: "Your phone in Israel, like any normal call",
        },
        {
          label: "What you manage",
          a: "Two carriers, two bills, two SIMs",
          b: "One BitLink account and bill",
        },
        {
          label: "Bank & verification texts",
          a: "Arrive on the US SIM you're still paying a carrier to keep alive",
          b: "Arrive on the add-on number — tested with real Chase and Google codes",
        },
        {
          label: "Your existing US number",
          a: "Stays hostage to the old plan",
          b: "Can be ported to BitLink for a one-time $49.99 instead",
        },
      ],
    },
    details: [
      {
        title: "How it works",
        body: "The local number is provisioned alongside your Israeli line. When someone dials it from the US, Canada, or the UK, the call comes through to your phone in Israel — they never dial internationally, and you answer as usual.",
      },
      {
        title: "Verification texts work too",
        body: "The number receives US SMS — including the security codes banks and services send. We've tested this with real Chase and Google verification codes arriving on a BitLink US number in Israel. That's a meaningful difference from many VoIP and forwarding services, which financial institutions often refuse to text. As with any number change, test your most important logins while your old line is still active.",
      },
      {
        title: "Add-on or porting — which one?",
        body: "The add-on gives you a new local number for people to call. Porting brings your existing US, UK, or Canadian number onto your BitLink line for a one-time $49.99. If everyone already knows your old number, porting keeps it; if you just want to be easy to reach, the add-on is simpler. Some people do both.",
      },
      {
        title: "Getting it set up",
        body: "Choose your plan first, then ask support to attach the add-on to your line — WhatsApp is the fastest way. The team confirms the country and number details with you before anything is billed.",
      },
    ],
    qaBlocks: [
      {
        question: "How much does a US number in Israel cost?",
        answer:
          "With BitLink, $9.99 per month on top of any plan — so a student on [Student 5G](/plans/student-5g) pays $44.98/month total for an Israeli line plus a US number that family can call locally. The same add-on price covers a Canadian or UK number instead, and US/Canada numbers are available on the kosher plans as well. Compare that with keeping an old US plan alive just to stay reachable, which typically runs $10–$40 per month and leaves you juggling two carriers.",
      },
      {
        question: "Do my parents pay international rates when they call me?",
        answer:
          "No — that's the point of the add-on. Your parents dial a number that's local in their country, and their carrier treats it as a local call, which on most US, Canadian, and UK plans costs nothing extra. The call then rings your phone in Israel. No calling cards, no dialing +972, no explaining international dialing to a grandparent. On your side, answering works like any normal incoming call.",
      },
      {
        question: "Should I add a US number or port my old US number?",
        answer:
          "Ask one question: do people need to reach the number they already have saved? If yes — you've had the same cell number for 15 years and everyone from your dentist to your bank uses it — then [porting it to BitLink](/keep-your-number) for a one-time $49.99 keeps it alive on your Israeli line. If you just want family to have an easy way to call, the $9.99/month add-on gives them a fresh local number and skips the porting process entirely. They solve different problems, and some people do both.",
      },
      {
        question: "Will I get bank verification texts on the US number?",
        answer:
          "Yes — the add-on number receives US text messages, including the verification codes banks and services send. This has been tested with real Chase Mobile and Google verification codes arriving on a BitLink US number in Israel. That matters because many VoIP and forwarding services fail exactly here: financial institutions often refuse to text them, which is how people get locked out of accounts after a move. As with any number change, test your most important logins before retiring the old line. (One exception by design: kosher lines are voice-only, so texts to the add-on don't apply there.)",
      },
      {
        question: "Does the add-on work with kosher plans?",
        answer:
          "Yes. A US or Canadian local number can be added to [Kosher Basic](/plans/kosher-basic) or [Kosher+](/plans/kosher-plus) for the same $9.99/month, and it rings the kosher phone like any other call. Combined with Kosher+'s included 150 minutes of outbound US/Canada calling, a kosher line can stay closely connected with family abroad in both directions.",
      },
    ],
    planSlugs: ["student-5g", "max-5g", "kosher-plus"],
    relatedLinks: [
      { href: "/keep-your-number", label: "Porting your number" },
      { href: "/israeli-phone-plans-for-olim", label: "Phone plans for new olim" },
      { href: "/aliyah", label: "Aliyah phone service" },
    ],
    finalHeading: "Stay a local call away.",
    finalBody:
      "Pick the plan that fits your life in Israel, then ask support to attach the US, Canadian, or UK number to your line.",
  },
  tourists: {
    slug: "/israel-sim-for-tourists",
    metaTitle: "Israel SIM for Tourists — Monthly, No Contract",
    metaDescription:
      "A real Israeli number for your trip: monthly plans from $14.99, eSIM live before you land, cancel when you leave — or pause for $10/mo and keep the number for your next visit.",
    eyebrow: "Visiting Israel",
    h1: "A real Israeli number for your trip — and the next one.",
    intro:
      "BitLink plans are monthly with no contract: from $14.99/month, with eSIM activation that finishes before you even board. Use it for a 2–4 week trip and cancel when you fly home — or pause the line for $10/month and keep your Israeli number waiting for the next visit. Unlike a travel eSIM, you get a real Israeli number that works for calls, SMS codes, and local apps.",
    primaryCta: {
      href: "/plans",
      label: "Choose a plan",
    },
    secondaryCta: {
      href: "/israel-esim",
      label: "How the eSIM works",
    },
    highlights: [
      {
        title: "Land already connected",
        body: "Checkout online from home; the eSIM QR code arrives by email within minutes. Most visitors activate before the flight and skip the airport SIM kiosk entirely.",
      },
      {
        title: "Leave without strings",
        body: "Plans are monthly with no long-term commitment. Fly home, cancel, and you've paid only for the months you used — VAT included, no exit fees.",
      },
      {
        title: "Come back to the same number",
        body: "Visit Israel regularly? Pause the line for $10/month instead of cancelling. Your Israeli number — and everything registered to it — is waiting when you return.",
      },
    ],
    comparisonTable: {
      heading: "Airport SIM & travel eSIM vs. a BitLink plan",
      body: "For a few days of pure data, a travel eSIM is fine. For a real trip — and especially for repeat visits — the math and the experience change.",
      columns: ["Travel eSIM / airport SIM", "BitLink monthly plan"],
      rows: [
        {
          label: "Israeli phone number",
          a: "Data-only, or a temporary number",
          b: "A real +972 number of your own",
        },
        {
          label: "Israeli SMS codes (banks, Bit, Pango, deliveries)",
          a: "Usually don't work",
          b: "Work like a local's phone",
        },
        {
          label: "Setup",
          a: "Kiosk queue on arrival, or per-app fiddling",
          b: "Online checkout — eSIM live before you land",
        },
        {
          label: "Cost shape",
          a: "Per-day or per-GB, adds up fast",
          b: "Flat monthly from $14.99, VAT included",
        },
        {
          label: "Between trips",
          a: "Number gone — start over next visit",
          b: "Pause for $10/mo and keep your number",
        },
        {
          label: "When something breaks",
          a: "Self-serve apps and email queues",
          b: "Real people on WhatsApp, in English",
        },
      ],
    },
    details: [
      {
        title: "Built for 2–4 week trips",
        body: "One month of Student 5G — $34.99 for 50GB, 5,000 local minutes, and 1,000 SMS — usually costs less than stacking travel eSIM data packs for the same stay, and it comes with a number that actually works in Israel. Lighter visits can start at $14.99 with Basic.",
      },
      {
        title: "The repeat-visitor move: pause, don't cancel",
        body: "Chagim regulars, parents visiting kids in yeshiva or seminary, families with one foot in Israel: pause the line for $10/month right from your account between trips. The number stays yours for up to 18 months per pause, and on your next visit everything simply works again — no new SIM, no re-registering apps.",
      },
      {
        title: "Staying longer than a visit?",
        body: "If the trip is really a semester or a move, the student and olim guides cover data sizing, porting, and family calling in more depth — same plans, different questions.",
      },
    ],
    qaBlocks: [
      {
        question: "What's the best SIM card for tourists in Israel?",
        answer:
          "It depends on what your trip needs. For a few days of maps and WhatsApp on Wi-Fi-adjacent travel, a data-only travel eSIM is genuinely fine and often cheapest. The switch point is needing a real Israeli phone number: receiving calls, getting SMS verification codes from Israeli banks and apps like Bit and Pango, ordering deliveries, or staying multiple weeks. Travel eSIMs don't do those things — they're data pipes. A BitLink monthly plan from $14.99 (VAT included, no contract) includes a real Israeli number and activates by eSIM before you land, and for a 2–4 week stay [Student 5G](/plans/student-5g) at $34.99 with 50GB usually beats stacking travel data packs.",
      },
      {
        question: "Can I get an Israeli SIM before I arrive?",
        answer:
          "Yes — that's the normal BitLink flow, not a special case. Check out online from home, and on an eSIM-compatible phone the activation QR code arrives by email within minutes of payment. Install it before your flight and your Israeli number is live when the wheels touch down: rides, family, and hotel confirmations all work from the arrivals hall. If your phone needs a physical SIM, [support](/support) will help you time delivery around your trip instead.",
      },
      {
        question: "What happens to my number when I leave Israel?",
        answer:
          "Your choice, and both options are clean. Cancel, and you've simply paid for the months you used — no exit fees, no contract tail. Or pause the line for $10/month right from your account and keep the number: service freezes immediately, the month you've already paid for runs to the end of its billing cycle, and the $10/month pause rate starts on your next billing date. The number stays registered to you — app and WhatsApp registrations intact — and resumes instantly when you're back. Two honest limits: a paused line is held for up to 18 months (after that it may be cancelled and the number lost), and when you resume, your regular billing restarts that day. If you visit Israel more than once a year, pausing is almost always worth it.",
      },
      {
        question: "How much does a phone plan cost for a month in Israel?",
        answer:
          "With BitLink: [Basic](/plans/basic) is $14.99/month with 1GB of 5G data for light use, [Student 5G](/plans/student-5g) is $34.99/month with 50GB — the right size for most multi-week visits — and [Max 5G](/plans/max-5g) is $39.99/month with 120GB plus 150 minutes of calling to US and Canadian numbers. All prices are in USD with VAT included, there's no contract beyond the month, and every plan includes a real Israeli number with eSIM or physical SIM activation.",
      },
    ],
    planSlugs: ["student-5g", "basic", "max-5g"],
    relatedLinks: [
      { href: "/israel-esim", label: "Israel eSIM" },
      { href: "/keep-your-number", label: "Porting your number" },
      { href: "/israeli-phone-plans-for-olim", label: "Phone plans for new olim" },
    ],
    finalHeading: "One trip or twenty. Same number.",
    finalBody:
      "Choose a monthly plan for this visit — and if you'll be back, pause instead of cancelling and keep your Israeli number.",
  },
} satisfies Record<string, LandingPageContent>;

export const plansFaqItems = [
  {
    question: "How much does an Israeli phone plan cost with BitLink?",
    answer:
      "Standard plans run from $14.99/month ([Basic](/plans/basic), 1GB) to $39.99/month ([Max 5G](/plans/max-5g), 120GB plus US/Canada minutes), with [Student 5G](/plans/student-5g) at $34.99/month the most popular. Kosher voice-only plans are $19.99–$24.99/month. Every price is in US dollars with VAT included and no hidden fees — the price on the page is the price on your statement.",
  },
  {
    question: "Am I locked into a contract?",
    answer:
      "No. All BitLink plans are monthly with no long-term commitment. You can cancel anytime, switch plans as your usage changes, or pause your line for $10/month from your account to keep your Israeli number between stays in Israel. Pausing takes effect immediately, the $10 rate starts at your next billing date, and a paused line is held for up to 18 months.",
  },
  {
    question: "Are the prices really in US dollars?",
    answer:
      "Yes — plans are priced and charged in USD, unlike Israeli carriers that bill in shekels. That means no currency-conversion surprises on your statement, and a parent or family member abroad can pay for a student's line with their own card. VAT is already included in every price shown.",
  },
  {
    question: "Can I keep my current phone number?",
    answer:
      "Yes. Israeli numbers port to BitLink free, typically in 5–10 minutes. US, UK, and Canadian numbers can be ported for a one-time $49.99 fee, typically within 3 to 5 business days. See [how porting works](/keep-your-number) for the details.",
  },
];

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
    question: "Can I use BitLink for a short trip to Israel?",
    answer:
      "Yes. BitLink plans are monthly with no long-term commitment, so a 2–4 week visit works fine: choose a [plan](/plans), activate by eSIM within minutes of checkout (or by physical SIM), and cancel when you leave — you pay for the months you use, VAT included. Unlike a travel eSIM, a BitLink plan includes a real Israeli phone number, so calls, SMS verification codes, and local services work like a resident's phone from day one. And if you visit Israel regularly, there's a smarter option than cancelling: pause your line for $10/month right from your account and keep your Israeli number between trips — no new SIM, no new number, and everything simply works again the next time you land. The pause takes effect immediately, the $10/month rate starts at your next billing date (your current paid month runs its course), and a paused line is held for up to 18 months — after that it may be cancelled and the number released.",
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
      "Yes — [porting an existing US, UK, or Canadian number](/keep-your-number) onto your BitLink line is available, and BitLink is upfront about the real cost and timeline rather than glossing over it. International porting carries an additional $49.99 fee on top of your plan price and typically takes 3 to 5 business days to complete, since it involves coordination with your current international carrier rather than just BitLink's own network. During that window your old number stays active until the port finishes, so there's usually no gap in service. This is different from porting an Israeli number, which is far faster. If keeping your existing international number matters to you, [reach out to the team](/support) before checkout — they'll confirm your carrier supports porting and walk you through the steps so there are no surprises.",
    action: {
      label: "Find out more",
      href: "https://wa.me/972555195335?text=I%20would%20like%20more%20info%20about%20Porting%20My%20existing%20international%20number",
    },
  },
  {
    question: "Can I keep my Israeli number?",
    answer:
      "Yes, and it's a much simpler process than international porting. Because both your old carrier and BitLink operate on Israeli telecom infrastructure, [porting an existing Israeli mobile number](/keep-your-number) is straightforward and doesn't carry the multi-day coordination that international porting does. It generally feels instant from the customer's side and typically completes within 5 to 10 minutes once initiated. There's no separate porting fee for Israeli numbers the way there is for international ones. You can start the process during signup or afterward [through support](/support), and BitLink will confirm once the switch to your new line is complete.",
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
