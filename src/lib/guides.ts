export type Guide = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  datePublished: string;
  dateModified: string;
  readingTime: string;
  intro: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
  }>;
  faq: Array<{
    question: string;
    answer: string;
  }>;
  relatedLinks: Array<{
    href: string;
    label: string;
  }>;
};

export const guides: Guide[] = [
  {
    slug: "israeli-phone-number-before-you-land",
    title: "How to get an Israeli phone number before you land",
    metaTitle: "Get an Israeli Phone Number Before You Land",
    metaDescription:
      "Step-by-step: set up a real Israeli number by eSIM from home — checkout online, scan a QR code, and land in Israel already connected. From $14.99/month.",
    datePublished: "2026-07-05",
    dateModified: "2026-07-05",
    readingTime: "5 min read",
    intro:
      "You can have a working Israeli phone number before your flight takes off. If your phone supports eSIM, the whole process — choosing a plan, paying, and activating — takes about ten minutes from your couch, and costs from $14.99/month with no contract. Here's exactly how it works, what you need, and the two situations where you'll want a different path.",
    sections: [
      {
        heading: "Why set it up before you fly",
        paragraphs: [
          "Arrival day in Israel runs on your phone number. The taxi or Gett driver calls it. The landlord, the madricha, the cousin picking you up — they all message it. If you're arriving as a student or new oleh, the paperwork starts almost immediately: banks, Misrad HaPnim, Kupat Cholim, and half the apps in the country verify you with an SMS code sent to an Israeli mobile number.",
          "The old routine — landing, finding a SIM kiosk, queuing, and paying tourist prices — solves this hours or days after you actually needed it. Doing it from home reverses the order: your number exists before your flight does.",
        ],
      },
      {
        heading: "What you need",
        paragraphs: [
          "Three things: an unlocked, eSIM-compatible phone (most iPhones from the XS onward and most recent Android flagships qualify), a credit or debit card — a regular US, UK, or Canadian card works, since [BitLink](/about) prices in USD — and about ten minutes. You don't need an Israeli bank account, an Israeli ID, or anyone in Israel to help you.",
          "Not sure your phone does eSIM? Message [BitLink support on WhatsApp](/support) with your model before paying — the team confirms compatibility so there are no surprises after checkout.",
        ],
      },
      {
        heading: "The steps, start to finish",
        paragraphs: [
          "First, [pick a plan](/plans). For a semester or a longer stay, [Student 5G](/plans/student-5g) — $34.99/month for 50GB, 5,000 local minutes, and 1,000 SMS — fits most people; lighter users can start at $14.99 with [Basic](/plans/basic). Prices include VAT and there's no contract beyond the month.",
          "Second, check out online. Payment confirms, BitLink provisions your Israeli number, and the eSIM activation QR code arrives by email — typically within minutes.",
          "Third, install the eSIM: phone settings → add eSIM (or \"add cellular plan\") → scan the QR code from the email. Your Israeli line now lives alongside your home line, and you can label them so it's obvious which is which.",
          "That's it. When you land, your phone picks up the Israeli network and your +972 number is live — while the plane is still taxiing.",
        ],
      },
      {
        heading: "If your phone can't do eSIM",
        paragraphs: [
          "The same plans ship as a physical SIM instead — nothing about pricing or data changes. It takes more planning than a QR code, so [talk to support](/support) about timing delivery around your arrival date. Kosher-certified phones always use a physical SIM, since kosher devices aren't built for eSIM activation; the [kosher plans](/kosher-phone-plans-israel) page covers that path.",
        ],
      },
      {
        heading: "What about the number from home?",
        paragraphs: [
          "Your Israeli number handles life in Israel; the question is what happens to the US, UK, or Canadian number everyone already has saved. Two clean options: [port it onto your BitLink line](/keep-your-number) for a one-time $49.99 so it keeps working from Israel, or add a [fresh US, Canadian, or UK local number](/us-number-in-israel) for $9.99/month so family can call you at local rates. Many people landing long-term do one of these and drop the old home plan entirely.",
        ],
      },
    ],
    faq: [
      {
        question: "How long before my flight should I set this up?",
        answer:
          "A few days early is comfortable, but it genuinely works the night before: checkout, QR code, and activation typically complete within minutes. The one exception is physical SIM delivery or a kosher setup — give those at least a week and coordinate timing with support.",
      },
      {
        question: "Will the Israeli eSIM interfere with my home number during the trip?",
        answer:
          "No. Modern phones run two lines side by side — your home SIM and the Israeli eSIM — and you choose which handles calls and which handles data. Most people set the Israeli line as the data and calling line while abroad and leave the home line reachable but idle, avoiding roaming charges.",
      },
    ],
    relatedLinks: [
      { href: "/israel-esim", label: "Israel eSIM" },
      { href: "/israeli-phone-plans-for-students", label: "Student phone plans" },
      { href: "/israeli-phone-plans-for-olim", label: "Phone plans for new olim" },
    ],
  },
  {
    slug: "israeli-phone-number-for-banking-bit-pango",
    title: "Why banks, Bit, Pango, and gov.il all want an Israeli phone number",
    metaTitle: "Why Banks, Bit & Pango Need an Israeli Number",
    metaDescription:
      "Israeli banks, Bit, Pango, Kupat Cholim, and gov.il verify you by SMS to an Israeli mobile number. Here's what breaks without one — and how to fix it before it matters.",
    datePublished: "2026-07-05",
    dateModified: "2026-07-05",
    readingTime: "5 min read",
    intro:
      "Israel runs on SMS verification — and almost none of it accepts a foreign number. Banks, the Bit payment app, Pango parking, Kupat Cholim, delivery companies, and government services all confirm you're you by texting a code to an Israeli mobile number. If you arrive without one, you'll discover this at the least convenient moments possible. Here's the map of what needs an Israeli number, why data-only eSIMs don't help, and the ten-minute fix.",
    sections: [
      {
        heading: "The SMS wall, explained",
        paragraphs: [
          "Israeli institutions overwhelmingly use one-time codes sent by SMS as their identity check. The system assumes an Israeli mobile number the way American systems assume a Social Security number — it's the key that everything else references. Most registration forms literally won't accept a number that doesn't start with 05.",
          "This catches new arrivals off guard because the need appears mid-task: you're at the bank counter, halfway through a parking app signup, or trying to receive a package, and the process stops cold at \"enter the code we sent you.\"",
        ],
      },
      {
        heading: "What actually breaks without one",
        paragraphs: [
          "Banking: opening an Israeli account generally requires an Israeli mobile number for verification codes and callbacks, and ongoing logins use SMS one-time codes. Bit — the payment app most Israelis use to split bills and pay each other — requires both an Israeli number and an Israeli bank account, so the number is step one of a chain.",
          "Daily logistics: Pango and Cellopark (street parking), Wolt and other delivery apps, package pickup lockers, and appointment reminders from Kupat Cholim all key off an Israeli mobile number. Government services on gov.il use SMS codes for identity verification too.",
          "None of these are exotic. They're the first two weeks of anyone's life in Israel — which is why the number should exist before the errands do.",
        ],
      },
      {
        heading: "Why a travel eSIM doesn't solve this",
        paragraphs: [
          "Travel eSIMs from the global apps are data pipes: excellent for maps and WhatsApp, but data-only — there's no Israeli phone number attached, so there's nothing for a bank or Pango to send a code to. Keeping your US number on roaming doesn't help either, because Israeli forms want an Israeli number, not a reachable foreign one.",
          "The distinction sounds small until it costs you an afternoon at the bank. If your stay involves any Israeli institution — and every stay longer than a vacation does — the number matters more than the gigabytes. The [Israel eSIM](/israel-esim) page has a side-by-side comparison.",
        ],
      },
      {
        heading: "The fix takes ten minutes",
        paragraphs: [
          "Every [BitLink plan](/plans) includes a real Israeli mobile number, from $14.99/month with VAT included and no contract. On an eSIM-compatible phone the whole setup happens online before you land — the [step-by-step guide](/guides/israeli-phone-number-before-you-land) walks through it. Verification codes, bank callbacks, Bit, Pango, and delivery apps then work exactly as they do for anyone else in the country.",
          "For new olim specifically, this is worth doing before the klita paperwork starts rather than during it — the [olim plan guide](/israeli-phone-plans-for-olim) covers which plan fits the first year.",
        ],
      },
    ],
    faq: [
      {
        question: "Can I use my American number for Israeli banking apps?",
        answer:
          "Generally no. Israeli banks and payment apps like Bit expect an Israeli mobile number for SMS verification, and most registration forms only accept numbers in Israeli format. Some banks can accommodate foreign numbers in limited cases, but it's the exception and adds friction exactly where you don't want it.",
      },
      {
        question: "Does a data-only eSIM work for receiving Israeli SMS codes?",
        answer:
          "No. Data-only travel eSIMs have no phone number attached — they move internet traffic, not calls or SMS. To receive Israeli verification codes you need a plan that includes a real Israeli mobile number, which every BitLink plan does.",
      },
    ],
    relatedLinks: [
      { href: "/israeli-phone-plans-for-olim", label: "Phone plans for new olim" },
      { href: "/israel-esim", label: "Israel eSIM" },
      { href: "/keep-your-number", label: "Porting your number" },
    ],
  },
];

export function getGuide(slug: string) {
  return guides.find((guide) => guide.slug === slug);
}
