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
    // Optional ordered list rendered under the paragraphs (e.g. install steps).
    steps?: string[];
  }>;
  faq: Array<{
    question: string;
    answer: string;
  }>;
  relatedLinks: Array<{
    href: string;
    label: string;
  }>;
  // Opt-in device compatibility block: a table plus the "confirm my model"
  // widget. Only the eSIM guide uses it.
  deviceCompatibility?: {
    updatedNote: string;
    groups: Array<{
      brand: string;
      models: string;
      caveat?: string;
    }>;
  };
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
  {
    slug: "esim-israel",
    title: "How to set up an eSIM in Israel",
    metaTitle: "How to Set Up an eSIM in Israel — iPhone, Samsung & Pixel",
    metaDescription:
      "A clear guide to eSIM in Israel: how it works, how long activation takes, which phones support eSIM, and step-by-step install for iPhone, Samsung Galaxy, and Google Pixel.",
    datePublished: "2026-07-08",
    dateModified: "2026-07-08",
    readingTime: "8 min read",
    intro:
      "An eSIM is a digital SIM card built into your phone — instead of inserting a plastic card, you activate service by scanning a QR code. For anyone coming to Israel, moving here, learning here, or switching Israeli providers, it means getting connected without shipping, store visits, or a tiny card to lose. This guide covers how eSIM works, how long it takes, which phones support it, and exactly how to install one on an iPhone, Samsung Galaxy, or Google Pixel.",
    sections: [
      {
        heading: "What is an eSIM?",
        paragraphs: [
          "An eSIM does the same job as a regular SIM card — it tells the mobile network who you are, what plan you have, and which number is yours — but it's built into the device instead of being a plastic chip you slot in. Your phone downloads a secure \"SIM profile\" from your provider, and once it's installed, the phone connects to the network exactly as it would with a physical card.",
          "In short: a physical SIM is a card you insert; an eSIM is a digital profile you download. The phone service works identically — only the way it gets onto your device changes.",
        ],
      },
      {
        heading: "How eSIM activation works with BitLink",
        paragraphs: [
          "The whole flow is built to be simple. You [choose a plan](/plans), pay through secure checkout, and BitLink provisions your Israeli line. The eSIM activation QR code is then emailed to you — usually within a few minutes of payment — and you scan it straight from your phone's settings. No waiting for a card to ship, no store visit.",
          "Because activation is digital, you can do it from anywhere. Many people set their Israeli line up from home before they fly, so their phone is already connected the moment they land. If your device doesn't support eSIM, the same plans ship as a physical SIM instead — nothing about pricing or data changes.",
        ],
      },
      {
        heading: "How long does activation take?",
        paragraphs: [
          "The eSIM install itself is quick — scanning the QR code and downloading the profile usually takes only a few minutes. The overall timing depends on the type of order:",
        ],
        steps: [
          "New Israeli number — the fastest path. Once your order is processed and the eSIM is ready, install is normally just a few minutes.",
          "Porting an Israeli number — [transferring your existing number](/keep-your-number) generally completes within 5 to 10 minutes, since both carriers run on Israeli infrastructure. Keep your old SIM active until the transfer finishes.",
          "Porting a US, UK, or Canadian number — this involves coordination with your carrier abroad and takes up to 3 business days. Your old number keeps working the whole time.",
          "Second line — many people keep their home number active and add an Israeli eSIM alongside it. This is one of eSIM's most useful features.",
        ],
      },
      {
        heading: "Travel eSIM vs. a real Israeli plan",
        paragraphs: [
          "Not every eSIM is the same. Many travel eSIMs are data-only: they give you internet, but no Israeli phone number, calls, or SMS. That matters in Israel, where a real number is what banks, delivery apps, Bit, Pango, appointment systems, and WhatsApp all verify against.",
          "If you only need data for a short trip, a travel eSIM may be enough. If you need actual Israeli phone service — a number people can call and text, that receives verification codes — a full mobile plan is the better fit. The [Israel eSIM page](/israel-esim) has a side-by-side comparison of exactly what each one can and can't do.",
        ],
      },
      {
        heading: "Does my phone support eSIM?",
        paragraphs: [
          "Most newer premium phones support eSIM, but not all do. Before ordering, check three things: your phone must support eSIM (look for an EID number or an \"Add eSIM\" option in settings), it should be unlocked (phones locked to a foreign carrier may reject another provider's eSIM), and its software should be up to date. The list below covers the most common compatible models — and if you're unsure, we'll confirm your exact model before you order.",
        ],
      },
      {
        heading: "Installing an eSIM on iPhone",
        paragraphs: ["The wording shifts slightly by iOS version, but the flow is:"],
        steps: [
          "Connect your iPhone to Wi-Fi.",
          "Open Settings → Cellular (or Mobile Service).",
          "Tap Add eSIM, then Use QR Code.",
          "Scan the QR code from your BitLink email.",
          "Follow the prompts, then label the line \"BitLink\" or \"Israel.\"",
          "Choose which line handles calls, SMS, and mobile data.",
        ],
      },
      {
        heading: "Installing an eSIM on Samsung Galaxy",
        paragraphs: ["On most recent Galaxy phones:"],
        steps: [
          "Connect to Wi-Fi.",
          "Open Settings → Connections → SIM Manager.",
          "Tap Add eSIM.",
          "Scan your BitLink QR code and follow the prompts.",
          "Choose which SIM handles calls, messages, and data.",
        ],
      },
      {
        heading: "Installing an eSIM on Google Pixel",
        paragraphs: ["On most recent Pixel phones:"],
        steps: [
          "Connect to Wi-Fi.",
          "Open Settings → Network & internet → SIMs.",
          "Tap Add SIM, then choose the eSIM setup option.",
          "Scan your QR code and follow the on-screen steps.",
          "Set your preferred SIM for data, calls, and texts.",
        ],
      },
      {
        heading: "Keeping your home number and adding an Israeli eSIM",
        paragraphs: [
          "Most modern phones support Dual SIM — running two lines at once, typically one physical SIM plus one eSIM, or two eSIMs. That lets you keep your US, UK, or Canadian number active while adding a BitLink Israeli line: set mobile data to the Israeli eSIM, and keep the home line available for calls, iMessage, WhatsApp, or verification codes.",
          "One tip: if you keep your foreign line active, turn off data roaming on it so you don't get surprise charges. If people back home need an easy way to reach you, a [US, Canadian, or UK number add-on](/us-number-in-israel) gives them a local number that rings your Israeli phone.",
        ],
      },
      {
        heading: "Common eSIM problems and quick fixes",
        paragraphs: [
          "QR code not working — make sure you're on Wi-Fi, the camera can read the code clearly, and the code hasn't already been used (most are one-time). \"This eSIM cannot be added\" usually means the phone is locked, the code was already used, or the device doesn't support eSIM.",
          "Installed but no data — check the eSIM line is switched on, then confirm mobile data is assigned to the right line. Calls work but no internet, or data works but no calls, almost always comes down to which line your phone is set to use for each. If anything's stuck, [message support on WhatsApp](/support) with your model and what you're seeing.",
        ],
      },
      {
        heading: "Before you erase your old phone",
        paragraphs: [
          "If you're switching phones or porting a number, don't wipe or reset the old device until the new line is fully working. Test mobile data, incoming and outgoing calls, SMS if your plan includes it, and WhatsApp and any bank or verification apps. Keep the old phone nearby until everything checks out — an eSIM has no card to move back, so a fresh profile may be needed if something goes wrong.",
        ],
      },
    ],
    deviceCompatibility: {
      updatedNote: "Compatible models as of July 2026. Some regional variants differ — send us your exact model and we'll confirm.",
      groups: [
        {
          brand: "Apple iPhone",
          models:
            "iPhone XS, XS Max, and XR and all newer — 11, 12, 13, 14, 15, and 16 series, plus iPhone SE (2020) and SE (2022).",
          caveat: "iPhones bought in mainland China have no eSIM. US iPhone 14 and newer are eSIM-only (no physical tray).",
        },
        {
          brand: "Samsung Galaxy",
          models:
            "Galaxy S20 and newer (S20–S24 series), Note 20, every Z Flip and Z Fold, and select A-series such as A54 and A55.",
          caveat: "A few regional variants ship without eSIM — worth confirming your exact model.",
        },
        {
          brand: "Google Pixel",
          models: "Pixel 3 and newer — 3, 3a, 4, 4a, 5, 6, 7, 8, and 9 series (standard and Pro).",
          caveat: "Pixel 3 from some carriers or regions lacks eSIM.",
        },
        {
          brand: "Other brands",
          models:
            "Motorola Razr (2019+), recent Sony Xperia, Oppo Find, Rakuten, and many other recent flagships increasingly support eSIM.",
          caveat: "Support varies by exact model and region — send us your model and we'll confirm.",
        },
      ],
    },
    faq: [
      {
        question: "What is the best eSIM for Israel?",
        answer:
          "It depends what you need. For short-term data only, a travel data eSIM may be enough. If you need a real Israeli number, calls, SMS, and local support — for banks, deliveries, apps, and everyday life — a full Israeli mobile plan is the better choice. BitLink plans start at $14.99/month and every one includes a real Israeli number.",
      },
      {
        question: "Can I get an Israeli phone number with an eSIM?",
        answer:
          "Yes — every BitLink plan includes a real Israeli number, delivered by eSIM on compatible devices. Just note that many travel eSIMs are data-only, so always check whether a plan actually includes a number, calls, and SMS.",
      },
      {
        question: "Can I install the eSIM before I arrive in Israel?",
        answer:
          "Usually yes. Once BitLink has issued your eSIM and your phone has Wi-Fi, you can install it from anywhere — many people set it up before travelling so their Israeli line is live the moment they land.",
      },
      {
        question: "Can I keep my American number and use an Israeli eSIM?",
        answer:
          "In most cases, yes. Modern dual-SIM phones let you keep your American line active while adding an Israeli eSIM — use the Israeli line for local data and calls, and keep the American number available for texts, iMessage, WhatsApp, or verification codes.",
      },
      {
        question: "Do I need Wi-Fi to install an eSIM?",
        answer:
          "Usually, yes — your phone needs an internet connection to download the eSIM profile, and Wi-Fi is the easiest way. That's why it's simplest to install before you leave, or on hotel/airport Wi-Fi when you arrive.",
      },
      {
        question: "What if my phone doesn't support eSIM?",
        answer:
          "Then you'll want a physical SIM instead — BitLink ships the same plans as a physical SIM with no change to pricing or data. If you're not sure whether your phone supports eSIM, tell us your model and we'll confirm before you order.",
      },
    ],
    relatedLinks: [
      { href: "/israel-esim", label: "Israel eSIM plans" },
      { href: "/keep-your-number", label: "Keep your number" },
      { href: "/israeli-phone-plans-for-olim", label: "Phone plans for new olim" },
    ],
  },
  {
    slug: "yeshiva-seminary-phone-checklist",
    title: "The phone checklist for yeshiva and seminary students going to Israel",
    metaTitle: "Yeshiva & Seminary Phone Checklist for Israel",
    metaDescription:
      "The phone checklist for yeshiva & seminary students in Israel: school policy first, kosher vs. smartphone paths, plans from $19.99/mo, set up before the flight.",
    datePublished: "2026-07-12",
    dateModified: "2026-07-12",
    readingTime: "6 min read",
    intro:
      "If you're headed to yeshiva or seminary in Israel — or you're the parent organizing it — the phone is one job that shouldn't wait for landing day. The short version: confirm the school's phone policy first, because it decides everything else. Kosher programs need a certified kosher phone on a recognized kosher line (from $19.99/month); smartphone programs fit Student 5G ($34.99/month, 50GB); and on an eSIM-compatible phone the Israeli number can be live before the flight. Prices are in USD with VAT included, parents can pay from abroad, and support answers in English. Here's the whole thing as a checklist, in order.",
    sections: [
      {
        heading: "Start with the school's phone policy — it decides everything",
        paragraphs: [
          "Phone rules vary more than most families expect. Many chareidi yeshivos require a certified kosher device on a recognized kosher line — a smartphone isn't an option, filtered or not. Many seminaries and yeshivos permit smartphones, sometimes with a filtering requirement. A few don't mind either way. The school office's answer determines which device to bring and which plan to buy, so get it in writing before spending money on either.",
          "If the policy is ambiguous — \"kosher preferred\" or \"filtered smartphones considered\" — [ask BitLink support](/support) which plans students at that specific program typically use. It's a question the team answers all the time.",
        ],
      },
      {
        heading: "The checklist, in order",
        paragraphs: [
          "Working backwards from an Elul or September arrival, here's the timeline that avoids every common scramble:",
        ],
        steps: [
          "Four weeks out — email the school office and get the phone policy in writing: kosher-only, smartphone with a filter, or unrestricted.",
          "Three weeks out — sort the device. Kosher path: buy a certified kosher phone (the certification lives in the device; the kosher line comes from the carrier). Smartphone path: confirm the phone is unlocked and eSIM-compatible — a carrier-locked phone is the most common arrival-day surprise, and unlocking through a US carrier can take days.",
          "Two weeks out — order the plan. Kosher plans activate on a physical SIM only, so coordinate delivery timing with [support](/support) around the flight date. Smartphone plans can technically wait, but there's no advantage to waiting.",
          "A few days before the flight — eSIM users: check out online, the activation QR code arrives by email within minutes, and you install it from home Wi-Fi. The Israeli number is live before boarding.",
          "Landing day — nothing to do. The phone picks up the Israeli network on arrival, and the driver, the madrich or madricha, and family all reach the same number from the first hour.",
          "First week — SMS verification codes from delivery apps and Israeli services just work, because the number already exists. No kiosk queue, no first-Shabbos phone crisis.",
        ],
      },
      {
        heading: "Which plan fits which student",
        paragraphs: [
          "For kosher programs: [Kosher Basic](/plans/kosher-basic) is $19.99/month with 5,000 minutes to Israeli numbers, voice-only on a physical SIM. [Kosher+](/plans/kosher-plus) is $24.99/month and adds 150 minutes of calling to US and Canadian numbers — the right pick if the student will be calling home rather than only receiving calls. Both run on lines recognized by Vaadat Harabanim L'inyanei Tikshoret (registered association no. 580440824), which is the recognition yeshivos and kosher-phone communities look for.",
          "For smartphone programs: [Student 5G](/plans/student-5g) at $34.99/month — 50GB of 5G data, 5,000 minutes, 1,000 SMS — is BitLink's most popular plan and fits most students. [Max 5G](/plans/max-5g) at $39.99/month doubles the data to 120GB and includes 150 US/Canada minutes, for heavy streamers or anyone using the phone as a hotspot. Basic at $14.99/month includes 1GB, which most students outgrow within the first week — it's a fit for genuinely light use only.",
          "Every plan is monthly with no long-term contract, so a student who picks wrong can switch without penalty once real usage is clear.",
        ],
      },
      {
        heading: "For parents: paying and staying in touch from abroad",
        paragraphs: [
          "Plans are priced and charged in US dollars with VAT included, so a parent pays with their own card and sees the same predictable amount every month — no shekel conversion moving with the exchange rate. Many families keep the account entirely in the parent's hands while the line runs on the student's phone in Israel.",
          "For staying in touch, a [US, Canadian, or UK local number](/us-number-in-israel) can be added to any plan — including the kosher plans — for $9.99/month. Family dials a number that's local to them, and it rings the student's phone in Israel; no international dialing, no calling cards. In the other direction, Kosher+ and Max 5G both include 150 minutes of outbound calling to US and Canadian numbers.",
          "Support is in English by WhatsApp, phone, and email — so a parent can sort out a billing question or a setup issue directly, without the student translating from a dorm hallway.",
        ],
      },
      {
        heading: "The three mistakes that cost the most",
        paragraphs: [
          "Waiting for the airport kiosk. It solves the problem hours after it was needed, at tourist prices, with contracts in Hebrew — and the errands that need an Israeli number start immediately.",
          "Flying with a locked phone. US carrier-financed phones are often locked to that carrier, and another provider's eSIM won't install on them. Confirm the unlock before flying; home carriers can take days to process it, and it's much harder to fix from a dorm in Jerusalem.",
          "Buying a kosher device before confirming what the school accepts. Certification requirements can be specific to the institution. Policy first, then device, then line — in that order.",
        ],
      },
      {
        heading: "If the school works with BitLink",
        paragraphs: [
          "Some yeshivos, seminaries, and shuls have their own BitLink signup link to share with incoming students — signups are tracked and the institution is supported through BitLink's partner program, at no cost to the school. If your school has one, use their link; if you're an administrator who wants one, [reach out through support](/support).",
          "One more practical tip for students arriving with friends: BitLink's referral program adds 5GB of bonus data per month to the referrer's plan for each active referral, up to 25GB. A group of roommates signing up through each other's links raises everyone's monthly data at no cost.",
        ],
      },
    ],
    faq: [
      {
        question: "What phone should a student bring to yeshiva or seminary in Israel?",
        answer:
          "It depends on the school's policy, not the carrier. Kosher-only programs require a certified kosher device, which pairs with a voice-only kosher line like Kosher Basic ($19.99/month) or Kosher+ ($24.99/month). Programs that allow smartphones need an unlocked, eSIM-compatible phone — most iPhones from the XS onward and most recent Android flagships qualify — paired with a plan like Student 5G. Confirm the policy in writing and confirm the phone is unlocked before flying.",
      },
      {
        question: "Should the Israeli number be set up before or after the flight?",
        answer:
          "Before, whenever possible. On an eSIM-compatible smartphone, checkout and activation take minutes and can be done from home days before the flight, so the number is live on landing. Kosher plans use a physical SIM, which takes more lead time — order about two weeks out and coordinate delivery timing with support around the arrival date.",
      },
      {
        question: "Can parents pay for a student's Israeli phone plan from the US?",
        answer:
          "Yes — this is one of the main reasons families choose BitLink. Checkout is online and priced in US dollars with VAT included, so a parent pays with their own US, UK, or Canadian card and sees a predictable USD charge each month. Support is in English by WhatsApp, phone, and email, so parents can manage the account directly from abroad.",
      },
      {
        question: "How can family call the student without international charges?",
        answer:
          "Add a US, Canadian, or UK local number to the student's plan for $9.99/month — family dials a local number and it rings the student's phone in Israel, at local-call cost on their end. It works on every plan, including the kosher plans. For calls in the other direction, Kosher+ and Max 5G include 150 minutes of calling to US and Canadian numbers each month.",
      },
    ],
    relatedLinks: [
      { href: "/yeshiva-seminary-phone-plans", label: "Yeshiva & seminary phone plans" },
      { href: "/kosher-phone-plans-israel", label: "Kosher phone plans" },
      { href: "/israeli-phone-plans-for-students", label: "Student phone plans" },
    ],
  },
  {
    slug: "kosher-phones-israel-explained",
    title: "Kosher phones in Israel, explained: devices, certification, and plans",
    metaTitle: "Kosher Phones in Israel: Certification, Devices & Plans",
    metaDescription:
      "What makes a phone kosher, who certifies it (Vaadat Harabanim), what a kosher line includes, and how English speakers get one — plans from $19.99/month.",
    datePublished: "2026-07-12",
    dateModified: "2026-07-12",
    readingTime: "7 min read",
    intro:
      "A kosher phone is two things working together: a certified device built for calling only, and a kosher phone line from the carrier. Getting one in Israel as an English speaker usually means navigating Hebrew-first stores and paperwork — this guide explains the whole system plainly: what certification actually covers, who Vaadat Harabanim is, what a kosher line does and deliberately doesn't include, and what it costs. BitLink's kosher plans run $19.99–$24.99/month in USD, VAT included, on lines recognized by Vaadat Harabanim L'inyanei Tikshoret.",
    sections: [
      {
        heading: "What makes a phone kosher: the two-part system",
        paragraphs: [
          "Kosher phone service has two components, and both are required. The first is the device — a certified kosher phone, built for calling: no browser, no app store, no open internet access, and in most models no text messaging. The second is the line — the SIM and phone number from the carrier, provisioned as a kosher line with data and SMS excluded at the network level, not just switched off in settings.",
          "The distinction matters because neither half works alone. A certified device on a regular line isn't a kosher setup, and a kosher line in a smartphone isn't either — the device won't be accepted where kosher phones are expected, and in practice a kosher SIM is designed for kosher hardware. When yeshivos or communities say they require a kosher phone, they mean both together.",
        ],
      },
      {
        heading: "Who certifies it: Vaadat Harabanim, explained",
        paragraphs: [
          "Kosher phone service in Israel is overseen by Vaadat Harabanim L'inyanei Tikshoret — the Rabbinical Committee for Communications, registered association no. 580440824. The committee sets the standards for what qualifies as kosher service and recognizes the lines that meet them. BitLink's kosher lines carry that recognition.",
          "Practically, recognition means the line behaves the way kosher-phone communities and institutions expect a kosher number to behave — which is what a yeshiva office or a mashgiach is actually checking when they ask about a student's phone. If a school or community wants the certification details confirmed in writing before signup, [BitLink support](/support) provides them.",
        ],
      },
      {
        heading: "What a kosher line includes — and deliberately doesn't",
        paragraphs: [
          "[Kosher Basic](/plans/kosher-basic) is $19.99/month and includes 5,000 minutes of calling to Israeli numbers. [Kosher+](/plans/kosher-plus) is $24.99/month and adds 150 minutes of calling to US and Canadian numbers. Both are voice-only: no mobile data, no SMS, on a physical SIM. Prices are in USD with VAT included, and plans are monthly with no long-term contract.",
          "The exclusions are the product, not a gap in it. A kosher line carries no data or SMS because that's what the certification requires — it isn't a stripped-down data plan, it's a different category of service. If you need internet on your line, a kosher-certified device can't use it anyway; the honest comparison is BitLink's [standard plans](/plans) from $14.99/month, which require a standard (non-kosher) phone.",
          "One technical consequence worth knowing in advance: kosher plans activate on a physical SIM only. Kosher devices aren't built for eSIM, so there's no scan-a-QR-code shortcut — the SIM has to physically reach the phone, which makes timing part of the plan (more below).",
        ],
      },
      {
        heading: "Getting one as an English speaker: the actual steps",
        paragraphs: [
          "The traditional route runs through Hebrew-speaking carriers and phone stores, which is exactly where English-speaking families get stuck. The BitLink route is online and in English, in this order:",
        ],
        steps: [
          "Get the certified device. The certification lives in the hardware, and requirements can be institution-specific — if the phone is for a yeshiva or seminary student, confirm what the school accepts before buying. Kosher phones are widely available in religious neighborhoods in Israel, and some families buy one after arrival.",
          "Choose the line: Kosher Basic ($19.99/month) for calling within Israel, or Kosher+ ($24.99/month) if calls to the US or Canada are part of regular life.",
          "Order online — checkout is in USD with a regular US, UK, or Canadian card, so a parent can pay from abroad while the phone is used in Israel.",
          "Coordinate SIM timing. Because kosher plans are physical-SIM only, [message support](/support) with your arrival or start date and the team will time delivery around it — this is the step that rewards planning a week or two ahead.",
          "Insert the SIM and call. There's no app setup or QR scanning on a kosher device — once the SIM is in and the line is active, it just works.",
        ],
      },
      {
        heading: "Staying connected with family abroad",
        paragraphs: [
          "A kosher line doesn't have to mean being hard to reach from America. In the outbound direction, Kosher+ includes 150 minutes per month of calling to US and Canadian numbers directly from the kosher phone. In the inbound direction, a [US or Canadian local number](/us-number-in-israel) can be added to either kosher plan for $9.99/month — family dials a number that's local to them, and it rings the kosher phone in Israel like any other call. No calling cards, no international dialing, and nothing about the setup affects the line's kosher status.",
          "Support itself is in English — WhatsApp, phone, and email — so the parent managing the account from abroad can handle billing or plan changes directly, without the phone's user needing to be involved at all.",
        ],
      },
      {
        heading: "The costs, all of them",
        paragraphs: [
          "The line: $19.99/month (Kosher Basic) or $24.99/month (Kosher+), VAT included, no contract, cancel anytime. The optional US/Canada number add-on: $9.99/month. The device: bought separately, since certification is hardware-level — prices vary by model and where you buy.",
          "There are no activation surprises, and each plan's full contract is published on its page before checkout. If the line is for a student and the school has a BitLink signup link, use it — signups are tracked and the institution is supported through BitLink's partner program at no cost to the school.",
        ],
      },
    ],
    faq: [
      {
        question: "What is a kosher phone?",
        answer:
          "A kosher phone is a certified device built for calling only — no browser, no app store, no open internet, and in most models no text messaging — used together with a kosher phone line from the carrier, which excludes data and SMS at the network level. Both parts are required: the device certification and the line. In Israel the standards are overseen by Vaadat Harabanim L'inyanei Tikshoret, the Rabbinical Committee for Communications.",
      },
      {
        question: "Are BitLink's kosher lines rabbinically certified?",
        answer:
          "Yes — BitLink's kosher lines are recognized by Vaadat Harabanim L'inyanei Tikshoret (registered association no. 580440824), the body that oversees kosher phone service in Israel. Both Kosher Basic and Kosher+ run on these recognized lines. If a school, community, or mashgiach wants the certification details confirmed before signup, support can provide them in writing.",
      },
      {
        question: "Can a kosher phone plan include data or WhatsApp?",
        answer:
          "No. Kosher lines are voice-only by definition — no mobile data and no SMS — because that's what the certification requires, and kosher-certified devices can't use data anyway. If you need internet or WhatsApp on your line, the right comparison is a standard plan (from $14.99/month at BitLink) with a standard phone, not a kosher plan.",
      },
      {
        question: "Do kosher phones work with eSIM?",
        answer:
          "No — kosher plans activate on a physical SIM only, because kosher devices aren't built for eSIM. That makes delivery timing the one step that needs planning: order a week or two before you need the line and coordinate the SIM's arrival with support around your date.",
      },
      {
        question: "How can family in the US call a kosher phone in Israel affordably?",
        answer:
          "Add a US or Canadian local number to the kosher plan for $9.99/month — family dials a local number and it rings the kosher phone in Israel, costing them what any local call costs. For calling out, Kosher+ ($24.99/month) includes 150 minutes to US and Canadian numbers each month from the kosher phone itself.",
      },
    ],
    relatedLinks: [
      { href: "/kosher-phone-plans-israel", label: "Kosher phone plans" },
      { href: "/yeshiva-seminary-phone-plans", label: "Yeshiva & seminary phone plans" },
      { href: "/guides/yeshiva-seminary-phone-checklist", label: "Student phone checklist" },
    ],
  },
];

export function getGuide(slug: string) {
  return guides.find((guide) => guide.slug === slug);
}
