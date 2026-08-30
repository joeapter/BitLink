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
    // Optional comparison table rendered after the paragraphs. Order rows by
    // an objective criterion (e.g. cost, descending) rather than by who we
    // want seen first; set highlight on the BitLink row instead.
    table?: {
      columns: string[];
      rows: Array<{
        cells: string[];
        highlight?: boolean;
      }>;
      note?: string;
    };
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

// House style for NEW guides (decided Jul 2026): section headings are
// question-phrased, matching how people actually search/ask ("Can I roam on a
// US carrier for a year?"), because retrieval systems chunk pages by heading
// and AI assistants are our best-converting channel. Bodies stay answer-first
// prose — do not fragment them into Q&A snippets (thin-content risk in
// Google's classifiers, and the FAQ block already covers pure Q&A format).
// The six guides published before Jul 16, 2026 keep their editorial headings
// until performance data says otherwise.
export const guides: Guide[] = [
  {
    slug: "us-phone-number-before-aliyah",
    title: "What should I do with my US phone number before making Aliyah?",
    metaTitle: "US Phone Number Before Aliyah: What to Do",
    metaDescription:
      "Keep, port, or park your US number before aliyah. Checklist for banks, WhatsApp, iMessage, 2FA, and getting an Israeli number before you land.",
    datePublished: "2026-07-15",
    dateModified: "2026-07-15",
    readingTime: "7 min read",
    intro:
      "Your US phone number is probably attached to more than calls. Banks, credit cards, tax accounts, WhatsApp, iMessage, Apple ID, Google, insurance, brokerages, schools, and random two-factor logins may all still use it. So the answer before aliyah is not \"cancel it and figure it out later.\" The clean move is to keep your US number reachable during the transition, get a real Israeli number before or right when you land, and only then decide whether to keep, port, or park the American number long term.",
    sections: [
      {
        heading: "The short answer: do not cancel it first",
        paragraphs: [
          "The worst time to discover a bank still texts your old number is after the number is gone. A US number often becomes part of your identity layer: password resets, fraud alerts, account recovery, WhatsApp re-verification, and calls from people who have had that number saved for years. If you cancel it too early, the problem is not just missed calls — it can become a locked-account problem.",
          "For most people making aliyah, the safer setup is temporary overlap: keep the US number working while you activate an Israeli number. Then move the important accounts one by one. Once everything is tested, you can decide whether the US number is still worth paying for.",
        ],
      },
      {
        heading: "Before the flight: the phone-number checklist",
        paragraphs: [
          "Do this while your current US SIM still works. It is much easier to receive one more text at home than to beg a bank for manual recovery from Israel.",
        ],
        steps: [
          "Make a list of every account that may use your US number: banks, credit cards, brokerage, retirement, IRS or tax software, health insurance, Apple ID, Google, WhatsApp, email, school portals, and work tools.",
          "Log into each one and add a backup recovery method where possible: authenticator app, passkey, backup email, trusted device, or printed recovery codes.",
          "Decide where the US number should live after the move: keep the current carrier, move it to a lower-cost service, port it, or replace it with a new local US number that rings in Israel.",
          "Test the new setup before cancelling anything. Send yourself verification texts, receive a voice call, and confirm the accounts that matter most still let you in.",
          "Keep the old US plan active until the Israeli number is working and the most important US logins have been tested at least once from Israel.",
        ],
      },
      {
        heading: "Your three real choices for the US number",
        paragraphs: [
          "Choice one: keep your existing US carrier for a while. This is the least disruptive option because banks and contacts already know the number. The downside is cost, roaming risk, and the fact that a US plan may be overkill once you live in Israel. If you keep it, turn off data roaming on that line and use your Israeli line for mobile data.",
          "Choice two: park or port the number to a cheaper US-based service. This can work well for people who only need occasional texts and calls, but treat it as a test, not an assumption. Some financial institutions are picky about VoIP or forwarding numbers, and you do not want to learn that after the original line is cancelled.",
          "Choice three: bring the number to Israel with you. This is the option most people don't realize exists, and it's often the best one. If the exact number matters — family, banks, clients, old contacts — [porting your US, UK, or Canadian number to BitLink](/keep-your-number) turns it into a real working number you carry on your phone in Israel — plan on 3 to 5 business days for the port, with the old number working throughout. It keeps working on WhatsApp, family who only have your American number still reach you, and you stop paying a US carrier to hold it. Bank and service verification texts keep arriving too — tested, with real Chase and Google codes landing on a BitLink US number in Israel. You can run an Israeli number alongside it on the same phone and bill, so you get both without choosing. If you don't need the old number itself, a fresh [US, Canadian, or UK local number](/us-number-in-israel) can be added instead so people back home call a familiar local number that rings your phone in Israel.",
        ],
      },
      {
        heading: "WhatsApp: keep it, switch it, or run two accounts?",
        paragraphs: [
          "This is the part people overthink, because WhatsApp feels like the number. Your conversations are not simply erased because you move countries. But the number attached to the account still matters for re-verification, new contacts, and how people find you.",
          "If you are making Israel your main home, switching WhatsApp to your Israeli number is usually cleaner over time. Israeli landlords, schools, doctors, delivery drivers, government offices, and service providers expect an Israeli mobile number and often message by WhatsApp. Use WhatsApp's own change-number flow so the account moves properly and contacts can be notified.",
          "If you are emotionally or practically attached to the US WhatsApp account, you can keep it and add a second WhatsApp setup for the Israeli number, depending on your phone and app setup. Some people use WhatsApp Business for the second number. That is workable, but be honest about the tradeoff: you will be managing two identities, and new Israeli contacts will usually expect the Israeli one.",
        ],
      },
      {
        heading: "iMessage and FaceTime",
        paragraphs: [
          "iMessage and FaceTime are usually less dramatic than WhatsApp because they can also work through your Apple ID email address. Still, if your US number is attached to iMessage, do not cancel the line until you have checked your Apple settings and added your Israeli number after it is active.",
          "The practical move is simple: keep your Apple ID signed in, activate the Israeli line, then check which numbers and emails can send and receive iMessages and FaceTime calls. Tell close family which contact method you want them to use before you turn off the old line.",
        ],
      },
      {
        heading: "You still need an Israeli number",
        paragraphs: [
          "Keeping a US number does not replace an Israeli number. Israel runs a lot of daily life through an 05 mobile number: banks, Bit, Pango, Kupat Cholim, deliveries, appointment reminders, and local WhatsApp messages. A US number can keep your American life reachable, but it will not be the right number for most Israeli forms.",
          "That is why the clean setup is two tracks: keep the US number stable while you transition, and get a real Israeli number early. With [BitLink](/plans), an eSIM-compatible phone can be activated online with a real Israeli number before you land, and the [step-by-step guide](/guides/israeli-phone-number-before-you-land) explains the setup. One warning while you're at it: make sure the Israeli number is registered to you — airport and kiosk SIMs often aren't, and [the airport SIM trap](/guides/airport-sim-trap-israel) explains how people lose the number their bank knows.",
        ],
      },
      {
        heading: "The safest plan for most olim",
        paragraphs: [
          "If you want the low-drama version, do this: keep your US number active for the first part of the move, activate your Israeli number before landing, move Israeli services onto the Israeli number immediately, and slowly audit the US accounts that still need the American number.",
          "After a month or two, the answer usually becomes obvious. If banks, clients, or family still rely on the old number, keep or port it. If almost nobody uses it, replace it with a cheaper local-number add-on or let it go after you are sure every important login has another recovery path.",
        ],
      },
    ],
    faq: [
      {
        question: "Should I cancel my US phone plan before Aliyah?",
        answer:
          "No — not until you have tested everything that depends on that number. Keep the US number active while you set up your Israeli number, update important accounts, and confirm banks, credit cards, Apple ID, Google, WhatsApp, and email recovery still work.",
      },
      {
        question: "Can I use Google Voice or another VoIP service for bank texts?",
        answer:
          "Sometimes, but do not rely on it blindly. Some banks and services accept VoIP numbers and some do not, especially for security codes. If you move your number to any low-cost or VoIP service, test your most important logins before cancelling your original mobile plan. If bank texts are the worry keeping you on an expensive US plan, note that BitLink's US numbers — ported in, or the $9.99/month add-on — do receive bank and service verification texts; that's been tested with real Chase and Google codes.",
      },
      {
        question: "Will WhatsApp stop working if I move to Israel?",
        answer:
          "Not just because you move. The risk is losing access to the number tied to the account when WhatsApp needs to verify you again. If you plan to switch WhatsApp to your Israeli number, use WhatsApp's change-number flow. If you keep the US WhatsApp, make sure that number remains reachable.",
      },
      {
        question: "Should I switch WhatsApp to my Israeli number?",
        answer:
          "For long-term Aliyah, usually yes. Local services, schools, landlords, doctors, and delivery people expect an Israeli mobile number, and WhatsApp is part of daily Israeli life. Some people keep the US WhatsApp as a second account, but your Israeli number should become the main local contact.",
      },
      {
        question: "Do I need an Israeli phone number if I keep my US number?",
        answer:
          "Yes. A US number is useful for American banks and people back home, but Israeli banks, Bit, Pango, Kupat Cholim, deliveries, and local forms generally expect an Israeli 05 mobile number. The two numbers solve different problems.",
      },
      {
        question: "Can I have both a US number and an Israeli number on one phone?",
        answer:
          "In most cases, yes. Modern unlocked phones with Dual SIM or eSIM can run two lines side by side. Many olim use the Israeli line for data, calls, local SMS, and Israeli WhatsApp, while keeping the US number available for banks and old contacts.",
      },
    ],
    relatedLinks: [
      { href: "/israeli-phone-plans-for-olim", label: "Phone plans for new olim" },
      { href: "/guides/israeli-phone-number-before-you-land", label: "Get an Israeli number before you land" },
      { href: "/keep-your-number", label: "Keep your US number" },
      { href: "/us-number-in-israel", label: "US number in Israel" },
          { href: "/guides/israeli-sms-verification-from-abroad", label: "Israeli verification codes from abroad" },
    ],
  },
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
          "There's a second reason to do it early, and it catches people out more than arrival day does. Israeli banks, gov.il, Bit and Kupat Cholim all verify by texting an Israeli mobile — so any account you try to open before you arrive stalls on a code you have no way to receive. Switch on SMS-to-email in your BitLink account and those texts land in your inbox while you're still at home, which means the bank account, the health fund and the government portal can all be set up in the weeks before the flight instead of the fortnight after it.",
          "If you're reading this and you're not actually moving to Israel — you live abroad and simply need Israeli codes to keep working — that's a different situation with its own answer: [receiving Israeli SMS verification codes from abroad](/guides/israeli-sms-verification-from-abroad).",
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
          "Your Israeli number handles life in Israel; the question is what happens to the US, UK, or Canadian number everyone already has saved. Two clean options: [port it onto your BitLink line](/keep-your-number) for a one-time $49.99 so it keeps working from Israel, or add a [fresh US, Canadian, or UK local number](/us-number-in-israel) for $9.99/month so family can call you at local rates. Both receive US verification texts — bank codes, Google codes — not just calls, so the logins tied to an American number keep working. Timing is the difference: the add-on is live right away, while a port takes 3 to 5 business days (your old number keeps working until it completes). Many people landing long-term do one of these and drop the old home plan entirely.",
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
          { href: "/guides/esim-israel", label: "How to set up an eSIM in Israel" },
          { href: "/guides/travel-esim-or-phone-plan-israel", label: "Travel eSIM or phone plan?" },
    ],
  },
  {
    slug: "israeli-phone-number-for-banking-bit-pango",
    title: "Why banks, Bit, Pango, and gov.il all want an Israeli phone number",
    metaTitle: "Why Banks, Bit & Pango Need an Israeli Number",
    metaDescription:
      "Israeli banks, Bit, Pango and gov.il all verify you by SMS to an Israeli number. What breaks without one, and how to fix it before it matters.",
    datePublished: "2026-07-05",
    dateModified: "2026-07-13",
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
      {
        heading: "Get it from day one — and keep it",
        paragraphs: [
          "One caution that follows directly from everything above: because every one of these services keys itself to your number, the number you give them in week one should be one you'll still own in year five. That's exactly where airport and kiosk prepaid SIMs go wrong — they're often registered to the seller rather than to you, and idle prepaid numbers expire within months, taking your SMS verification access with them. [The airport SIM trap](/guides/airport-sim-trap-israel) covers the full mechanics; [getting your number before you land](/guides/israeli-phone-number-before-you-land) covers the clean way in. Same principle either way: register everything to a number you actually own, starting on day one.",
        ],
      },
      {
        heading: "The services mentioned in this guide",
        paragraphs: [
          "[Bit](https://www.bitpay.co.il) — Israel's most widely used peer-to-peer payment app, run by Bank Hapoalim. Splitting bills, paying the plumber, gan fees: in practice it's how money moves between people in Israel, and it requires both an Israeli mobile number and an Israeli bank account.",
          "[Pango](https://www.pango.co.il) — the dominant app for paying street parking (Cellopark is the alternative). Registration is keyed to an Israeli mobile number; without it, street parking means hunting for a meter that may not exist.",
          "[gov.il](https://www.gov.il) — the Israeli government's unified services portal: appointments, official records, national insurance, and more. Identity verification for many services runs on SMS codes to an Israeli mobile number.",
          "The kupot cholim — Israel's four health funds: [Clalit](https://www.clalit.co.il), [Maccabi](https://www.maccabi4u.co.il), [Meuhedet](https://www.meuhedet.co.il), and [Leumit](https://www.leumit.co.il). Every oleh registers with one; appointment booking, reminders, and their apps all key off an Israeli mobile number.",
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
          { href: "/guides/israeli-sms-verification-from-abroad", label: "Getting Israeli codes while abroad" },
      { href: "/guides/israeli-phone-number-area-codes", label: "What Israeli mobile prefixes mean" },
    ],
  },
  {
    slug: "esim-israel",
    title: "How to set up an eSIM in Israel",
    metaTitle: "How to Set Up an eSIM in Israel — iPhone, Samsung & Pixel",
    metaDescription:
      "How eSIM works in Israel: activation time, which phones support it, and step-by-step install for iPhone, Samsung Galaxy and Google Pixel.",
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
          "Porting a US, UK, or Canadian number — this involves coordination with your carrier abroad and takes 3 to 5 business days. Your old number keeps working the whole time.",
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
          { href: "/guides/travel-esim-or-phone-plan-israel", label: "Travel eSIM or phone plan?" },
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
          "For staying in touch, a [US, Canadian, or UK local number](/us-number-in-israel) can be added to any plan — including the kosher plans — for $9.99/month. Family dials a number that's local to them, and it rings the student's phone in Israel; no international dialing, no calling cards. On smartphone plans the number receives US verification texts as well, so a student's American bank login keeps working from Israel. In the other direction, Kosher+ and Max 5G both include 150 minutes of outbound calling to US and Canadian numbers.",
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
          "Choose the line: Kosher Basic ($19.99/month) for calling within Israel, or Kosher+ ($24.99/month) if calls to the US or Canada are part of regular life. Both are laid out side by side on the [kosher phone plans page](/kosher-phone-plans-israel).",
          "Order online — checkout is in USD with a regular US, UK, or Canadian card, so a parent can pay from abroad while the phone is used in Israel.",
          "Coordinate SIM timing. Because kosher plans are physical-SIM only, [message support](/support) with your arrival or start date and the team will time delivery around it — this is the step that rewards planning a week or two ahead.",
          "Insert the SIM and call. There's no app setup or QR scanning on a kosher device — once the SIM is in and the line is active, it just works.",
        ],
      },
      {
        heading: "Staying connected with family abroad",
        paragraphs: [
          "A kosher line doesn't have to mean being hard to reach from America. In the outbound direction, Kosher+ includes 150 minutes per month of calling to US and Canadian numbers directly from the kosher phone. In the inbound direction, [Kosher+ now includes a local US, Canada, or UK number](/kosher-phone-plan-with-usa-number) at no extra charge — family dials a number that's local to them, and it rings the kosher phone in Israel like any other call. On [Kosher Basic](/plans/kosher-basic) the same number is available as a $9.99/month [add-on](/us-number-in-israel). No calling cards, no international dialing, and nothing about the setup affects the line's kosher status — the line stays voice-only, so that number carries incoming calls and nothing else.",
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
          { href: "/guides/israeli-phone-number-area-codes", label: "What Israeli mobile prefixes mean" },
    ],
  },
  {
    slug: "airport-sim-trap-israel",
    title: "The airport SIM trap: don't give the bank a number you're about to lose",
    metaTitle: "The Airport SIM Trap in Israel — Keep Your Number",
    metaDescription:
      "Airport SIMs are often registered to the kiosk, not to you, and idle numbers expire in 6–12 months. How olim lose the number their bank knows.",
    datePublished: "2026-07-12",
    dateModified: "2026-07-12",
    readingTime: "7 min read",
    intro:
      "It's one of the most common phone problems olim run into, and almost nobody warns about it: you land, buy a SIM at the airport, give that number to the bank and Misrad HaPnim — and months later discover the number was never really yours. Porting an Israeli number is normally fast and free, but only if the number is registered to you, and airport and kiosk SIMs often aren't. Add expiry clocks that recycle idle prepaid numbers within 6–12 months, and the number every Israeli institution knows you by can simply disappear. Here's exactly how the trap works, what to do if you're already in it, and how to skip it entirely.",
    sections: [
      {
        heading: "The pattern, and why it catches smart people",
        paragraphs: [
          "The airport SIM isn't a dumb purchase — it works immediately, and on arrival day that's worth a lot. You walk out of the arrivals hall with a working Israeli number, and the errands begin: the bank wants an Israeli mobile number for SMS codes, Misrad HaPnim wants one for the file, Kupat Cholim, gov.il, Bit, Pango — within two weeks, that number is your identity across every Israeli system.",
          "The trap springs later, when you go to set up a permanent plan and want to keep the number everything is registered to. That's when you learn the two things nobody mentioned at the counter.",
        ],
      },
      {
        heading: "Problem one: the number may not be registered to you",
        paragraphs: [
          "Israeli number porting itself is fast and regulated — moving a number between carriers typically completes within minutes. But a port has to prove ownership, and that means the details on the port request must match how the number was originally registered.",
          "Here's the catch: many SIMs sold through airport counters, kiosks, and resellers are registered to the seller's business details — or effectively to no one — rather than to your passport. Sellers of prepaid Israeli SIMs openly advise customers to visit a service center and re-register the SIM in their own name, warning that otherwise you can lose the number. If the registration was never yours, there's nothing for a port to verify, and the number can't follow you.",
        ],
      },
      {
        heading: "Problem two: idle prepaid numbers expire",
        paragraphs: [
          "Prepaid numbers run on a clock. 019 — the brand sold in the Ben Gurion arrivals hall — is documented by its resellers as lapsing after six months without use; most other Israeli prepaid brands hold an inactive number for roughly a year before disconnecting it and recycling the number.",
          "For a visitor who goes home and comes back, or an oleh who eventually switches phones and lets the old SIM sit in a drawer, this is the second way the number dies — quietly, with no notice, taking every SMS verification it was attached to along with it.",
        ],
      },
      {
        heading: "What losing the number actually costs",
        paragraphs: [
          "This is why the trap hurts more than a normal carrier switch. When the number your institutions know stops being yours, each one has to be updated separately: the bank (often an in-person branch visit, since you can no longer receive its SMS codes), gov.il identity verification, Kupat Cholim, Bit, Pango, delivery apps, and every WhatsApp contact from your first months in Israel. It's not one errand — it's the whole first-week list, again, in reverse.",
        ],
      },
      {
        heading: "Buying at the airport anyway? Do these three things",
        paragraphs: [
          "Sometimes the airport SIM is the practical choice in the moment. If that's you, three steps protect the number:",
        ],
        steps: [
          "At purchase, insist the SIM is registered to YOUR passport — your name, your document number — not sold loose or under the store's details. If the seller won't or can't, assume the number is temporary.",
          "Keep the receipt and the SIM packaging. If ownership is ever questioned, proof of purchase is what a service center will ask for.",
          "Within your first weeks, visit the provider's own service center and confirm the registration is in your name. That confirmation is the difference between a portable number and a disposable one.",
        ],
      },
      {
        heading: "Already stuck? The honest rescue path",
        paragraphs: [
          "If your airport-SIM number is already registered everywhere and you're not sure you own it, here's the attempt — with the honest caveat that it doesn't always succeed:",
        ],
        steps: [
          "Go to the issuing provider's service center in person, with your passport and any proof of purchase.",
          "Ask them to confirm — or fix — the registration so the number is in your name. If the SIM was sold under a reseller's details, this is the step that decides everything, and it's at the provider's discretion.",
          "Once the number is registered to you, keep the line active and port whenever you're ready — an Israeli port completes in minutes, to any carrier.",
          "If the registration can't be fixed, stop investing in the number: update the bank first (SMS codes gate everything else), then gov.il, Kupat Cholim, and payment apps, and let the old number go.",
        ],
      },
      {
        heading: "The skip-the-trap path: own your number from the first hour",
        paragraphs: [
          "The trap only exists because the number came from a counter transaction with no real registration. The alternative is starting with a line that's yours before you land: [BitLink](/plans) signup happens online with no Israeli paperwork at all — no Teudat Zehut, and no passport either. Checkout takes a name, email, phone number, and a regular US, UK, or Canadian card, charged in USD with VAT included. On an eSIM-compatible phone, the activation QR code arrives within minutes and your Israeli number is live before your flight boards.",
          "That means the number you give the bank on day three is the same number you'll have in year five — no migration, no re-registration circuit. And it stays flexible in both directions: if you leave Israel for a stretch, [pause the line for $10/month](/israel-sim-for-tourists) and the number waits for you; and if you ever want to move to another Israeli carrier, every BitLink line is deliberately left open for porting out — no blocks, no release process, no exit fee. The number is simply yours.",
        ],
      },
    ],
    faq: [
      {
        question: "Can I keep my airport SIM number in Israel?",
        answer:
          "Sometimes. Israeli law supports porting, and if the SIM was registered to your own passport at purchase, the number can move to any carrier in minutes. The problem is that airport and kiosk SIMs are often registered to the seller's details or effectively to no one — and a port must match the original registration to prove ownership. Check at the provider's service center: if the registration is (or can be put) in your name, the number is portable; if not, it isn't really yours to keep.",
      },
      {
        question: "How long before an unused Israeli prepaid number expires?",
        answer:
          "It varies by brand, but the clocks are real: 019 — the brand sold at the Ben Gurion arrivals store — is documented as lapsing after six months without use, and most other Israeli prepaid brands disconnect a number after roughly twelve months of inactivity and eventually recycle it. If institutions know you by that number, its expiry takes your SMS verification access with it.",
      },
      {
        question: "Do I need a Teudat Zehut or passport to get an Israeli phone number?",
        answer:
          "At mainstream Israeli carriers, a postpaid plan generally assumes a Teudat Zehut plus Israeli bank or credit details, and prepaid SIMs are registered against a passport. BitLink requires neither: signup is online with just a name, email, phone number, and a payment card — no Israeli documents, which is why it works before you've landed and before any klita paperwork exists.",
      },
      {
        question: "Can I pay for an Israeli phone plan with a foreign credit card?",
        answer:
          "With BitLink, yes — plans are priced and charged in US dollars with VAT included, and a regular US, UK, or Canadian debit or credit card works. That's also why a parent abroad can pay for a student's or new oleh's line directly. Traditional Israeli carriers typically expect Israeli billing details for postpaid plans.",
      },
      {
        question: "Can I port my BitLink number to another Israeli carrier later?",
        answer:
          "Yes — any time, to any Israeli carrier. BitLink deliberately leaves every line open for porting out, with no blocks, no release process, and no exit fee, and an Israeli port completes in minutes. Your number is yours: BitLink keeps customers with service, not with a locked door.",
      },
    ],
    relatedLinks: [
      { href: "/guides/israeli-phone-number-before-you-land", label: "Get your number before you land" },
      { href: "/israeli-phone-plans-for-olim", label: "Phone plans for new olim" },
      { href: "/keep-your-number", label: "Number porting" },
    ],
  },
  {
    slug: "whatsapp-israeli-number-switch",
    title: "Moving WhatsApp to your Israeli number (without losing your chats)",
    metaTitle: "Switch WhatsApp to an Israeli Number — No Lost Chats",
    metaDescription:
      "How to move WhatsApp to your Israeli number without losing chats or groups, when to keep the US number, and how to run both at once. Step by step for olim.",
    datePublished: "2026-07-15",
    dateModified: "2026-07-15",
    readingTime: "6 min read",
    intro:
      "In Israel, WhatsApp isn't a social app — it's the infrastructure. Landlords, doctors, delivery drivers, gan teachers, absorption coordinators, and half of officialdom expect to reach you on it. So the real question for a new oleh isn't whether to use WhatsApp, it's which number sits behind it. The good news: WhatsApp has a built-in Change Number tool that moves your account to a new number and keeps your chats and groups intact — no lost history. Here's exactly how it works, when to switch versus keep both, and the mistakes that actually cost people their messages.",
    sections: [
      {
        heading: "First, the fear: will I lose my chats? (No.)",
        paragraphs: [
          "The single most common worry — the one that stops people from switching for months — is that changing the number wipes their history. It doesn't. WhatsApp has an official Change Number feature built for exactly this: it moves your existing account, chats, groups, and settings from your old number to your new one. Your conversations live on your phone and in your account, not on the phone number itself.",
          "What the number actually controls is verification (the SMS or call WhatsApp uses to confirm it's you) and discoverability (how new people find you). That's why the number matters — but it's also why moving it correctly is a settings change, not a data loss event.",
        ],
      },
      {
        heading: "The clean switch: WhatsApp's Change Number tool",
        paragraphs: [
          "Do this once your Israeli line is active and can receive an SMS or call, and while your old number is still reachable — that overlap is what makes it painless. The exact wording shifts slightly by app version, but the flow is:",
        ],
        steps: [
          "Make sure both numbers are usable right now: the Israeli line active in your phone, and the old number still able to receive a verification code (keep the old SIM or line live until this is done).",
          "Open WhatsApp → Settings → Account → Change Number.",
          "Enter your old number in the top field and your new Israeli number in the bottom field.",
          "Choose whether to notify your contacts — you can notify all of them, just the ones you have chats with, or only selected contacts. Notifying the people you actually talk to saves them re-saving you later.",
          "Verify the new Israeli number with the code WhatsApp sends it. Your account, chats, and groups move over; group admins don't need to re-add you.",
          "Tell close family and any critical contacts directly, so anyone who might start a brand-new conversation has your Israeli number saved.",
        ],
      },
      {
        heading: "Switch, keep, or run both? Pick by how you actually live",
        paragraphs: [
          "Switch your main WhatsApp to the Israeli number if Israel is now home. This is the setup most long-term olim land on, because the daily friction is all on the Israeli side: the plumber, the school WhatsApp group, the Yad2 seller, and the delivery driver all expect an Israeli number, and giving them a US number every time gets old fast.",
          "Keep your US number on WhatsApp only if your center of gravity is still American — you run a US business, most of your chats are with people back home, and you rarely need locals to WhatsApp you. Even then, know that new Israeli contacts will keep expecting an Israeli number.",
          "Run both at once if you genuinely straddle two countries. Modern phones support two WhatsApp identities: either WhatsApp's own multi-account feature (Settings → tap your name/the arrow → Add account) or the classic approach of regular WhatsApp on one number and WhatsApp Business — a separate, free official app — on the other. It works well; just be honest that you're now managing two inboxes, and decide which number is your default answer to \"what's your WhatsApp?\"",
        ],
      },
      {
        heading: "The mistakes that actually cost people",
        paragraphs: [
          "Cancelling the old number before switching. If you kill the US line first and WhatsApp later asks it to re-verify, you can get locked out of the account tied to it. Always switch — or at least confirm the new number is working on WhatsApp — while the old number can still receive a code.",
          "Trying to run WhatsApp on Google Voice. A number ported to Google Voice frequently can't activate a fresh WhatsApp account, and GV's call/SMS handling doesn't reliably deliver WhatsApp's verification. If your plan is 'port my US number to Google Voice and keep WhatsApp on it,' test it before you rely on it — this is a documented failure point.",
          "Assuming a data-only Israel eSIM gives you a WhatsApp number. Travel eSIMs are data pipes with no phone number attached, so there's nothing for WhatsApp to verify or for locals to message. A real Israeli plan includes an actual number — the [difference between a travel eSIM and a real Israeli line](/israel-esim) matters here specifically.",
        ],
      },
      {
        heading: "iMessage and FaceTime, briefly",
        paragraphs: [
          "These worry people less once they understand the mechanism: iMessage and FaceTime run off your Apple ID, which is an email as much as a phone number. So even if your US number eventually goes away, iMessage and FaceTime keep working through your Apple ID email. Before you retire the old US line, open Settings and confirm your Israeli number and Apple ID email are both listed for iMessage and FaceTime, then tell family which one to use. In practice, once you're in Israel, almost everything shifts to WhatsApp anyway.",
        ],
      },
      {
        heading: "The option that skips the whole dilemma: bring your US number with you",
        paragraphs: [
          "Almost all of the agonizing above — switch or keep, one WhatsApp or two, will banks still text me — exists because people assume their US number has to stay in America. It doesn't have to. If the exact US number matters to you, you can [port it onto a BitLink line](/keep-your-number) and it becomes a real, working number you carry in Israel — no Google Voice, no forwarding tricks, no second carrier bill back home.",
          "What that does to the WhatsApp question is the good part: your US number keeps working on WhatsApp, because it's still a live number — just one that now lives on your phone in Israel instead of on a US network. Family who only ever had your American number still reach you; the account they've always known keeps working. So do bank and verification texts — tested with real Chase and Google codes arriving on a BitLink US number in Israel — which answers the \"will banks still text me\" worry directly. And you can add a separate Israeli number alongside it for local life, so you're not forced to choose between 'the number everyone in America has' and 'the number Israel expects.' You keep both, on one phone, on one bill.",
          "One honest caveat on timing: porting a US number isn't the near-instant flip an Israeli-to-Israeli port is. Because it means coordinating with your US carrier abroad, it typically takes about three to five business days, and there's a one-time $49.99 fee. Your old number keeps working the whole time, so there's no gap — but plan for it as a few-day process, not a same-day one, and don't cancel the US line until the port has completed.",
          "So the honest full menu is three options, not two: switch WhatsApp to a new Israeli number, keep it on your US number (from wherever that number lives), or bring the US number to Israel with you and stop maintaining a US plan at all. For a lot of olim who dreaded 'losing' their number, that third path is the one they wish they'd known about first.",
        ],
      },
      {
        heading: "The setup that avoids all of this",
        paragraphs: [
          "Everything above gets easier when your Israeli number exists early and is genuinely yours. Activate a real Israeli line before you land — with [BitLink](/plans), an eSIM-compatible phone can be set up online before the flight, so the number is live when you arrive and ready for the WhatsApp switch on day one. The [before-you-land guide](/guides/israeli-phone-number-before-you-land) covers the activation, and the [US-number-before-aliyah guide](/guides/us-phone-number-before-aliyah) covers what to do with the American number itself.",
          "One caution that trips people up specifically with WhatsApp: switch onto a number you actually own. Airport and kiosk SIMs are often registered to the seller, and if you build your WhatsApp, your bank, and your government logins on a number that later turns out not to be yours — and expires or can't be ported — you're rebuilding all of it. [The airport SIM trap](/guides/airport-sim-trap-israel) explains how that happens and how to avoid it.",
        ],
      },
    ],
    faq: [
      {
        question: "Will I lose my WhatsApp chats if I change to an Israeli number?",
        answer:
          "No. WhatsApp's built-in Change Number tool (Settings → Account → Change Number) moves your account, chats, groups, and settings to the new number. Your history lives on your phone and in your account, not on the phone number. Do it while both the old and new numbers can still receive a verification code.",
      },
      {
        question: "How do I switch my WhatsApp number when I move to Israel?",
        answer:
          "Activate your Israeli line, then open WhatsApp → Settings → Account → Change Number, enter your old number and your new Israeli number, choose whether to notify contacts, and verify the new number with the code sent to it. Groups carry over automatically and you keep your chats.",
      },
      {
        question: "Can I have two WhatsApp accounts on one phone?",
        answer:
          "Yes. Most modern phones support two WhatsApp identities — either through WhatsApp's own add-account feature or by running regular WhatsApp on one number and WhatsApp Business (a separate free app) on the other. Many olim keep a US number on one and their Israeli number on the other.",
      },
      {
        question: "Does WhatsApp work on a Google Voice number?",
        answer:
          "Often not reliably. A number ported to Google Voice frequently can't activate a fresh WhatsApp account, and GV doesn't consistently deliver WhatsApp's verification codes. If you're planning to keep WhatsApp on a Google Voice number, test it before you depend on it — it's a common failure point for olim.",
      },
      {
        question: "Should I switch WhatsApp to my Israeli number or keep my US one?",
        answer:
          "For long-term aliyah, switching is usually cleaner — landlords, schools, doctors, delivery drivers, and officials all expect an Israeli mobile number and reach you by WhatsApp. Keep the US number only if your daily life is still mostly American, or run both at once if you straddle two countries.",
      },
      {
        question: "Can I keep my US number on WhatsApp after moving to Israel?",
        answer:
          "Yes — and you don't have to give up the number to do it. If you port your US number to a BitLink line, it stays a real working number you carry in Israel, so it keeps working on WhatsApp exactly as before and family who only have your American number still reach you. You can add a separate Israeli number alongside it for local life, keeping both on one phone and one bill — no Google Voice or forwarding workarounds needed. Unlike an Israeli-to-Israeli port (minutes), a US port takes about three to five business days plus a one-time $49.99 fee, and your old number keeps working until it completes.",
      },
      {
        question: "Will my iMessage and FaceTime still work after I move?",
        answer:
          "Yes — both run off your Apple ID, which uses your email as well as your phone number, so they keep working even if the US number goes away. Before retiring the old line, confirm your Israeli number and Apple ID email are both listed for iMessage and FaceTime in Settings.",
      },
    ],
    relatedLinks: [
      { href: "/guides/us-phone-number-before-aliyah", label: "What to do with your US number" },
      { href: "/guides/israeli-phone-number-before-you-land", label: "Get your number before you land" },
      { href: "/israeli-phone-plans-for-olim", label: "Phone plans for new olim" },
    ],
  },
  {
    slug: "do-us-phones-work-in-israel",
    title: "Do US phones work in Israel? What your carrier won't tell you",
    metaTitle: "Do US Phones Work in Israel? Roaming vs. Israeli eSIM",
    metaDescription:
      "Yes, if it's unlocked. But Verizon and AT&T roaming run $12/day, T-Mobile throttles hard, and none of them give you an Israeli number.",
    datePublished: "2026-07-16",
    dateModified: "2026-07-16",
    readingTime: "7 min read",
    intro:
      "Short answer: yes, your US phone works in Israel — the hardware isn't the problem. Any reasonably modern iPhone or Android connects to Israeli networks without any special setup, as long as the phone is unlocked. The real question is what plan it runs on. Roaming on a US carrier costs $12 a day on Verizon or AT&T, and T-Mobile's \"free\" international data crawls at 256kbps. That's tolerable for a ten-day trip. For a semester, a gap year, or a move, it's the most expensive possible way to stay connected — and even at full price, it never gives you the one thing daily life in Israel actually requires: an Israeli phone number.",
    sections: [
      {
        heading: "Will my US phone work on Israeli networks?",
        paragraphs: [
          "Israeli carriers run standard GSM/LTE/5G networks on frequencies that every recent iPhone (XS and newer) and every recent Android flagship supports. Band compatibility hasn't been a real issue for years. Your phone will see Israeli networks the moment you land.",
          "The one thing that stops a US phone cold is a carrier lock. Phones bought on installment plans from Verizon, AT&T, or T-Mobile are usually locked to that carrier until they're paid off or a waiting period passes — and a locked phone refuses any other provider's SIM or eSIM, Israeli or otherwise. Check before you fly: search your carrier's site for \"unlock\" or look in the phone's settings (iPhone: Settings → General → About → Carrier Lock, which should say \"No SIM restrictions\"). Unlocking can take days to process, and it's a much worse errand to run from a dorm in Jerusalem than from your couch at home.",
        ],
      },
      {
        heading: "What does US carrier roaming cost in Israel? (mid-2026)",
        paragraphs: [
          "Verizon TravelPass: $12 per day, charged on any day the phone uses the network at all. You get 5GB of high-speed data per day, then slower speeds. Use it daily and a month runs about $360.",
          "AT&T International Day Pass: also $12 per day (it went up from $10 in May 2026), capped at 10 daily fees per billing cycle — so a full month costs about $120 for unlimited talk, text, and data.",
          "T-Mobile is the outlier: most current plans include international roaming in Israel at no extra charge — but the included data is throttled to roughly 256kbps, a speed at which maps stutter and video simply doesn't. Higher-tier plans include 5GB or 15GB of high-speed data per month; after that it's back to a crawl, or you buy an International Pass ($35 for 10 days/5GB, $50 for 30 days/15GB).",
          "For comparison: a real Israeli plan from [BitLink](/plans) runs $14.99 to $39.99 per month — full-speed 5G on an Israeli network, no daily meter running. A month of Verizon roaming costs roughly ten times BitLink's most popular plan.",
        ],
        table: {
          columns: ["Option", "Cost for a month", "Usable data", "Israeli number?"],
          rows: [
            {
              cells: [
                "Verizon TravelPass",
                "~$360 ($12/day, charged each day the phone is used)",
                "5GB/day at high speed, then slowed",
                "No",
              ],
            },
            {
              cells: [
                "AT&T International Day Pass",
                "~$120 ($12/day, capped at 10 daily fees per cycle)",
                "Unlimited high-speed",
                "No",
              ],
            },
            {
              cells: ["T-Mobile International Pass", "$50 per 30 days", "15GB high-speed", "No"],
            },
            {
              cells: [
                "[BitLink Student 5G](/plans/student-5g)",
                "$34.99/month",
                "50GB of full-speed 5G",
                "Yes — a real 05 number",
              ],
              highlight: true,
            },
            {
              cells: [
                "T-Mobile included roaming",
                "$0",
                "~256kbps — WhatsApp texts and email work; maps stutter, video won't play. Fine for a short visit, not a primary line",
                "No",
              ],
            },
          ],
          note: "Carrier prices as of mid-2026 — roaming rates change, so check your carrier's international page before relying on them. And if bank verification texts to your US number are what's keeping you on roaming: dual SIM solves that — your US SIM stays in the phone and keeps receiving them — and so does porting the number to BitLink or adding a US line ($9.99/mo), both of which receive bank and verification texts (tested with real Chase and Google codes).",
        },
      },
      {
        heading: "Can I roam on a US carrier for a semester or a year?",
        paragraphs: [
          "All three carriers write their international terms around temporary travel. Lines that spend months abroad — the majority of their usage outside the US — can be flagged under primary-use rules, throttled, or in some cases have international service cut off entirely. The exact thresholds vary by carrier and aren't always published, but the pattern is consistent: roaming is priced and policed as a vacation feature.",
          "If you're going for ten days, none of this matters. If you're going for a semester, a gap year, or aliyah, you'd be betting a year of connectivity on a feature designed for two weeks — at the highest price on the menu.",
        ],
      },
      {
        heading: "Do I still need an Israeli number if roaming works?",
        paragraphs: [
          "Pay Verizon $360 a month and your number is still +1. Israel runs daily life through an Israeli 05 mobile number: banks send verification codes to it, [Bit and Pango won't sign you up without one](/guides/israeli-phone-number-for-banking-bit-pango), Kupat Cholim wants it, gov.il wants it, the delivery driver and the landlord and the program office all message it on WhatsApp. A roaming American number fails every one of those checks.",
          "This is the part carriers can't fix at any price, and it's why \"does my US phone work in Israel\" is really two questions. The phone? Works fine. The plan? For anything longer than a short trip, the answer that actually functions is a local one.",
        ],
      },
      {
        heading: "How do I keep my US number and get an Israeli one?",
        paragraphs: [
          "Modern phones run two lines at once, and that's the whole trick. Keep your US SIM in the phone so the number your bank and family know stays reachable, and add an Israeli eSIM as the working line — data, calls, local SMS, and the Israeli number every form asks for. On an eSIM-compatible phone, [the Israeli line can be live before your flight](/guides/israeli-phone-number-before-you-land): checkout online with a regular US card (no Israeli ID, no Israeli bank account), scan a QR code, done.",
          "With the Israeli line handling data, you can drop the US line to its cheapest tier or turn roaming off entirely — it just needs to receive the occasional text, and that includes the ones that matter most: bank and verification codes keep arriving on the US SIM exactly as they always did, because the number never went anywhere. Longer term, some people [port the US number onto their Israeli line](/keep-your-number) or replace it with a [US number add-on](/us-number-in-israel) for $9.99/month, and stop paying an American carrier altogether — both receive US bank and verification texts (tested with real Chase and Google codes), so dropping the US carrier doesn't mean losing the texts that matter. The add-on is live right away; a port takes 3–5 business days with the old number working throughout.",
        ],
      },
      {
        heading: "When is roaming actually the right choice?",
        paragraphs: [
          "Honesty department: for a short trip, US roaming can be the correct choice. T-Mobile customers who can live with slow data pay nothing extra. An AT&T or Verizon customer visiting for a week pays $84 and skips all setup. If you're coming for under two weeks, don't need an Israeli number, and value zero effort over speed, use what you have.",
          "The math flips somewhere around week two or three, and it flips hard for anyone staying months: students, gap year programs, olim, and long visits. That's the point where a real Israeli plan is both several times cheaper and the only option that actually works with Israeli systems.",
        ],
      },
    ],
    faq: [
      {
        question: "Will my iPhone from the US work in Israel?",
        answer:
          "Yes. iPhones from the XS onward support Israeli networks and eSIM. The only blocker is a carrier lock — check Settings → General → About → Carrier Lock, which should read \"No SIM restrictions.\" If it's locked, request the unlock from your carrier before flying; it can take days to process.",
      },
      {
        question: "Does Verizon work in Israel?",
        answer:
          "Yes, via TravelPass at $12 per day, charged on any day the phone touches the network — about $360 for a full month, with 5GB of high-speed data per day before slowdown. It works, but it's priced for short trips, and your number stays American, which Israeli banks and apps won't accept.",
      },
      {
        question: "Does T-Mobile's free international data work in Israel?",
        answer:
          "Yes — Israel is in T-Mobile's included roaming destinations, and there's no daily fee. The catch is speed: included data runs at roughly 256kbps, which handles WhatsApp texts but struggles with maps and can't stream. Higher tiers include 5GB or 15GB of monthly high-speed data; after that you're throttled or buying passes.",
      },
      {
        question: "Is it cheaper to roam or get an Israeli SIM?",
        answer:
          "For under two weeks, roaming is often fine. Beyond that, an Israeli plan wins decisively: BitLink plans run $14.99–$39.99/month at full 5G speed, versus roughly $120/month on AT&T's capped Day Pass or $360/month on Verizon TravelPass — and only the Israeli plan comes with the Israeli number that local banks, Bit, Pango, and deliveries require.",
      },
      {
        question: "Can I keep my US number if I switch to an Israeli plan?",
        answer:
          "Yes, three ways: keep the US SIM alongside the Israeli eSIM in the same phone (dual SIM), port the US number onto the Israeli line so it works from Israel, or replace it with a US local number added to the Israeli plan for $9.99/month. All three keep US bank and verification texts arriving — the ported and add-on numbers have been tested with real Chase and Google codes. Dual SIM and the add-on work right away; a port takes 3–5 business days. Most people run dual SIM first and decide later.",
      },
      {
        question: "Do I need to do anything before I fly?",
        answer:
          "Two things: confirm the phone is unlocked, and set up the Israeli line — on an eSIM phone that's an online checkout and a QR code, done from home in about ten minutes, so the Israeli number is live when you land. No Israeli ID or Israeli credit card is needed.",
      },
    ],
    relatedLinks: [
      { href: "/israel-esim", label: "Israel eSIM with a real number" },
      { href: "/guides/israeli-phone-number-before-you-land", label: "Get your number before you land" },
      { href: "/keep-your-number", label: "Port your US number to Israel" },
      { href: "/us-number-in-israel", label: "US number add-on" },
          { href: "/guides/how-to-call-israel-from-the-us", label: "Calling Israel from the US" },
    ],
  },
  {
    slug: "will-my-phone-work-in-israel",
    title: "Will my phone work in Israel? What to check before you go",
    metaTitle: "Will My Phone Work in Israel? What to Check Before You Go",
    metaDescription:
      "Almost certainly, if it's unlocked. How to check it's unlocked, confirm Israel's bands, and choose between eSIM, local SIM and roaming.",
    datePublished: "2026-07-24",
    dateModified: "2026-07-24",
    readingTime: "7 min read",
    intro:
      "Short answer: almost any modern phone works in Israel, and the hardware is rarely the problem. Israel's networks run standard 4G and 5G on frequencies every recent iPhone and Android already supports, so your phone will see Israeli signal the moment you land. The two things actually worth checking before you fly are whether your phone is unlocked and how you plan to connect once you're there — a local eSIM, a physical SIM, a pocket WiFi, or roaming on your home carrier. This guide walks through both, so you touch down connected instead of hunting for a fix from the arrivals hall.",
    sections: [
      {
        heading: "Will my phone work in Israel?",
        paragraphs: [
          "For almost everyone, yes. Israeli carriers — Partner, Cellcom, Pelephone, HOT Mobile and the rest — run ordinary GSM / LTE / 5G networks on bands that every recent phone supports. Any iPhone from the XS onward, and every recent Pixel or Galaxy, connects without special setup. Band compatibility genuinely hasn't been a real obstacle for years; if your phone is newer than about 2018, assume the frequencies are fine.",
          "The one thing that stops a phone cold isn't the network — it's a carrier lock. Phones bought on an installment plan from a US, UK, or Canadian carrier are often locked to that carrier until they're paid off or a waiting period passes, and a locked phone refuses any other SIM or eSIM, Israeli or otherwise. So \"will my phone work in Israel\" is really two smaller questions: is it unlocked, and does it support the bands? The second is almost always yes. The first is the one to actually check — and to check from your couch at home, not a dorm in Jerusalem, because unlocking can take days to process.",
        ],
      },
      {
        heading: "How do I check if my phone is unlocked?",
        paragraphs: [
          "On an iPhone, open Settings → General → About and scroll to Carrier Lock. If it reads \"No SIM restrictions,\" your iPhone is unlocked and ready for an Israeli SIM or eSIM. If it names a carrier, it's locked to that network.",
          "On Android, the menu names vary slightly by brand, but the path is roughly Settings → Connections (or Network & Internet) → Mobile Network → Network Operators. If the phone can search and show multiple available networks, it's unlocked; if it only ever shows one carrier and can't search others, it's locked. When in doubt, the surest check is to search your carrier's website for \"unlock policy\" — and if the phone is locked, request the unlock before you travel, since it isn't instant.",
        ],
      },
      {
        heading: "Which network bands does Israel use, and does my phone support them?",
        paragraphs: [
          "You almost certainly don't need to worry about this — the reassurance is the point of the table below, not a warning. Modern iPhones, Galaxies, and Pixels support Israel's bands out of the box. It's only worth a look if your phone is older, a regional model, or a budget device that trimmed its band support. 3G is being retired across Israeli networks and 2G lingers only as basic voice fallback, so what matters is 4G/LTE and 5G.",
        ],
        table: {
          columns: ["Technology", "Bands used in Israel", "Frequencies"],
          rows: [
            { cells: ["5G", "n78, n28", "3500 MHz, 700 MHz"] },
            { cells: ["4G / LTE", "B1, B3, B7, B8, B28", "2100, 1800, 2600, 900, 700 MHz"] },
            { cells: ["3G (being phased out)", "B1, B8", "2100, 900 MHz"] },
          ],
          note: "Supporting even a couple of these is enough to connect. If you're not sure what your phone supports, search your exact model plus \"frequency bands\" — but for any recent flagship, you're covered.",
        },
      },
      {
        heading: "What should I check before I fly?",
        paragraphs: [
          "A few minutes at home saves a stressful hour after landing. Run through this list before you travel:",
        ],
        steps: [
          "Confirm your phone is unlocked (see above) — this is the only real blocker, and the only one that takes days to fix.",
          "Confirm it's reasonably modern; if it's older than ~2018 or a regional model, glance at the bands above.",
          "Install pending software updates and back up your phone.",
          "Download offline maps for where you're going (Tel Aviv, Jerusalem, Haifa), and save hotel, contacts, and any tickets offline.",
          "Set up how you'll connect — ideally an eSIM you activate before the flight, so you land already online instead of shopping for signal.",
        ],
      },
      {
        heading: "What are my options for staying connected in Israel?",
        paragraphs: [
          "Once the phone itself is sorted, the real decision is how it connects. There are four common routes, and the right one depends mostly on how long you're staying and whether you need a local number for daily life — not just data.",
        ],
        table: {
          columns: ["Option", "How you get it", "Gives an Israeli number?", "Best for"],
          rows: [
            {
              cells: [
                "Local SIM (physical)",
                "Bought at an airport kiosk or carrier store after you land; sometimes needs ID",
                "Yes",
                "Long stays if you don't mind a store visit and swapping the SIM",
              ],
            },
            {
              cells: [
                "[BitLink eSIM](/israel-esim)",
                "Order online before you fly, scan a QR code — live the moment you land, no store, no ID, foreign card is fine",
                "Yes — a real 05 number",
                "Anyone staying more than a few days, or who needs a number for banks/apps",
              ],
              highlight: true,
            },
            {
              cells: [
                "Pocket WiFi",
                "Rent a portable router, pick up/return at the airport or by delivery, charge it daily",
                "No",
                "Families or groups sharing one connection across several devices",
              ],
            },
            {
              cells: [
                "Home-carrier roaming",
                "Turn it on with your existing carrier — convenient but priced for short trips",
                "No (stays your home number)",
                "A quick visit where you'll pay for zero setup",
              ],
            },
            {
              cells: [
                "Free public WiFi",
                "Cafés, hotels, malls, some city centers",
                "No",
                "Light, occasional browsing only — not navigation or logins",
              ],
            },
          ],
          note: "Order here isn't a ranking — it's whichever fits your trip. Public WiFi is common in Israel but varies wildly in speed and isn't safe for banking or logins, so don't rely on it as your main connection. For anything longer than a short trip, a local number (SIM or eSIM) is what actually plugs you into Israeli daily life; more on why below.",
        },
      },
      {
        heading: "eSIM, SIM, pocket WiFi, or roaming — which should I pick?",
        paragraphs: [
          "If you're here for under two weeks, don't need a local number, and value zero effort, roaming on your home carrier or a data-only eSIM is fine — though roaming is usually the most expensive way to do it (we break the numbers down in [Do US phones work in Israel?](/guides/do-us-phones-work-in-israel)). Traveling as a family or a group with lots of devices? A pocket WiFi can be the cheapest way to cover everyone at once, at the cost of carrying and charging a second gadget.",
          "For everyone else — students, gap-year and seminary programs, olim, remote workers, anyone staying weeks or months — a local Israeli line is both cheaper and the only option that works with Israeli systems. An [eSIM you set up before you land](/guides/israeli-phone-number-before-you-land) is the least-hassle version of that: no store, no physical SIM to swap, and you arrive already connected with a real Israeli number.",
        ],
      },
      {
        heading: "What most \"Israel eSIMs\" don't tell you",
        paragraphs: [
          "Here's the catch worth knowing before you buy: most products marketed as an \"Israel eSIM\" are data-only tourist plans. They roam on a local network and give you internet, but no Israeli phone number. That's fine for a few days of maps and WhatsApp — and useless the moment anything asks for an 05 number, which in Israel is constantly. Banks send verification codes to it, [Bit and Pango won't sign you up without one](/guides/israeli-phone-number-for-banking-bit-pango), gov.il and Kupat Cholim want it, and the landlord, the delivery driver, and the program office all message it.",
          "[BitLink](/israel-esim) is a real Israeli line, not a roaming data pass: a genuine 05 number on the local network, delivered as an eSIM you activate before your flight. Checkout is online with a regular US, UK, or Canadian card — no Israeli ID and no Israeli bank account — so the number is live when you land, and it works with everything a data-only eSIM can't. If you also need your home-country bank texts to keep arriving, you can [add a US, UK, or Canadian number](/us-number-in-israel) to the same phone for $9.99/month (tested with real Chase and Google codes).",
        ],
      },
    ],
    faq: [
      {
        question: "Will my phone work in Israel?",
        answer:
          "Almost certainly, if it's unlocked and reasonably modern. Israeli networks use standard 4G/5G bands that recent iPhones, Galaxies, and Pixels all support, so the phone connects on landing. The only real blocker is a carrier lock — check that before you fly.",
      },
      {
        question: "Do US phones work in Israel?",
        answer:
          "Yes — an unlocked US phone connects to Israeli networks fine. The real question is what plan it runs on: US carrier roaming is expensive and never gives you the Israeli number local life requires. We compare the costs in [Do US phones work in Israel?](/guides/do-us-phones-work-in-israel).",
      },
      {
        question: "How do I know if my phone is unlocked?",
        answer:
          "On iPhone: Settings → General → About → Carrier Lock should read \"No SIM restrictions.\" On Android: Settings → Mobile Network → Network Operators — if it can search and show multiple carriers, it's unlocked. If it's locked, request the unlock from your carrier before traveling, as it can take days.",
      },
      {
        question: "Which network bands does Israel use?",
        answer:
          "5G on n78 (3500 MHz) and n28 (700 MHz); 4G/LTE on B1, B3, B7, B8, and B28 (2100, 1800, 2600, 900, and 700 MHz). Any recent flagship supports enough of these to connect — it's only worth checking on older or regional-model phones.",
      },
      {
        question: "Is eSIM available in Israel?",
        answer:
          "Yes, and it's the easiest way to connect — no store, no physical SIM. Just note that many \"Israel eSIMs\" are data-only and give you no local number. A [BitLink eSIM](/israel-esim) is a real Israeli line with an 05 number, set up before you land.",
      },
      {
        question: "Do I actually need an Israeli number?",
        answer:
          "For a short tourist trip, no — data alone is enough. For anything longer, yes: Israeli banks, Bit, Pango, gov.il, and everyday WhatsApp all run on a local 05 number, and a roaming foreign number fails those checks. A [local eSIM or SIM](/guides/israeli-phone-number-before-you-land) is the fix.",
      },
      {
        question: "Is pocket WiFi worth it in Israel?",
        answer:
          "It can be, for a family or group sharing one connection across several devices, since one router covers everyone. The trade-offs are daily charging, pickup/return logistics, and rental fees that add up. For a single traveler, an eSIM is simpler and usually cheaper — and it gives you a number, which pocket WiFi doesn't.",
      },
      {
        question: "Is there good public WiFi in Israel?",
        answer:
          "It's widely available in cafés, hotels, malls, and parts of Tel Aviv and Jerusalem, and it's fine for casual browsing. Speeds vary a lot, though, and open WiFi isn't safe for banking or logins — so it's a supplement, not a connection to rely on.",
      },
    ],
    relatedLinks: [
      { href: "/israel-esim", label: "Israel eSIM with a real number" },
      { href: "/israel-sim-for-tourists", label: "Israel SIM for tourists" },
      { href: "/guides/do-us-phones-work-in-israel", label: "Do US phones work in Israel?" },
      { href: "/guides/israeli-phone-number-before-you-land", label: "Get your number before you land" },
          { href: "/guides/esim-israel", label: "Setting up your eSIM in Israel" },
          { href: "/guides/travel-esim-or-phone-plan-israel", label: "Travel eSIM or phone plan?" },
    ],
  },
  {
    slug: "how-much-data-do-i-need-in-israel",
    title: "How much data do I need in Israel?",
    metaTitle: "How Much Data Do I Need in Israel? Real Numbers by Lifestyle",
    metaDescription:
      "Real per-app numbers and honest monthly estimates for students, families and tourists in Israel — plus how no-overage plans avoid surprise bills.",
    datePublished: "2026-07-24",
    dateModified: "2026-07-24",
    readingTime: "8 min read",
    intro:
      "Short answer: a smartphone-normal month in Israel — WhatsApp all day, navigation most days, music, some video — usually lands between 10 and 30GB. A light user on home WiFi can live on far less; a remote worker hotspotting a laptop can burn double. The honest way to answer this isn't a guess, it's arithmetic: what the apps you actually use consume per hour, times how you'll live here. This guide does that math for four kinds of people — students, families making aliyah, tourists, and remote workers — and explains the part most carriers bury: on BitLink there's no overage billing at all. If you hit your cap, data simply pauses until you top up or the month resets. You can size your plan honestly, because a wrong guess costs you a $5.99 topup, not a scary bill.",
    sections: [
      {
        heading: "What do the apps you use actually consume?",
        paragraphs: [
          "Almost all of your data goes to a handful of apps, and their appetites are wildly different. Messaging is nearly free: WhatsApp texts are a rounding error, and even WhatsApp voice calls run only around 30MB per hour. Navigation is lighter than people think — Google Maps uses roughly 3–5MB per hour of driving, Waze somewhat more since it constantly syncs live traffic. The real consumers are video and video calls: YouTube at phone quality runs roughly 0.5–1GB per hour, Netflix about 1GB per hour at standard quality (much more in HD), and a Zoom or WhatsApp video call somewhere between 0.3 and 1GB+ per hour depending on quality.",
          "Music streaming sits in the middle — roughly 70–150MB per hour on Spotify depending on quality, which adds up quietly if it runs all day. Social feeds (Instagram, TikTok) behave like video, because they mostly are video: an hour of scrolling can easily be 0.5–1GB. The takeaway: a month of heavy WhatsApp and daily navigation barely dents a plan. A month of daily video streaming or video calls on cellular is what actually decides your plan size.",
        ],
        table: {
          columns: ["Activity", "Rough data per hour", "A month of typical use"],
          rows: [
            { cells: ["WhatsApp texts", "negligible", "well under 1GB"] },
            { cells: ["Google Maps / Waze navigation", "~3–30MB", "under 1GB for daily driving"] },
            { cells: ["WhatsApp voice calls", "~30MB", "1–2GB for frequent callers"] },
            { cells: ["Spotify / music streaming", "~70–150MB", "2–5GB for daily listening"] },
            { cells: ["Instagram / TikTok scrolling", "~0.5–1GB", "5–15GB for a daily habit"] },
            { cells: ["YouTube (phone quality)", "~0.5–1GB", "10GB+ for an hour a day"] },
            { cells: ["Zoom / video calls", "~0.3–1GB+", "5–20GB if they happen on cellular"] },
          ],
          note: "Figures are approximations from published app documentation and vary with quality settings — but the ordering is what matters: messaging and maps are cheap, video is expensive.",
        },
      },
      {
        heading: "How much data does a student or gap-year need?",
        paragraphs: [
          "The student pattern: WhatsApp running all day (texts, groups, voice notes), navigation a few times a week, music on buses, social feeds in downtime, video calls home on Sundays, and — crucially — yeshiva, seminary, or dorm WiFi covering evenings. That mix realistically lands in the 10–25GB range. A real student line on our network used about 9GB in a typical recent month, mostly WhatsApp, navigation, and music — with dorm WiFi doing the heavy lifting for video.",
          "That's why [Student 5G](/plans/student-5g) carries 50GB: it's sized so a normal student month fits with room for the heavy weeks — a Ben Yehuda afternoon of TikTok, a tiyul week living off mobile data, hotspotting a laptop when the dorm WiFi dies. If you're consistently streaming video on cellular or hotspotting daily, that's [Max 5G](/plans/max-5g) territory (120GB). Basic's 1GB is genuinely not a smartphone-student plan — it exists for light-use and secondary lines.",
        ],
      },
      {
        heading: "How much data does a family making aliyah need?",
        paragraphs: [
          "Family math is different because home WiFi absorbs most of the load — evenings, streaming, kids' tablets all ride the house connection. A parent's phone doing WhatsApp, errands-navigation, calls, and some scrolling typically uses 5–15GB per month. Teenagers are their own weather system: a teen streaming video and social feeds on cellular can out-consume both parents combined, and is the family member most likely to actually need 50GB.",
          "The practical setup most aliyah families land on: parents on [Basic](/plans/basic) or Student 5G depending on their habits, heavy-scrolling teens on Student 5G, and one bigger plan for whoever hotspots or commutes with video. Because BitLink is month-to-month with no contract, the honest strategy is to start a size smaller than you fear you need, watch a real month of usage in [your account portal](/account/lines), and adjust — changing plans costs nothing.",
        ],
      },
      {
        heading: "How much data does a tourist need for one or two weeks?",
        paragraphs: [
          "Tourist usage is navigation-heavy but WiFi-rich: maps between sites, WhatsApp coordination, photo uploads in the evening from the hotel. That pattern runs roughly 0.5–1GB per day of active touring — call it 5–15GB for a one-to-two-week trip, with the top end for heavy photo/video sharers and story posters.",
          "Any BitLink plan covers a tourist month; what matters more for visitors is that the plan comes [with a real Israeli number](/israel-esim) — for restaurant callbacks, drivers, and anything that needs a local SMS — which data-only tourist eSIMs don't give you. Set it up [before you land](/guides/israeli-phone-number-before-you-land) and cancel or [pause](/plans) after the trip; there's no contract either way.",
        ],
      },
      {
        heading: "How much data does a remote worker need?",
        paragraphs: [
          "One number dominates this persona: video meetings burn 0.3–1GB+ per hour, and a hotspotted laptop treats mobile data like a home connection — background sync, updates, cloud drives. A remote worker whose calls happen on office or apartment WiFi can live comfortably on 20–30GB. A remote worker who regularly works from cafés, buses, or a hotspotted laptop should start at [Max 5G's](/plans/max-5g) 120GB and treat WiFi as the primary work connection wherever it exists.",
          "The good news: this is the persona that most benefits from BitLink's no-overage model. A brutal deadline week on hotspot can't generate a surprise bill — worst case, you buy a topup and keep working.",
        ],
      },
      {
        heading: "What happens if I run out — and how do I right-size without fear?",
        paragraphs: [
          "Here's the part that changes how you should choose: BitLink has no overage billing. When you hit your data cap, data simply pauses — calls and SMS keep working — until you either add a topup or your allowance resets with the new month. You will never get a surprise bill for going over, because going over isn't billable; it's just a pause. We also email you before it happens — a heads-up at 80% used and again near the limit, with your reset date — so running dry is never a mystery.",
          "Topups are self-serve in [your account portal](/account/lines): +5GB for $5.99 up to +50GB for $34.99, charged to your card on file and live within minutes. So the honest sizing strategy is simple: pick the plan that fits your normal month, not your worst imaginable one. A wrong guess costs a few dollars once — and if you're topping up every month, that's the signal to move up a plan, which you can do instantly, no contract, no penalty.",
        ],
      },
      {
        heading: "How do I make my data go further?",
        paragraphs: [
          "We'd rather you buy the right size than run dry mid-month, so here are the habits that genuinely stretch a plan. Let WiFi carry the heavy stuff: your phone auto-joins home, yeshiva, or office WiFi once you've connected there — save video streaming, app updates, and cloud photo backup for those moments. In WhatsApp, turn off media auto-download on cellular (Settings → Storage and Data) so fifty group-chat videos don't download themselves on the bus. Download offline maps for your city and playlists for your commute. And both iOS (Low Data Mode) and Android (Data Saver) have one-switch modes that stop background apps from quietly eating gigabytes.",
          "None of this is about using your phone less — it's about pointing the expensive stuff at WiFi so your mobile data is there when you're actually out and need it.",
        ],
      },
    ],
    faq: [
      {
        question: "How much data do I need per month in Israel?",
        answer:
          "A normal smartphone month — WhatsApp all day, navigation, music, some video — typically runs 10–30GB. Light users on home WiFi need under 10GB; daily video streaming or hotspotting on cellular pushes past 50GB. BitLink's Student 5G (50GB) fits most students and heavy users; Basic (1GB) is for light or secondary lines.",
      },
      {
        question: "Is 50GB enough for a year in Israel?",
        answer:
          "50GB per month is enough for the large majority of students and workers — a real student line on our network used about 9GB in a typical month with dorm WiFi handling video. The main people who outgrow 50GB are daily video-streamers on cellular and laptop-hotspotters, which is what Max 5G's 120GB is for.",
      },
      {
        question: "What happens if I go over my data limit on BitLink?",
        answer:
          "Nothing scary: data pauses until you top up or the month resets — calls and texts keep working, and there is no overage billing at all. We email you at 80% used and again near the limit with your reset date. Topups (+5GB $5.99 to +50GB $34.99) are self-serve in the account portal and live within minutes.",
      },
      {
        question: "How much data does WhatsApp use?",
        answer:
          "Very little for texts (a rounding error over a month) and about 30MB per hour for voice calls. Video calls are the expensive form — several hundred MB per hour. The quiet consumer is media auto-download: turn it off for cellular in WhatsApp's Storage and Data settings and WhatsApp becomes one of the cheapest apps on your phone.",
      },
      {
        question: "How much data does Waze use in Israel?",
        answer:
          "Navigation is cheap: Google Maps runs roughly 3–5MB per hour and Waze somewhat more (it syncs live traffic constantly) — either way, even daily driving rarely reaches 1GB in a month. Downloading offline maps makes it cheaper still.",
      },
      {
        question: "Do I need unlimited data in Israel?",
        answer:
          "Almost nobody actually uses \"unlimited\" — it's mostly insurance against overage bills, and on BitLink that risk doesn't exist (data pauses at the cap; no overage charges, topups from $5.99). Real usage math says 50GB covers a heavy normal month and 120GB covers hotspot-and-stream lifestyles.",
      },
    ],
    relatedLinks: [
      { href: "/plans", label: "Compare BitLink plans" },
      { href: "/guides/gap-year-israel-phone-plan", label: "The gap year phone guide" },
      { href: "/israeli-phone-plans-for-students", label: "Student phone plans" },
      { href: "/guides/will-my-phone-work-in-israel", label: "Will my phone work in Israel?" },
    ],
  },
  {
    slug: "how-to-call-israel-from-the-us",
    title: "How to call Israel from the US (and home from Israel)",
    metaTitle: "How to Call Israel From the US (+972 Explained)",
    metaDescription:
      "The +972 format with examples, what calling Israel costs from a US phone, and how families avoid international rates entirely.",
    datePublished: "2026-07-24",
    dateModified: "2026-07-24",
    readingTime: "6 min read",
    intro:
      "To call an Israeli number from the US, dial +972, then the Israeli number without its leading 0. So the Israeli mobile 058-123-4567 becomes +972-58-123-4567. That's the whole trick — the leading zero is Israel's internal prefix, and it drops the moment you dial from abroad. This guide covers the format in both directions, what those calls actually cost on US carriers, why most Israel-America families end up on WhatsApp anyway, and the setup that makes the question disappear entirely: a US number that rings in Israel, so your family dials a local call and never touches international dialing at all.",
    sections: [
      {
        heading: "How do I dial an Israeli number from the US?",
        paragraphs: [
          "The format is: +972, then the Israeli number minus its leading 0. Israeli mobile numbers start with 05x (052, 053, 054, 058…), so 058-123-4567 is dialed as +972-58-123-4567. Landlines work the same way with their area codes: a Jerusalem 02 number like 02-538-1234 becomes +972-2-538-1234, Tel Aviv's 03 becomes +972-3, and so on. On any smartphone, hold the 0 key to type the + and dial exactly that — no need for the old 011 exit code, though 011-972 works identically from US landlines.",
          "The one mistake everyone makes once: keeping the 0. +972-058… doesn't connect — drop the zero after the country code. The tidy habit that prevents it forever: save Israeli contacts in full international format (+972-58-123-4567). Saved that way, the number works from every country, and WhatsApp finds it automatically.",
        ],
      },
      {
        heading: "What does it cost to call Israel from a US phone?",
        paragraphs: [
          "On a plain US carrier plan, a dialed call to Israel is international long distance — commonly somewhere between a few cents and a few dollars per minute depending on plan and add-ons, and mobile numbers usually cost more than landlines. US carriers sell international-calling add-ons that bring it down, but it's a recurring fee for something most families can get for free.",
          "In practice, most Israel–US families route around the whole question two ways: WhatsApp (below), or giving the person in Israel a US number — so the American side of the family just dials a normal domestic number and pays nothing extra, ever. That second option is what [BitLink's US number add-on](/us-number-in-israel) does for $9.99/month: a real US number attached to the Israeli line, ringing on the same phone in Israel. Grandparents dial a local call; it rings in Jerusalem.",
        ],
      },
      {
        heading: "Why does everyone just use WhatsApp?",
        paragraphs: [
          "Israel runs on WhatsApp to a degree that surprises new arrivals — it's the default for families, schools, businesses, and every group you'll ever be added to. WhatsApp calls are free over the internet in both directions, sound better than international lines, and do video. For day-to-day family contact, it genuinely is the answer, which is why the practical advice for anyone moving is to [get WhatsApp onto the right number](/guides/whatsapp-israeli-number-switch) rather than to shop for per-minute rates.",
          "Where WhatsApp doesn't cover you: anyone who doesn't use it (plenty of older relatives, and every US business), anything that must be a real phone call — banks, doctors' offices, government lines — and moments with bad internet. That's why the complete setup is WhatsApp for family plus a real dialing path for everything else: either minutes included in your plan, or a US number on the Israeli phone.",
        ],
      },
      {
        heading: "How do I call the US from Israel?",
        paragraphs: [
          "Same logic in reverse: +1, then the ten-digit US number — a New York cell becomes +1-212-555-0123. From a BitLink line, what that costs depends on your plan: [Max 5G](/plans/max-5g) includes 150 minutes of real dialed calling to US and Canadian numbers every month, which covers the banks-doctors-grandparents category for most people, and a [+120-minute US/Canada topup](/account/lines) exists for heavier months. Kosher+ includes the same 150 US/CA minutes on a voice-only line.",
          "Combined with WhatsApp for family, that's usually the whole answer. And if the people you call would rather reach you: the [US number add-on](/us-number-in-israel) works in both directions — they dial a local US number to reach your phone in Israel, and US institutions' verification texts arrive on it too (tested with real Chase and Google codes).",
        ],
      },
      {
        heading: "What's the setup that makes all of this easiest for a family?",
        paragraphs: [
          "For a student, oleh, or anyone whose family is in America, the setup that removes every friction at once: an [Israeli BitLink line](/israel-esim) (Israeli number for local life, live before you land), WhatsApp moved onto it for daily contact, and the $9.99/month US number added so the American side never dials internationally — and US texts still arrive. The old US carrier bill usually just ends.",
          "It also future-proofs the other direction: whoever needs to reach you — a US doctor's office calling back, a bank's fraud department, a relative without WhatsApp — reaches a normal American number that rings in Israel. Nobody on either side ever needs to remember +972.",
        ],
      },
    ],
    faq: [
      {
        question: "How do I call Israel from the United States?",
        answer:
          "Dial +972 followed by the Israeli number without its leading 0: the mobile 058-123-4567 becomes +972-58-123-4567, and a Jerusalem landline 02-538-1234 becomes +972-2-538-1234. On a cell phone, hold 0 to type the +; from a landline, 011-972 works the same way.",
      },
      {
        question: "Why won't my call to Israel connect?",
        answer:
          "Almost always the leading zero: +972-058… fails — the 0 must be dropped after the country code (+972-58…). Save Israeli contacts in full international format (+972-…) once and the problem never comes back, in any country, and WhatsApp picks the contact up automatically.",
      },
      {
        question: "Is it free to call Israel on WhatsApp?",
        answer:
          "Yes — WhatsApp voice and video calls are free over the internet in both directions, and it's the default communication tool inside Israel. The gaps are people and institutions that don't use it (many older relatives, all US businesses and banks), which is what real dialed minutes or a US number on the Israeli phone are for.",
      },
      {
        question: "How can my family call me in Israel without paying international rates?",
        answer:
          "Give them a US number that rings in Israel: BitLink's US/Canada/UK add-on ($9.99/month) attaches a real American number to your Israeli line — family dials a normal local call, your phone rings in Israel, and US verification texts arrive on it too (tested with real Chase and Google codes).",
      },
      {
        question: "How do I call a US number from Israel?",
        answer:
          "Dial +1 and the ten-digit number (+1-212-555-0123). From a BitLink line, Max 5G and Kosher+ include 150 minutes/month of dialed US/Canada calling, a +120-minute topup is available for heavier months, and WhatsApp covers the family calls for free.",
      },
      {
        question: "What do Israeli phone numbers look like?",
        answer:
          "Mobiles are 05x-XXX-XXXX (052, 053, 054, 058 and so on); landlines use area codes like 02 (Jerusalem), 03 (Tel Aviv), 04 (Haifa), 08 (the south) and 09 (Sharon area). In international format they all become +972 with the leading 0 dropped.",
      },
    ],
    relatedLinks: [
      { href: "/us-number-in-israel", label: "US number add-on" },
      { href: "/guides/whatsapp-israeli-number-switch", label: "Moving WhatsApp to your Israeli number" },
      { href: "/guides/israeli-phone-number-before-you-land", label: "Get your number before you land" },
      { href: "/keep-your-number", label: "Port your US number" },
    ],
  },
  {
    slug: "gap-year-israel-phone-plan",
    title: "The gap year phone guide: setting up your phone for a year in Israel",
    metaTitle: "Gap Year in Israel: The Phone Plan Guide",
    metaDescription:
      "Phone setup for a gap year in Israel — yeshiva, seminary, Masa or mechina. Why travel eSIMs fail at month two, and what a full year needs.",
    datePublished: "2026-07-16",
    dateModified: "2026-07-16",
    readingTime: "7 min read",
    intro:
      "A gap year in Israel — yeshiva, seminary, Masa, mechina, an internship, volunteering — is nine to twelve months of actual life, and the phone setup for actual life is different from the phone setup for a vacation. The short version: you need a real Israeli number (not a data-only travel eSIM), on a monthly plan someone's parents can pay in dollars, live before your flight lands. That's about ten minutes of setup from home, from $14.99/month. Here's the whole picture, including the parts people figure out the hard way in October.",
    sections: [
      {
        heading: "Why won't a travel eSIM or airport SIM last the year?",
        paragraphs: [
          "The travel eSIMs everyone uses for a week in Europe — data-only apps you top up by the gigabyte — are the wrong tool for a gap year, and the reason isn't price alone. They give you data but no Israeli phone number, and by week two in Israel the missing number is the problem: the bank won't verify you, [Bit and Pango won't sign you up](/guides/israeli-phone-number-for-banking-bit-pango), delivery apps can't text you, and every SMS verification code in the country has nowhere to go. Israel runs on the 05 mobile number, and \"I have data though\" doesn't answer any form that asks for one.",
          "The other trap is the airport kiosk SIM — it does give you a number, but often one registered to the seller rather than to you, which means [a number you can lose](/guides/airport-sim-trap-israel) just as the bank and half your accounts have learned it. For a year, start with a line that's actually yours.",
        ],
      },
      {
        heading: "What does a gap year actually need from a phone?",
        paragraphs: [
          "Arrival week: the driver, the madrich or program coordinator, and whoever's picking you up all need a number that works from hour one. Then the errands begin — a bank account for stipends or spending money, Kupat Cholim if your program registers you for health coverage, gov.il logins, and the program's WhatsApp groups where all actual information lives.",
          "The everyday middle: Bit for splitting dinner and paying back roommates (it's how everyone under 30 moves money in Israel), Pango or HopOn for parking and buses, Wolt deliveries, Waze on data, video calls home, and being the person in the group who can hotspot when the dorm Wi-Fi dies. This is where data volume gets real — a year of normal use looks like 30–50GB a month, not the 5GB a tourist burns in a week.",
          "None of this is exotic. It's just twelve months of ordinary life, and it all hangs off an Israeli number with a real data plan behind it.",
        ],
      },
      {
        heading: "How do I set up my phone before the flight?",
        paragraphs: [
          "Three steps, about ten minutes, from home:",
        ],
        steps: [
          "Confirm your phone is unlocked and eSIM-compatible (most iPhones from the XS onward, most recent Android flagships). If it's carrier-locked — common on US installment plans — request the unlock now; it can take days. More on this in [do US phones work in Israel](/guides/do-us-phones-work-in-israel).",
          "Pick a plan and check out online. [Student 5G](/plans/student-5g) — $34.99/month for 50GB, 5,000 minutes, 1,000 SMS — fits most gap year students; [Basic](/plans/basic) at $14.99/month covers genuinely light use. No Israeli ID, no passport upload, no Israeli bank account — a regular US, UK, or Canadian card, charged in USD.",
          "Install the eSIM from the QR code that arrives by email, usually within minutes. Your Israeli number is live before the flight — when you land, the phone just connects.",
        ],
      },
      {
        heading: "How do I stay reachable for family back home?",
        paragraphs: [
          "Run dual SIM: your home SIM stays in the phone so the number your family and your bank know keeps receiving texts, and the Israeli line does all the actual work. Turn roaming off on the home line and drop it to the cheapest tier that keeps the number alive — or skip paying a US carrier entirely and [port the number onto your BitLink line](/keep-your-number), or add a [US, Canadian, or UK local number](/us-number-in-israel) for $9.99/month so parents dial a local call and it rings in Israel. Both routes receive US verification texts — real bank codes, tested — so nothing about your American logins breaks. The add-on is live right away; porting takes 3–5 business days, so start it before the flight if that's your plan.",
          "One thing not to do for a gap year: don't move your WhatsApp to the Israeli number. That advice is for aliyah. You're going home in a year — keep WhatsApp on the number you'll still have at 20, and let the Israeli number handle SMS codes and local calls. WhatsApp works fine on Israeli data regardless of which number it's registered to.",
          "For parents: the plan is priced in dollars with VAT included, the card on file can be yours, and support answers in English on WhatsApp — so billing questions never route through a teenager's dorm hallway.",
        ],
      },
      {
        heading: "What if I picked the wrong plan — or travel mid-year?",
        paragraphs: [
          "Plans are monthly with no contract, so getting it wrong isn't expensive — a Basic signup who turns out to stream everything can move up to Student 5G the next month, no penalty.",
          "Arriving with friends or roommates? BitLink's referral program adds 5GB of bonus data per month to your plan for each active referral, up to 25GB. A dorm room that signs up through each other's links quietly raises everyone's data cap for the year at no cost.",
          "Traveling outside Israel mid-year — a Europe hop during a break — works the usual way: grab a cheap data eSIM for that country for the week, and your Israeli line stays live for SMS codes back home in Israel. (That's the situation travel eSIMs are actually for.)",
        ],
      },
      {
        heading: "What happens to my number when the year ends — or turns into shana bet?",
        paragraphs: [
          "Going home: plans are monthly, so you cancel whenever you leave. Nothing about the setup assumes you'll stay.",
          "Coming back — shana bet, a second Masa program, university in Israel, or the aliyah you didn't plan on: keep the number instead of losing it. A BitLink line can be [paused for $10/month](/israel-sim-for-tourists) and held for up to 18 months, so the number your Israeli bank, Bit, and everyone from your program already know is still yours when you land again. Rebuilding a lost number's registrations the second time around is exactly as annoying as it sounds.",
          "And if you ever want to move the number to another Israeli carrier, it's yours to take — BitLink leaves porting out open on every line, no fees and no blocks.",
        ],
      },
    ],
    faq: [
      {
        question: "What's the best phone plan for a gap year in Israel?",
        answer:
          "A monthly Israeli plan with a real Israeli number, sized for daily life rather than a visit. Student 5G ($34.99/month — 50GB of 5G data, 5,000 minutes, 1,000 SMS) fits most gap year students; light users can start at $14.99/month and switch later, since plans are monthly with no contract. Set it up by eSIM before flying so the number is live on landing.",
      },
      {
        question: "Can't I just use a travel eSIM like Airalo for the year?",
        answer:
          "Not well. Travel eSIMs are data-only — no Israeli phone number — so banks, Bit, Pango, Kupat Cholim, gov.il, and delivery apps can't verify you, and per-GB pricing that's fine for a week gets expensive over ten months. They're the right tool for a short trip abroad during your year, not for the year itself.",
      },
      {
        question: "Do I actually need an Israeli number on a gap year program?",
        answer:
          "Yes. Program group chats, SMS verification codes, the bank, health coverage registration, parking and bus apps, and deliveries all expect an Israeli 05 mobile number. Data alone doesn't answer a verification form. This is usually the first thing students discover in the opening two weeks.",
      },
      {
        question: "Should I switch my WhatsApp to the Israeli number?",
        answer:
          "For a gap year, usually no — keep WhatsApp on your home number, since you'll still have it after the year ends, and WhatsApp runs fine on Israeli data either way. Switching WhatsApp numbers is advice for people moving permanently. Use the Israeli number for SMS codes, local calls, and everything Israeli systems ask for.",
      },
      {
        question: "Can my parents pay for the plan from the US?",
        answer:
          "Yes — checkout is online, priced in US dollars with VAT included, and takes a regular US, UK, or Canadian card with no Israeli ID or bank account. Many families keep the card and the account in a parent's hands while the line runs on the student's phone in Israel, and support answers parents directly in English.",
      },
      {
        question: "What happens to my number if I come back for shana bet?",
        answer:
          "Pause the line for $10/month instead of cancelling — the number, SIM, and all its registrations are held for up to 18 months. When you're back, resume and everything works, with no new-number errands at the bank or on Bit. If you're not coming back, cancel anytime; plans are monthly.",
      },
    ],
    relatedLinks: [
      { href: "/israeli-phone-plans-for-students", label: "Student phone plans" },
      { href: "/guides/yeshiva-seminary-phone-checklist", label: "Yeshiva & seminary phone checklist" },
      { href: "/guides/israeli-phone-number-before-you-land", label: "Get your number before you land" },
      { href: "/guides/do-us-phones-work-in-israel", label: "Do US phones work in Israel?" },
          { href: "/guides/how-much-data-do-i-need-in-israel", label: "How much data do you actually need?" },
          { href: "/guides/travel-esim-or-phone-plan-israel", label: "Travel eSIM or phone plan?" },
    ],
  },
  {
    slug: "gap-year-israel-checklist",
    title: "The gap year in Israel checklist: getting your kid ready",
    metaTitle: "Gap Year in Israel Checklist for Parents",
    metaDescription:
      "A parent's step-by-step checklist for a gap year in Israel: passport and documents, health and meds, money, phone setup, packing, and a week-by-week countdown.",
    datePublished: "2026-07-25",
    dateModified: "2026-07-25",
    readingTime: "8 min read",
    intro:
      "Sending a child to Israel for a gap year is a hundred small logistics wrapped around one big leap. The good news: almost all of it is a checklist, and most of it is calmer than it feels in the weeks before the flight. This guide walks parents through the whole timeline — documents, health, money, phone, and packing — in the order things actually need to happen, so nothing important gets left to the airport.",
    sections: [
      {
        heading: "When should we start getting ready?",
        paragraphs: [
          "Start with the things that have lead times — passport, flights, insurance, and any program paperwork — a few months out. Leave the fast stuff — phone, packing, last-minute cash — for the final week or two. A rough rule: anything a government or an airline controls, do early; anything you control, do late.",
          "The single most common mistake is treating the phone and the money setup as airport tasks. Those are the two things you most want working the moment the plane lands, and both are far easier to arrange calmly from home. We'll come back to each.",
        ],
      },
      {
        heading: "What documents does my child need?",
        paragraphs: [
          "A passport valid for at least six months beyond the travel dates is the non-negotiable one — renew now if it's close, because renewals take time. Make two copies of the photo page: one that stays with you, one packed separately from the passport itself.",
          "Entry and any student visa are usually handled through the gap-year program — confirm exactly what they arrange and what you're responsible for, and don't assume. Bring the program's acceptance letter and contact details in printed form. Travel insurance documents and any health paperwork round out the folder; keep digital copies somewhere both you and your child can reach.",
        ],
      },
      {
        heading: "How should we handle money and banking?",
        paragraphs: [
          "Most gap-year students do not open an Israeli bank account — they run the year on a parent's card plus cash, which is simpler and avoids a lot of paperwork. Tell your home bank and card issuer the travel dates so nothing gets frozen as fraud, and check the card's foreign-transaction fee before relying on it for everything.",
          "There's one catch worth knowing early: a lot of Israeli daily life — Bit for splitting a bill with friends, parking apps, verification texts — expects an Israeli mobile number, and Bit itself generally needs Israeli banking many students won't have. The [full breakdown of phone, banking, and money is here](/guides/gap-year-israel-phone-banking-money) — it's the part parents most often underestimate.",
        ],
      },
      {
        heading: "What about a phone and staying reachable?",
        paragraphs: [
          "This is the one to get right before the flight, not at Ben Gurion. Israeli life runs through an 05 mobile number — the program's group chats, SMS codes, the bank, deliveries — so your child needs a real Israeli number, and the calm way to get one is an eSIM set up at home before departure. With [BitLink](/plans), an eSIM phone can be activated online in about ten minutes — no Israeli ID, paid on your US, UK, or Canadian card in dollars — and it's live the moment they land. Student 5G is $34.99/month for 50GB, which is plenty for maps, group chats, and video calls home.",
          "Have them keep their home number too, on the same phone. Don't switch their WhatsApp to the Israeli number for a single year — they'll still have the home number when they're back, and WhatsApp works fine over Israeli data either way. The home number also keeps US bank verification texts arriving. And if the year turns into shana bet, or they come home mid-year, the Israeli line can be [paused for $10/month](/plans) to hold the number instead of losing it. Full setup steps are in [get an Israeli number before you land](/guides/israeli-phone-number-before-you-land).",
        ],
      },
      {
        heading: "What should they pack — and not pack?",
        paragraphs: [
          "The honest answer is less than you think; Israel has stores. Bring what's genuinely hard to replace — specific medications, program dress-code items, good walking shoes — and buy the bulky, cheap, replaceable things there. The [full bring-versus-buy packing list is here](/guides/gap-year-israel-packing-list), including the voltage and adapter details that trip people up.",
        ],
      },
      {
        heading: "What about health, medications, and insurance?",
        paragraphs: [
          "Travel or gap-year health insurance is essential — confirm what the program includes and fill the gaps. For any prescription medication, send enough supply to last until a realistic refill, packed in original labeled containers with a doctor's note listing the generic names. Pack a small kit of the over-the-counter basics your child actually uses, since brand names differ in Israel.",
          "Save the emergency numbers in their phone before they go — in Israel it's 101 for ambulance (Magen David Adom), 100 for police, and 102 for fire — alongside the program's staff contacts and the insurer's help line.",
        ],
      },
      {
        heading: "How will we stay in touch once they're there?",
        paragraphs: [
          "Israel is about seven hours ahead of US Eastern time, so the easiest rhythm is a standing weekly video call plus WhatsApp for the day-to-day. On a 50GB plan, video calls and photos are no problem. Agree before they leave on how often you'll actually talk — it heads off both the daily-panic and the two-weeks-of-silence patterns.",
          "Their [first two weeks](/guides/gap-year-israel-first-two-weeks) are the adjustment window — jet lag, a new city, a new routine — so expect a wobble and don't read it as a crisis.",
        ],
      },
      {
        heading: "What's the week-by-week countdown?",
        paragraphs: [
          "If you do these in order, nothing important lands on the last day:",
        ],
        steps: [
          "2–3 months out: check passport validity and renew if needed; book flights; sort travel and health insurance; confirm with the program what visa or entry paperwork they handle.",
          "1 month out: tell your bank and card issuer the travel dates; refill prescriptions with enough supply; make document copies; start the packing list.",
          "1–2 weeks out: set up the Israeli eSIM at home so it's ready to switch on; confirm the home number stays active for WhatsApp and bank texts; test that the card works abroad and that two-factor codes arrive.",
          "Final days: pack, leaving room for what they'll buy there; load emergency numbers and program contacts into their phone; put a little starting cash and a card in easy reach for landing day.",
          "Landing day: switch on the Israeli eSIM, message home, withdraw shekels from an ATM, and head to the program — skip the airport SIM kiosk.",
        ],
      },
    ],
    faq: [
      {
        question: "How far ahead should we start planning a gap year in Israel?",
        answer:
          "Start the slow, official items — passport, flights, insurance, program paperwork — two to three months out, and leave the fast items — phone, packing, cash — for the final week or two. The rule of thumb: anything a government or airline controls, do early.",
      },
      {
        question: "Does my child need a visa for a gap year in Israel?",
        answer:
          "Entry and any student visa are almost always arranged through the program, so confirm exactly what they handle and what you're responsible for. Make sure the passport is valid at least six months beyond the travel dates.",
      },
      {
        question: "Do gap-year students need an Israeli bank account?",
        answer:
          "Usually no. Most run the year on a parent's card plus cash. They do need an Israeli phone number for local apps and verification codes, which is a separate thing from banking.",
      },
      {
        question: "Can I pay for the Israeli phone plan from the US?",
        answer:
          "Yes. Checkout is online in US dollars with a regular US, UK, or Canadian card — no Israeli ID or bank account — and support answers parents in English. Many families keep the account in a parent's hands while the line runs on the student's phone.",
      },
      {
        question: "What if my child comes home for a break or shana bet?",
        answer:
          "Pause the Israeli line for $10/month to hold the number, SIM, and its registrations for up to 18 months, then resume when they're back — no new-number errands at the bank or on local apps. If they're not returning, cancel anytime; plans are monthly.",
      },
      {
        question: "What are the emergency numbers in Israel?",
        answer:
          "101 for ambulance (Magen David Adom), 100 for police, and 102 for fire. Save them in your child's phone before departure, along with the program's staff contacts.",
      },
    ],
    relatedLinks: [
      { href: "/guides/gap-year-israel-packing-list", label: "The honest packing list" },
      { href: "/guides/gap-year-israel-phone-banking-money", label: "Phone, banking & money before they land" },
      { href: "/guides/gap-year-israel-first-two-weeks", label: "Their first two weeks in Israel" },
      { href: "/israeli-phone-plans-for-students", label: "Student phone plans" },
          { href: "/guides/sick-in-israel-gap-year", label: "What if they get sick in Israel?" },
    ],
  },
  {
    slug: "gap-year-israel-packing-list",
    title: "The honest packing list for a gap year in Israel",
    metaTitle: "Gap Year in Israel Packing List (Bring vs Buy)",
    metaDescription:
      "An honest bring-versus-buy packing list for a gap year in Israel: what earns its luggage weight, what to buy there, and what students forget.",
    datePublished: "2026-07-25",
    dateModified: "2026-07-25",
    readingTime: "6 min read",
    intro:
      "The biggest packing mistake for a year in Israel is bringing too much. Israel has pharmacies, clothing stores, and everything a teenager forgets — so the goal isn't to pack for every scenario, it's to bring what's genuinely hard to replace and buy the rest there. Here's an honest bring-versus-buy list, the weather reality, the adapter details, and the things students always forget.",
    sections: [
      {
        heading: "What's the one rule of packing for Israel?",
        paragraphs: [
          "Pack light on the replaceable, heavy on the irreplaceable. Every kilo of shampoo and cheap t-shirts is a kilo you could have used for the stuff that's actually hard to get — or left as room for what they'll buy there. A year of life in Israel accumulates fast, and the bags are always fuller going home.",
          "Weigh the bags at home against the airline's exact limit with a luggage scale; going over at the check-in counter is expensive and stressful. Leaving a bag half-empty is a gift to your future self.",
        ],
      },
      {
        heading: "What should they definitely bring from home?",
        paragraphs: [
          "The irreplaceables: a full supply of any prescription medication in original labeled containers with a doctor's note; the specific clothing a program's dress code requires — modest skirts and tops, white shirts, Shabbat clothes — which is easier to get exactly right at home; good, broken-in walking shoes, because they'll walk far more than they do now; and the over-the-counter medicines they actually reach for, since brands differ.",
          "Also bring chargers and a power bank, a couple of plug adapters, copies of documents kept separate from the originals, and a small number of comfort items. Everything on this short list earns its luggage weight.",
        ],
      },
      {
        heading: "What should they buy in Israel instead?",
        paragraphs: [
          "Toiletries, shampoo, and basics are cheap and on every corner — not worth the weight. Everyday and casual clothes are inexpensive in Israeli stores and more fun to shop for there, so bring a starter set and buy the rest. Bedding and towels are bulky; many programs provide them or you buy locally, so check before packing sheets.",
        ],
      },
      {
        heading: "What about electronics, chargers, and adapters?",
        paragraphs: [
          "Israel runs on 230-volt Type H sockets (the round Type C plug also fits). The important distinction: phone and laptop chargers are almost always dual-voltage — they say 100–240V on the brick — so they need only a cheap plug adapter. Single-voltage US appliances, like many hair dryers and straighteners, need a bulky voltage converter and often burn out anyway, so buy an Israeli one there.",
          "Bring the phone itself set up and ready: an unlocked, eSIM-capable phone with an [Israeli eSIM installed before the flight](/guides/israeli-phone-number-before-you-land) means they land connected instead of hunting for a SIM at the airport. Not sure the phone qualifies? [Check whether it will work in Israel](/guides/will-my-phone-work-in-israel) before you fly. Pack a couple of adapters and a power bank for long travel and tiyul days.",
        ],
        table: {
          columns: ["Item", "Plan", "Why"],
          rows: [
            { cells: ["Prescription medication", "Bring full supply", "Brands differ; refills take time to arrange"] },
            { cells: ["Toiletries & shampoo", "Buy there", "Cheap and everywhere — don't waste luggage weight"] },
            { cells: ["Program dress-code clothing", "Bring", "Specific requirements are easier to nail from home"] },
            { cells: ["Everyday & casual clothes", "Bring a little, buy the rest", "Israeli stores are inexpensive; leave suitcase room"] },
            { cells: ["Good walking shoes", "Bring", "You'll walk far more than at home; break them in first"] },
            { cells: ["Bedding & towels", "Buy there (check with program)", "Bulky; many programs provide them"] },
            { cells: ["Phone charger & power bank", "Bring", "Dual-voltage — just add a plug adapter"] },
            { cells: ["Hair dryer / straightener", "Buy there", "US single-voltage models need a converter — not worth it"] },
            { cells: ["Unlocked phone + Israeli eSIM", "Set up at home", "Land already connected — skip the airport SIM kiosk"], highlight: true },
            { cells: ["Type H/C plug adapters", "Bring a couple", "Israel is 230V; grab them before you fly"] },
          ],
          note:
            "Israel uses 230V Type H sockets (Type C plugs also fit). Phone and laptop chargers are dual-voltage and need only a plug adapter; single-voltage US appliances need a converter, usually cheaper to just buy locally.",
        },
      },
      {
        heading: "What clothes should they pack for the weather?",
        paragraphs: [
          "Israeli summers are hot and dry, and winters are cooler and rainy — Jerusalem in particular gets genuinely cold and wet from December to February, which surprises people who picture Israel as always warm. A real coat and a rain layer matter. Layers beat bulk. Include Shabbat clothing and, for most yeshiva and seminary programs, modest dress that meets the program's guidelines — all of which you can also top up in Israeli stores.",
        ],
      },
      {
        heading: "What do students always forget?",
        paragraphs: [
          "The recurring gaps: a reusable water bottle (they'll drink a lot in the heat, and tap water is safe), a small personal first-aid kit, a power bank, printed copies of documents kept apart from the originals, and a small day bag for trips. None are dramatic; all are annoying to be without in the first week.",
        ],
      },
      {
        heading: "How do we not blow the baggage allowance?",
        paragraphs: [
          "Check the airline's exact weight and bag limits and weigh everything at home. Pack to land, not to hoard — a year's worth of things accumulates in Israel, so leave room. Shipping a box from home is usually slow and expensive versus buying there; reserve it for genuine irreplaceables that won't fit in the luggage.",
        ],
      },
    ],
    faq: [
      {
        question: "Do I need a voltage converter for Israel?",
        answer:
          "For phone and laptop chargers, no — they're dual-voltage and need only a Type H/C plug adapter. Single-voltage US appliances like some hair dryers need a converter, so it's usually easier and cheaper to buy those in Israel.",
      },
      {
        question: "Can you buy modest or Shabbat clothing in Israel?",
        answer:
          "Yes, easily, and often at good prices. Bring a starter set that meets your program's dress code and buy more once you're there.",
      },
      {
        question: "How many suitcases should a gap-year student bring?",
        answer:
          "Most manage with the airline's standard checked allowance plus a carry-on. Leave room — the bags will be fuller on the way home.",
      },
      {
        question: "Should we ship a box to Israel?",
        answer:
          "Usually not worth it. Shipping is slow and pricey, and most things are available locally. Reserve it for irreplaceables that don't fit in the luggage.",
      },
      {
        question: "Is the tap water safe to drink in Israel?",
        answer:
          "Yes, tap water is safe throughout Israel. A reusable bottle saves money and plastic in the heat.",
      },
    ],
    relatedLinks: [
      { href: "/guides/gap-year-israel-checklist", label: "The full gap year checklist" },
      { href: "/guides/gap-year-israel-phone-banking-money", label: "Phone, banking & money before they land" },
      { href: "/guides/gap-year-israel-first-two-weeks", label: "Their first two weeks in Israel" },
      { href: "/israeli-phone-plans-for-students", label: "Student phone plans" },
    ],
  },
  {
    slug: "gap-year-israel-phone-banking-money",
    title: "Before they land: phone, banking, and money for a gap year in Israel",
    metaTitle: "Gap Year in Israel: Phone, Banking & Money Setup",
    metaDescription:
      "Setting up a phone and money for a gap year in Israel: eSIM before landing, keeping US bank texts, Bit and Pango, and what to test before the flight.",
    datePublished: "2026-07-25",
    dateModified: "2026-07-25",
    readingTime: "7 min read",
    intro:
      "Two things are worth setting up before your child's flight rather than after they land: their phone and their money. Both are calmer to arrange from home, and both are things you want working the moment the plane touches down. Here's the honest version — what an Israeli number is for, why the home number stays, and how gap-year students actually pay for a year in Israel.",
    sections: [
      {
        heading: "What's the phone problem to solve before the flight?",
        paragraphs: [
          "Israeli daily life assumes an 05 mobile number: the program's WhatsApp groups, SMS verification codes, deliveries, appointment reminders, and local sign-ups all expect one. A home US number alone won't fill in those forms. So the goal before the flight is simple — a real Israeli number, ready to switch on at landing, without a scramble at the airport.",
        ],
      },
      {
        heading: "How does the Israeli phone get set up before landing?",
        paragraphs: [
          "If the phone is an unlocked, eSIM-capable model — most recent iPhones and many Android phones are — you can set the whole thing up from your couch. With [BitLink](/plans) you pick a plan, pay online with a US, UK, or Canadian card in dollars (no Israeli ID or bank account), and install the eSIM by scanning a QR code, all before the flight. [Student 5G](/israeli-phone-plans-for-students) is $34.99/month for 50GB — enough for maps, group chats, and daily video calls home. The full walkthrough is in [get an Israeli number before you land](/guides/israeli-phone-number-before-you-land).",
          "If the phone isn't eSIM-capable, or is locked to a US carrier, that's the one thing worth sorting at home — [check whether the phone will work in Israel](/guides/will-my-phone-work-in-israel) before you rely on this plan.",
        ],
      },
      {
        heading: "Should they keep their home number too?",
        paragraphs: [
          "Yes — keep it, on the same phone. A modern phone runs the Israeli line and the home number side by side, so they don't have to choose. The home number matters for two reasons: it keeps US bank and account verification texts arriving, and it keeps WhatsApp on the number friends and family already have.",
          "Don't switch their WhatsApp to the Israeli number for a single year. They'll still have the home number when they're back, WhatsApp runs fine over Israeli data, and switching just creates a mess to undo. If the exact home number needs to stay reachable by call and text in Israel, it can be [ported or added as a local number](/us-number-in-israel) — BitLink's US numbers do receive bank and verification texts, tested with real Chase and Google codes.",
        ],
        table: {
          columns: ["What it's for", "Home number", "Israeli number"],
          rows: [
            { cells: ["US bank & 2FA texts", "Keep it here", "—"] },
            { cells: ["WhatsApp with family & friends", "Keep it here (don't switch)", "—"] },
            { cells: ["Program group chats & Israeli SMS codes", "—", "Yes"] },
            { cells: ["Israeli deliveries, sign-ups, appointments", "—", "Yes"] },
            { cells: ["Mobile data, maps, calls home", "—", "Yes (50GB on Student 5G)"] },
          ],
          note:
            "A modern phone runs both at once, so a gap-year student keeps the home number for banks and WhatsApp while the Israeli number handles everything local.",
        },
      },
      {
        heading: "How will they actually pay for things day to day?",
        paragraphs: [
          "Most gap-year students run the year on a parent's card plus cash — no Israeli bank account required. Tell your bank and card issuer the travel dates so purchases in Israel don't trip a fraud freeze, and check the card's foreign-transaction fee, since 1–3% on everything adds up. A card with no foreign fee is worth setting up before they go.",
          "Israel is more card-friendly than it used to be, but cash still matters for small vendors, tips, and some buses. Have them withdraw shekels from an ATM on arrival rather than exchanging cash at the airport, where the rates are poor.",
        ],
      },
      {
        heading: "What are Bit and Pango, and do they need an Israeli number?",
        paragraphs: [
          "Bit is Israel's version of Venmo — how friends split a felafel or a taxi — and it's everywhere among Israeli students. It needs both an Israeli phone number and an Israeli bank account or card, so gap-year students without local banking often can't use it fully; the Israeli number is the prerequisite either way. Pango, the parking app, matters mostly if they'll drive, which most won't. The [deeper guide on Israeli numbers for Bit, Pango, and banking is here](/guides/israeli-phone-number-for-banking-bit-pango).",
        ],
      },
      {
        heading: "How do parents send money to a student in Israel?",
        paragraphs: [
          "The simplest setup is to keep your child on a parental card and top up cash as needed — no transfers, no Israeli account. When you do need to move a larger sum, a low-fee transfer service usually beats a wire and beats opening an Israeli bank account for a one-year stay. Only open Israeli banking if the program specifically requires it.",
        ],
      },
      {
        heading: "What should be tested before the flight?",
        paragraphs: [
          "While the home SIM still works and you're all in the same place, run four checks: the Israeli eSIM installs and shows a number; WhatsApp works on the home number; a bank or two-factor text actually arrives at the home number; and the card makes a real purchase without being blocked. Catching any of these at home is a five-minute fix; catching them from Israel is a 3-a.m.-phone-call problem.",
        ],
      },
    ],
    faq: [
      {
        question: "Does a gap-year student need an Israeli bank account?",
        answer:
          "Usually not. Most run the year on a parent's card and cash. An Israeli phone number, which is separate from banking, is the thing they do need for local apps and verification codes.",
      },
      {
        question: "Will US bank verification texts still arrive in Israel?",
        answer:
          "Yes, if the home number stays active on the phone. BitLink's US numbers — ported in or added for $9.99/month — also receive them, tested with real Chase and Google codes, though it's smart to test your most important logins before the flight.",
      },
      {
        question: "Can a gap-year student use Bit?",
        answer:
          "Bit needs an Israeli phone number and an Israeli bank account or card, so students without local banking often can't use it fully. The Israeli number is still needed for many other apps and verification codes.",
      },
      {
        question: "How much cash should they land with?",
        answer:
          "A modest amount for the first day or two. Withdraw shekels from an ATM on arrival rather than exchanging at the airport, where rates are poor. Most spending goes on a card.",
      },
      {
        question: "Can parents pay for and manage the phone plan?",
        answer:
          "Yes. Checkout and billing are in US dollars on a US, UK, or Canadian card with no Israeli ID, and many families keep the account in the parent's hands while the line runs on the student's phone in Israel.",
      },
    ],
    relatedLinks: [
      { href: "/guides/israeli-phone-number-for-banking-bit-pango", label: "Israeli numbers for Bit, Pango & banking" },
      { href: "/us-number-in-israel", label: "Keep a US number in Israel" },
      { href: "/guides/gap-year-israel-checklist", label: "The full gap year checklist" },
      { href: "/israeli-phone-plans-for-students", label: "Student phone plans" },
    ],
  },
  {
    slug: "gap-year-israel-first-two-weeks",
    title: "Their first two weeks in Israel: a gap year survival guide",
    metaTitle: "Gap Year in Israel: The First Two Weeks",
    metaDescription:
      "A survival guide for a gap-year student's first two weeks in Israel: the airport, getting around, the apps, Shabbat and emergency numbers.",
    datePublished: "2026-07-25",
    dateModified: "2026-07-25",
    readingTime: "7 min read",
    intro:
      "The first two weeks are the wobble — jet lag, a new city, a new routine, and the reality that not everything is like home. It passes. This is the practical survival guide for a gap-year student's first days in Israel: what to do at the airport, how to get around, which apps to download, who to call if something goes wrong, and how to stay reachable to home.",
    sections: [
      {
        heading: "What should they do the moment they land?",
        paragraphs: [
          "The moment the eSIM connects: switch on the Israeli line, message home that they landed, and check the program's group chat for arrival instructions. Then withdraw shekels from an ATM in the arrivals hall, find the program's pickup or transport, and — if the eSIM is already set up — walk straight past the SIM kiosk.",
        ],
      },
      {
        heading: "How do they get connected at the airport?",
        paragraphs: [
          "If the Israeli eSIM was [set up before the flight](/guides/israeli-phone-number-before-you-land), there's nothing to do but toggle it on — they're connected before passport control. If it wasn't, resist the airport SIM counter: those kiosk SIMs are often registered to the vendor rather than the buyer, which makes the number hard to keep and hard to port later. [The airport SIM trap](/guides/airport-sim-trap-israel) explains exactly how students lose the number their bank and friends come to know.",
        ],
      },
      {
        heading: "How do they get around Israel?",
        paragraphs: [
          "Public transport is cheap and everywhere. Buses and light rail use the Rav-Kav card or contactless payment, and the Moovit app maps almost any trip door to door in English. Intercity trains connect the big cities, and shared taxis (sherut) and Gett — Israel's Uber — fill the gaps. Nobody needs to rent a car for a gap year; it's an expense and a hassle, and parking is its own sport.",
        ],
      },
      {
        heading: "Which apps should they download first?",
        paragraphs: [
          "The starter set: Moovit for transit, Gett for taxis, Google Maps or Waze for directions, and the program's WhatsApp group. Wolt handles food delivery in most cities. Several of these send an SMS code to set up — another reason the Israeli number needs to be working on day one.",
        ],
      },
      {
        heading: "How do they stay reachable to home?",
        paragraphs: [
          "Israel is about seven hours ahead of US Eastern time, so late morning in Israel is early morning back east — a natural window for calls. On a 50GB plan, WhatsApp voice and video calls are no problem, so agree on a standing weekly call and let the rest be day-to-day messages. A quick “landed / at the program / first Shabbat was good” cadence keeps everyone calm without hovering.",
        ],
      },
      {
        heading: "What about jet lag, food, water, and Shabbat?",
        paragraphs: [
          "Jet lag eases fastest by getting onto Israeli time immediately — daylight, movement, and pushing through the first afternoon. Tap water is safe to drink everywhere, and a refillable bottle is a heat-season essential. Food is overwhelmingly kosher, so that's rarely a worry. The big rhythm change is Shabbat: from Friday afternoon to Saturday night most stores close and public transport largely stops, so students learn to shop and charge devices by Friday midday. The first Shabbat away from home is often the moment it all feels real — expected, and it passes.",
        ],
      },
      {
        heading: "Who do they call in an emergency?",
        paragraphs: [
          "Save these before anything goes wrong, and add the program's staff numbers and the travel insurer's help line beside them. Most first-week “emergencies” are small — a lost card, a missed bus, a cold — but knowing the three numbers and the program contact turns a scare into a phone call.",
        ],
        table: {
          columns: ["Emergency", "Number"],
          rows: [
            { cells: ["Ambulance (Magen David Adom)", "101"] },
            { cells: ["Police", "100"] },
            { cells: ["Fire", "102"] },
          ],
          note: "Save these in the phone before landing, along with the program's staff contacts and your travel insurer's line.",
        },
      },
      {
        heading: "What's the first-two-weeks checklist?",
        paragraphs: [
          "A simple sequence to get settled:",
        ],
        steps: [
          "Landing day: switch on the Israeli eSIM, message home, withdraw shekels, and meet the program transport.",
          "Day 1–2: download Moovit, Gett, and the program group chat; set up a Rav-Kav or contactless transit payment; save the emergency numbers.",
          "First week: test the card on a real purchase; confirm bank 2FA still reaches the home number; find the nearest supermarket, pharmacy, and ATM.",
          "Before the first Shabbat: shop and charge devices by Friday midday; learn the local Shabbat start time and what closes.",
          "End of week two: settle a weekly call time with home — you're through the wobble.",
        ],
      },
    ],
    faq: [
      {
        question: "Should they buy a SIM at the airport in Israel?",
        answer:
          "Better not to. Set up an eSIM before the flight instead — airport kiosk SIMs are often registered to the vendor, which makes the number hard to keep or port later.",
      },
      {
        question: "How do gap-year students get around Israel?",
        answer:
          "Mostly buses, light rail, and trains using a Rav-Kav card or contactless payment, navigated with the Moovit app, plus Gett for taxis. A rental car isn't needed for a gap year.",
      },
      {
        question: "What's the time difference between Israel and the US?",
        answer:
          "Israel is about seven hours ahead of US Eastern time. Late morning in Israel is early morning on the US East Coast — a good window for a call home.",
      },
      {
        question: "Is the tap water safe in Israel?",
        answer:
          "Yes, tap water is safe throughout Israel. A reusable bottle is worth packing for the heat.",
      },
      {
        question: "What happens on Shabbat?",
        answer:
          "From Friday afternoon to Saturday night, most shops close and public transport largely stops. Students quickly learn to shop, charge devices, and plan by Friday midday.",
      },
      {
        question: "Will a student's data plan be enough?",
        answer:
          "50GB on Student 5G covers maps, group chats, and daily video calls home comfortably. If a heavy month runs close, data can be topped up from the account at any time.",
      },
    ],
    relatedLinks: [
      { href: "/guides/airport-sim-trap-israel", label: "The airport SIM trap" },
      { href: "/guides/gap-year-israel-phone-banking-money", label: "Phone, banking & money before they land" },
      { href: "/guides/gap-year-israel-checklist", label: "The full gap year checklist" },
      { href: "/israeli-phone-plans-for-students", label: "Student phone plans" },
          { href: "/guides/how-to-call-israel-from-the-us", label: "Calling home from Israel" },
      { href: "/guides/sick-in-israel-gap-year", label: "If they get sick in Israel" },
    ],
  },
  {
    slug: "is-my-israeli-number-kosher",
    title: "How do I know if my Israeli number is kosher?",
    metaTitle: "Is My Israeli Number Kosher? Prefix List & How to Check",
    metaDescription:
      "How to tell if an Israeli number is kosher, the carrier prefixes to check, and how kosher-to-kosher porting actually works.",
    datePublished: "2026-07-29",
    dateModified: "2026-07-29",
    readingTime: "6 min read",
    intro:
      "The quickest way to tell if an Israeli number is kosher is its prefix — kosher lines are provisioned on specific number ranges assigned to each carrier, so the digits after the area code are a real, checkable clue. But a prefix is a clue, not a certificate: kosher status is something the carrier provisions on the line itself, not something a number carries automatically just by falling in a range. Here's how to actually check, the prefixes by carrier, and what we've learned firsthand about moving a kosher number between carriers.",
    sections: [
      {
        heading: "What actually makes a number kosher?",
        paragraphs: [
          "A kosher number isn't a special category of digits — it's a regular Israeli mobile number that a carrier has provisioned as a kosher line: data and SMS excluded at the network level, recognized under the standards set by Vaadat Harabanim L'inyanei Tikshoret (the Rabbinical Committee for Communications). The prefix is simply a byproduct of how carriers allocate blocks of numbers to their kosher lines, which makes it a genuinely useful visual clue — but the real answer lives in the carrier's own records, not in the digits alone.",
          "That distinction matters most when a number changes hands. A kosher-range prefix on a number that's since been reassigned to a regular line won't behave as kosher, and — as we found out directly while testing a kosher port-in ourselves — a number that was never provisioned as kosher at its original carrier generally can't simply become kosher by porting it somewhere else. More on that below.",
        ],
      },
      {
        heading: "What are the kosher number prefixes by carrier?",
        paragraphs: [
          "These are the prefix ranges the major Israeli carriers use for kosher lines. The \"X\" is a wildcard digit — for example, 058-32X-XXXX covers every number from 058-320-XXXX through 058-329-XXXX.",
        ],
        table: {
          columns: ["Carrier", "Kosher prefix range"],
          rows: [
            { cells: ["Golan Telecom", "058-32X-XXXX"] },
            { cells: ["Pelephone", "050-41X-XXXX"] },
            { cells: ["Cellcom", "052-71X-XXXX and 052-76X-XXXX"] },
            { cells: ["Hot Mobile", "053-31X-XXXX, 053-41X-XXXX, and 053-51X-XXXX"] },
            { cells: ["Partner", "054-84X-XXXX and 054-85X-XXXX"] },
          ],
          note: "If your number matches one of these ranges, it's very likely a kosher line on that carrier.",
        },
      },
      {
        heading: "What about the smaller resellers on the 055 prefix?",
        paragraphs: [
          "A handful of smaller Israeli resellers (Rami Levy, Free Telecom, and others) also offer kosher lines, generally out of the shared 055 prefix block. If you're wondering what 055 means in the first place, or how it differs from 050, 052, 053, 054 and 058, [the full breakdown of Israeli mobile prefixes](/guides/israeli-phone-number-area-codes) explains which carrier each one traces back to. We're intentionally not publishing exact sub-ranges for the smaller providers here: 055 is a large block shared by many small MVNOs, sub-range assignments shift more often than the big five carriers above, and we found at least one public source with an internal inconsistency in its own numbers for a smaller reseller. If your number starts with 055 and isn't clearly explained by the table above, the reliable move is to ask that specific carrier directly rather than trust a prefix list — this is exactly the kind of detail worth getting from the source, not a table on the internet.",
        ],
      },
      {
        heading: "What happens if a kosher SIM ends up in a regular phone?",
        paragraphs: [
          "It locks. A kosher SIM card placed in a non-kosher (regular smartphone) will lock itself, and getting service back means a new SIM card, not just moving it back. This runs in the other direction too in practice — kosher phones are certified hardware built for kosher lines, carrying the \"Meushar\" (approved) certification mark, and the two are designed to be used together, not mixed and matched.",
          "The practical takeaway: don't test a kosher SIM in a spare regular phone just to check if a line is working. If you need to confirm a line is active, ask the carrier or check with support instead.",
        ],
      },
      {
        heading: "Can a kosher number be ported to a different kosher carrier?",
        paragraphs: [
          "Yes — moving a kosher number from one kosher-certified carrier to another is a normal, supported operation, the same as porting any other Israeli mobile number between carriers.",
          "What doesn't work the way people sometimes expect: taking an ordinary, never-kosher number and porting it in hoping it \"becomes\" kosher on arrival. We tested this directly, and a regular number was rejected for a kosher line with the carrier's system flagging that the number itself wasn't eligible — even with everything else set up correctly on our end. The honest read is that kosher status is tied to the number's standing at its current carrier, not something a new carrier can simply assign to any number handed to it. If your goal is a kosher number and your current one was never kosher, a fresh kosher number is the reliable path, not a port.",
        ],
      },
      {
        heading: "Switching to BitLink with an existing kosher number",
        paragraphs: [
          "If your number matches one of the ranges above, [BitLink's kosher plans](/kosher-phone-plans-israel) support porting it in the normal kosher-to-kosher way — [Kosher Basic](/plans/kosher-basic) at $19.99/month or [Kosher+](/plans/kosher-plus) at $24.99/month if US and Canada calling matters to you — that one now [includes a local US, Canada, or UK number](/kosher-phone-plan-with-usa-number) so family abroad can reach the phone with a local call. [Message support](/support) with your current carrier and number, and the team will confirm eligibility and handle the port. If you don't have a kosher number yet and want one, the same plans work with a freshly assigned kosher number instead — no port needed.",
        ],
      },
    ],
    faq: [
      {
        question: "How can I tell if my Israeli number is kosher just from the digits?",
        answer:
          "Check the prefix against the major carriers' kosher ranges: Golan Telecom 058-32X, Pelephone 050-41X, Cellcom 052-71X/052-76X, Hot Mobile 053-31X/053-41X/053-51X, and Partner 054-84X/054-85X. A match is a strong sign, but the carrier's own records are the final word, since a number can theoretically be reassigned.",
      },
      {
        question: "Can a regular (non-kosher) number become kosher by porting it to a kosher plan?",
        answer:
          "Generally no. Kosher status is tied to how the number is provisioned at its current carrier, not something a new carrier can assign on arrival — we confirmed this directly when a regular number was rejected for a kosher line. If your current number was never kosher, getting a freshly assigned kosher number is the reliable option, not porting your existing one.",
      },
      {
        question: "What happens if I put a kosher SIM in a regular smartphone?",
        answer:
          "It locks, and you'll need a new SIM card to restore service — kosher SIMs and kosher-certified devices are designed to work together, not interchangeably with regular hardware.",
      },
      {
        question: "Can I port my kosher number between two kosher carriers?",
        answer:
          "Yes — transferring a kosher number from one kosher-certified carrier to another is a normal, supported port, just like porting any other Israeli mobile number.",
      },
      {
        question: "My number starts with 055 — is it kosher?",
        answer:
          "Possibly — several smaller resellers offer kosher lines on the shared 055 block, but exact sub-ranges shift more often than the major carriers' allocations and aren't reliable to publish as a fixed list. Ask that specific carrier directly to confirm.",
      },
    ],
    relatedLinks: [
      { href: "/guides/kosher-phones-israel-explained", label: "Kosher phones in Israel, explained" },
      { href: "/kosher-phone-plans-israel", label: "Kosher phone plans" },
      { href: "/guides/yeshiva-seminary-phone-checklist", label: "Yeshiva & seminary phone checklist" },
    ],
  },
  {
    slug: "israeli-phone-number-area-codes",
    title: "What do the different area codes on an Israeli phone number mean?",
    metaTitle: "Israeli Mobile Prefixes: 050–058 Explained",
    metaDescription:
      "What 050, 052, 053, 054, 055 and 058 mean on an Israeli mobile number, which carrier each traces back to, and whether 055 is just as real.",
    datePublished: "2026-08-09",
    dateModified: "2026-08-09",
    readingTime: "5 min read",
    intro:
      "Every Israeli mobile number starts with 05, followed by one more digit that originally marked which carrier issued it — 050, 052, 053, 054, 055, or 058. If you've come across a 053 or 055 number and wondered whether it's a real Israeli line or something more like a virtual or spam number, the short answer is yes, it's completely real: all six ranges are official mobile prefixes regulated the same way, just tied to different carriers and resellers. Here's what each one actually traces back to, and why one of them — 055 — doesn't map to a single company at all.",
    sections: [
      {
        heading: "How is an Israeli mobile number actually structured?",
        paragraphs: [
          "An Israeli mobile number is 10 digits written as 0XX-XXX-XXXX, or +972-XX-XXX-XXXX internationally (the leading 0 gets dropped and replaced by the country code). The two digits right after that leading 0 — 050, 052, 053, 054, 055, or 058 — are the part that identifies which range, and originally which carrier, the number was issued from.",
        ],
      },
      {
        heading: "Which carrier does each prefix trace back to?",
        paragraphs: [
          "These are the six mobile prefixes in use in Israel today, and the carrier each one was originally allocated to.",
        ],
        table: {
          columns: ["Prefix", "Carrier"],
          rows: [
            { cells: ["050", "Pelephone"] },
            { cells: ["052", "Cellcom"] },
            { cells: ["053", "Hot Mobile"] },
            { cells: ["054", "Partner"] },
            { cells: ["058", "Golan Telecom"] },
            { cells: ["055", "Shared block for resellers (MVNOs)"], highlight: true },
          ],
          note: "Numbers get ported between carriers constantly in Israel, so a prefix shows where a number was originally issued, not necessarily who provides service on it today.",
        },
      },
      {
        heading: "Why doesn't 055 belong to one company?",
        paragraphs: [
          "055 is officially allocated by Israel's Ministry of Communications as a shared range for MVNOs — resellers that don't own their own network, but provide service over an existing carrier's infrastructure. Dozens of smaller providers issue numbers out of this one block, which is exactly why a 055 number doesn't ring a bell the way a 054 or 052 number might: it was never meant to belong to a single, recognizable brand. That's a completely standard, official arrangement, not a workaround or anything to be wary of.",
        ],
      },
      {
        heading: "Does the prefix still tell you who provides service today?",
        paragraphs: [
          "Not reliably. Israeli mobile numbers are portable, so a number originally issued on Cellcom's 052 range could have been ported to a completely different carrier since — the prefix doesn't change when a number moves. Treat the prefix as a clue about a number's history, not a live directory of who's actually serving it right now.",
        ],
      },
      {
        heading: "Is a 053 or 055 number less legitimate than 050 or 052?",
        paragraphs: [
          "No. All six ranges are issued and regulated the same way, and there's no functional difference between them — the same calling, the same SMS, the same ability to receive bank, Bit, Pango, or WhatsApp verification codes. The only real difference is which company originally issued the number.",
        ],
      },
      {
        heading: "What prefix does a BitLink number use?",
        paragraphs: [
          "BitLink numbers are typically issued from Israel's shared reseller ranges, most often 055 — BitLink operates as a reseller running on [Partner's network](/guides/israeli-phone-number-for-banking-bit-pango), rather than holding its own dedicated consumer prefix block, which is the standard setup for a reseller anywhere. A BitLink number works exactly like any other Israeli mobile number for banks, Bit, Pango, WhatsApp, and every other verification flow that expects a real Israeli line — see [BitLink's Israel eSIM page](/israel-esim) for the full comparison against a data-only travel eSIM.",
        ],
      },
    ],
    faq: [
      {
        question: "Is 055 an area code in Israel?",
        answer:
          "Not in the way an area code works elsewhere. Israeli mobile prefixes are carrier ranges, not geographic ones — a 055 number tells you nothing about where in the country the person is. Landline area codes are geographic (02 Jerusalem, 03 Tel Aviv, 04 Haifa, 08 the south, 09 Sharon), but every mobile number starts 05 wherever it was issued.",
      },
      {
        question: "Who owns the 055 prefix in Israel?",
        answer:
          "No single company. The Ministry of Communications allocates 055 as a shared range for MVNOs, so dozens of smaller providers issue numbers from it. That's an official arrangement, which is why a 055 number can't be traced to one recognisable brand the way an 052 or 054 number can.",
      },
      {
        question: "Is a 055 number a real Israeli phone number?",
        answer:
          "Yes. 055 is an official mobile prefix allocated by Israel's Ministry of Communications, specifically as a shared block for resellers (MVNOs) rather than one single carrier. It works exactly like any other Israeli mobile number.",
      },
      {
        question: "What carrier is 053 in Israel?",
        answer: "053 was originally allocated to Hot Mobile.",
      },
      {
        question: "What carrier is 054 in Israel?",
        answer: "054 was originally allocated to Partner.",
      },
      {
        question: "Does an Israeli number's prefix tell you who provides service today?",
        answer:
          "Not reliably — Israeli mobile numbers are portable, so a number can move to a different carrier while keeping its original prefix. The prefix reflects who issued the number originally, not necessarily who serves it now.",
      },
      {
        question: "What prefix do BitLink numbers use?",
        answer:
          "Most commonly 055, Israel's shared range for resellers — BitLink runs as a reseller on Partner's network rather than holding its own dedicated prefix block, the standard setup for a reseller.",
      },
    ],
    relatedLinks: [
      { href: "/guides/is-my-israeli-number-kosher", label: "Is my Israeli number kosher?" },
      { href: "/guides/israeli-phone-number-for-banking-bit-pango", label: "Why banks and Bit need an Israeli number" },
      { href: "/israel-esim", label: "Israel eSIM with a real Israeli number" },
    ],
  },
  {
    slug: "gap-year-israel-cost",
    title: "How much does a gap year in Israel actually cost?",
    metaTitle: "Gap Year in Israel Cost: A Real Monthly Budget",
    metaDescription:
      "What a yeshiva or seminary year in Israel really costs beyond tuition: honest monthly numbers, bein hazmanim, and where families overspend.",
    datePublished: "2026-08-16",
    dateModified: "2026-08-16",
    readingTime: "7 min read",
    intro:
      "Tuition is the number everyone knows. The number nobody publishes is what the year costs after tuition — the felafel, the buses, the off-Shabbat weekends, the coffee that somehow becomes daily. Ask three families and you'll get three wildly different answers, because kids spend wildly differently. So here's the honest version: what the money actually goes to, real monthly ranges from frugal to free-spending, the one-time costs that catch parents off guard, and where the overspending usually hides.",
    sections: [
      {
        heading: "What does tuition already cover?",
        paragraphs: [
          "Most yeshiva and seminary programs cover housing, most meals, and the organized tiyulim in the tuition — so the year-in-Israel budget question is really about everything else. That's food outside the meal plan, transportation, weekends away, laundry in some programs, phone, and the discretionary layer of snacks, coffee, and going out that varies enormously from kid to kid.",
          "Check your specific program's fine print before budgeting, because the gaps differ: some serve three meals a day, some serve two, some close the kitchen on off-Shabbat weekends, and a few charge separately for optional trips. The size of the meal-plan gap is the single biggest driver of monthly spending.",
        ],
      },
      {
        heading: "What does a normal month look like?",
        paragraphs: [
          "The recurring spending falls into a handful of buckets. Food beyond the meal plan is the big one — the Thursday-night felafel, pizza after seder, the shwarma habit — and it ranges from almost nothing for a kid who eats every program meal to a few hundred dollars for a kid who mostly doesn't. Transportation is modest: buses and light rail are cheap, and a month of normal city travel plus a couple of intercity trips usually stays around 150–250 shekels. Then there's the everything-else layer: coffee, snacks, toiletries, laundry, a haircut, the occasional outing.",
          "Off-Shabbat weekends deserve their own line. A weekend at a host family costs almost nothing beyond the bus fare and something for the host — flowers, wine, or chocolates, figure 40–60 shekels. A weekend of hostels or Airbnb with friends is a different order of magnitude. Kids who are hosted most weekends spend dramatically less over the year than kids who travel independently, and this one habit separates the frugal year from the expensive one more than any other.",
        ],
        table: {
          columns: ["Monthly bucket", "Frugal", "Typical", "Spender"],
          rows: [
            { cells: ["Food beyond the meal plan", "$40", "$120", "$300+"] },
            { cells: ["Buses, trains & light rail", "$30", "$50", "$80"] },
            { cells: ["Off-Shabbat weekends", "$20", "$60", "$200+"] },
            { cells: ["Coffee, snacks & going out", "$20", "$70", "$150+"] },
            { cells: ["Toiletries, laundry & misc.", "$20", "$40", "$60"] },
            { cells: ["Phone plan (Student 5G, 50GB)", "$35", "$35", "$35"], highlight: true },
            { cells: ["Roughly per month", "~$165", "~$375", "~$825+"] },
          ],
          note:
            "Ranges reflect what families consistently report, converted at roughly 3.5 shekels to the dollar. The spread is real — the difference is mostly eating habits and how weekends are spent, not prices.",
        },
      },
      {
        heading: "So what should we budget for the whole year?",
        paragraphs: [
          "For monthly spending money, most families land somewhere between $250 and $450 a month, with genuinely frugal kids under $200 and free-spenders well past $600. Over a nine-to-ten-month year, that's roughly $2,000–4,500 in spending money for the typical range.",
          "Then add the one-time and seasonal costs, which is where budgets actually get blown: flights (including a possible trip home for Pesach), bein hazmanim — the weeks around Sukkot and Pesach when many programs close and students travel — gifts and Judaica to bring home, and a buffer for the unplanned. Bein hazmanim alone can run $300–800 per break depending on whether it's hosted weekends and day trips or a full traveling-with-friends production. A realistic all-in number beyond tuition, for a typical kid: $4,000–7,000 for the year.",
        ],
      },
      {
        heading: "How do they actually pay for things — and how do parents send money?",
        paragraphs: [
          "Most gap-year students run the whole year on a parent's card plus cash withdrawn from ATMs — no Israeli bank account needed. Before the flight, sort out a card with no foreign-transaction fee (1–3% on every purchase adds up over a year) and tell the bank the travel dates. The fuller setup — cards, cash, transfers, and what to test before flying — is in [the phone, banking, and money guide](/guides/gap-year-israel-phone-banking-money).",
          "One wrinkle worth knowing: Israeli friends split costs with Bit, Israel's Venmo, and Bit wants an Israeli phone number and Israeli banking. Most gap-year students won't have the banking side, so they'll pay their share in cash or by card — fine, just slightly less convenient. The Israeli phone number itself they'll need regardless, for [verification codes and everyday apps](/guides/israeli-phone-number-for-banking-bit-pango).",
        ],
      },
      {
        heading: "Where does the overspending usually hide?",
        paragraphs: [
          "Three places, consistently. First, food delivery: Wolt is excellent and dangerous, and a delivery habit quietly doubles the food budget. Second, taxis: Gett is great at midnight, expensive as a lifestyle — the bus costs a tenth as much. Third, bein hazmanim plans made at the last minute with no budget agreed in advance; two weeks of improvised travel with friends is where a year's careful spending goes to die.",
          "The fix isn't a lecture, it's a structure: a fixed monthly transfer rather than an open card, an agreed bein hazmanim budget before the break starts, and a norm of asking before big one-off spends. Kids rise to a clear number surprisingly well.",
        ],
      },
      {
        heading: "What's genuinely cheap in Israel — and what isn't?",
        paragraphs: [
          "Cheap: public transport, produce and supermarket basics, felafel and street food, and phone service — plans cost far less than American ones. Expensive: eating out at real restaurants, delivery, taxis, imported brand-name products, and anything bought in a hurry at a convenience store. A kid who eats program meals, rides buses, and shops at the supermarket lives well on little; a kid who lives on Wolt and Gett spends like a tourist in Manhattan.",
          "Set the phone up before the flight and it becomes one of the flat, predictable lines in the budget: [Student 5G](/israeli-phone-plans-for-students) is $34.99 a month for 50GB, billed in dollars to a parent's card, with no Israeli ID or bank account needed — no airport kiosk markup, no surprise roaming line on the family bill.",
        ],
      },
    ],
    faq: [
      {
        question: "How much spending money does a gap-year student in Israel need per month?",
        answer:
          "Most families land between $250 and $450 a month. Genuinely frugal students manage under $200; free-spenders pass $600. Eating habits and how off-Shabbat weekends are spent drive most of the spread.",
      },
      {
        question: "What does a gap year in Israel cost beyond tuition?",
        answer:
          "A realistic all-in number for a typical student is $4,000–7,000 for the year: monthly spending money plus flights, bein hazmanim travel, and one-time costs. Frugal years come in well under that.",
      },
      {
        question: "What is bein hazmanim and how much does it cost?",
        answer:
          "The breaks around Sukkot and Pesach when many programs close and students travel. Budget $300–800 per break depending on plans — hosted weekends cost little, while traveling with friends adds up fast. Agree the budget before the break starts.",
      },
      {
        question: "Does a gap-year student need an Israeli bank account?",
        answer:
          "Usually not. A parent's no-foreign-fee card plus ATM cash covers the year. An Israeli phone number is the thing they do need — for verification codes and everyday Israeli apps.",
      },
      {
        question: "Is Israel expensive for students?",
        answer:
          "The staples are cheap: buses, supermarket food, street food, and phone plans. Restaurants, delivery, and taxis are where money disappears. A student living on program meals and buses spends little.",
      },
    ],
    relatedLinks: [
      { href: "/guides/gap-year-israel-phone-banking-money", label: "Phone, banking & money before they land" },
      { href: "/guides/gap-year-israel-checklist", label: "The full gap year checklist" },
      { href: "/guides/gap-year-israel-first-two-weeks", label: "Their first two weeks in Israel" },
      { href: "/israeli-phone-plans-for-students", label: "Student phone plans" },
    ],
  },
  {
    slug: "getting-packages-in-israel",
    title: "How do I get packages and Amazon orders during a year in Israel?",
    metaTitle: "Packages & Amazon Orders in Israel: What Actually Works",
    metaDescription:
      "How students get packages in Israel: Amazon shipping, the customs thresholds, courier SMS, addressing mail to a yeshiva, and what not to post.",
    datePublished: "2026-08-16",
    dateModified: "2026-08-16",
    readingTime: "6 min read",
    intro:
      "Sooner or later every gap-year family hits this: the kid needs something from America, or the parents want to send a care package, and nobody knows how packages in Israel actually work. The short version — Amazon does deliver to Israel, small orders arrive tax-free, the courier will text an Israeli number, and for anything sentimental or urgent, a person flying over beats the postal system every time. Here's the whole picture.",
    sections: [
      {
        heading: "Does Amazon deliver to Israel?",
        paragraphs: [
          "Yes. Amazon.com ships a large share of its catalog to Israeli addresses directly — look for the shipping-to-Israel eligibility on the product page, and check the shipping cost at checkout since it varies by item and the free-shipping promotions Amazon runs for Israel have changed over the years. Delivery typically takes one to three weeks depending on the shipping speed chosen.",
          "For plenty of things, though, ordering from America is solving the wrong problem. Israel has pharmacies, electronics chains, and local delivery that's often faster and cheaper once you account for shipping and tax — and AliExpress is hugely popular in Israel for cheap non-urgent items. The question to ask before any US order: can this just be bought here? The [packing list guide](/guides/gap-year-israel-packing-list) has the bring-versus-buy logic, and it applies all year, not just to the suitcase.",
        ],
      },
      {
        heading: "Will they have to pay customs tax?",
        paragraphs: [
          "This is the part that surprises people, and the rules are actually friendly for small orders. Personal imports valued under $75 enter Israel exempt from tax entirely. From $75 up to $500, the order clears customs but pays VAT (currently 18%). Above $500, customs duties join the party too. The thresholds go by the order's value, and shipping charges get pulled into the tax calculation once you're over the exemption line.",
          "Two practical consequences. First, keep individual orders under $75 when you can — two $60 orders placed separately beat one $120 order. Second, don't try to game it with fake invoices; customs can and does check, and a held package with a tax dispute is a weeks-long headache. For a one-off larger purchase, just budget the 18% into the decision.",
        ],
      },
      {
        heading: "How does delivery actually work in Israel?",
        paragraphs: [
          "Differently from home, and this is where students get burned. Israeli couriers run on SMS and WhatsApp: they text a delivery notice or a pickup-point code to the phone number on the order, and if that number doesn't answer or the text goes nowhere, the package stalls and eventually goes back. Many deliveries don't come to the door at all — they land at a pickup point or locker at a nearby store, and the collection code arrives by text.",
          "So the single most important field on any order form is the phone number: it needs to be the student's working Israeli number, not the US number and not the parents' number back home. This is one of those places where the [Israeli number they set up before landing](/guides/israeli-phone-number-before-you-land) quietly earns its keep — the courier's text arrives, the code works, the package gets collected. If that number isn't sorted yet, [the plans](/israeli-phone-plans-for-students) start at $14.99/month and the line can be running before the flight.",
        ],
      },
      {
        heading: "What address should packages go to?",
        paragraphs: [
          "Use the yeshiva or seminary's address with the student's name — care of the program office is the standard move, and the office deals with deliveries constantly. Before the first order, have the student ask the office two questions: exactly how they like the address written, and whether packages come to the office or to a nearby pickup point. English addresses work fine; the phone number matters more than perfect Hebrew formatting.",
        ],
        steps: [
          "Line 1: Student's full name (as on their passport)",
          "Line 2: c/o [Program name], and the office/room if the program specifies one",
          "Line 3: Street address, building number",
          "Line 4: City, postal code (the office will know the 7-digit code), Israel",
          "Phone: the student's Israeli mobile number — this is the field the courier actually uses",
        ],
      },
      {
        heading: "Should parents mail a care package from home?",
        paragraphs: [
          "Honest answer: usually not by mail. Regular international post to Israel is slow — weeks, sometimes a couple of months around the chagim — and a box of American snacks can arrive stale, taxed, or both. Food items can also get held at customs. The care-package instinct is right; the postal system is the wrong vehicle.",
          "The community solves this the old-fashioned way: somebody is always flying. Neighbors, cousins, a friend's parent visiting for Sukkot — sending a duffel or a padded envelope with a traveler is faster, free, and how it's actually done. The other underrated move is ordering the care package from inside Israel: local delivery from an Israeli supermarket or Wolt, a gift order from an Israeli bakery, or an Amazon order shipped domestically-priced to their door. Same warm gesture, days instead of weeks.",
        ],
      },
      {
        heading: "What about prescription medication and valuables?",
        paragraphs: [
          "Don't mail either. Medication should come in the suitcase — a full year's supply in original labeled containers with a doctor's note, as covered in [the packing guide](/guides/gap-year-israel-packing-list) — because importing medicine by mail runs into health-ministry rules and holds. If a refill becomes unavoidable mid-year, involve the program and a local doctor rather than the postal system; there's usually an Israeli equivalent. Valuables — a replacement phone, jewelry, anything with a real price tag — travel with a person or get bought locally. A phone mailed from the US pays VAT on arrival anyway, which usually erases the price difference.",
        ],
      },
    ],
    faq: [
      {
        question: "Does Amazon ship to Israel?",
        answer:
          "Yes — much of the catalog ships to Israeli addresses directly. Check per-item eligibility and shipping cost at checkout, and expect one to three weeks for delivery.",
      },
      {
        question: "How much can you import to Israel without paying tax?",
        answer:
          "Personal imports under $75 are tax-exempt. From $75 to $500 you pay 18% VAT; above $500, customs duties apply too. Splitting orders under the $75 line keeps small purchases tax-free.",
      },
      {
        question: "Why didn't the courier deliver my package in Israel?",
        answer:
          "Almost always the phone number. Israeli couriers coordinate by SMS and WhatsApp to the number on the order — if it's a US number or unreachable, the package stalls at a pickup point or goes back. Use the student's working Israeli number on every order.",
      },
      {
        question: "How long does mail from the US take to reach Israel?",
        answer:
          "Regular post takes weeks, sometimes longer around the holidays. Courier services are faster but pricey. For anything urgent or sentimental, sending it with someone flying over beats the mail.",
      },
      {
        question: "Can you mail medication to Israel?",
        answer:
          "Avoid it — imported medicine hits health-ministry rules and customs holds. Bring a full supply in the luggage in original containers; for a mid-year refill, work with the program and a local doctor instead.",
      },
    ],
    relatedLinks: [
      { href: "/guides/gap-year-israel-packing-list", label: "The honest packing list" },
      { href: "/guides/israeli-phone-number-before-you-land", label: "Get an Israeli number before you land" },
      { href: "/guides/gap-year-israel-cost", label: "What a gap year actually costs" },
      { href: "/israeli-phone-plans-for-students", label: "Student phone plans" },
    ],
  },
  {
    slug: "sick-in-israel-gap-year",
    title: "What happens if my kid gets sick during their gap year in Israel?",
    metaTitle: "Getting Sick in Israel on a Gap Year: How Care Works",
    metaDescription:
      "How healthcare works for gap-year students in Israel: the program's insurance, Terem urgent care, what a doctor costs, and when to use the ER.",
    datePublished: "2026-08-16",
    dateModified: "2026-08-16",
    readingTime: "7 min read",
    intro:
      "This is the question parents actually lose sleep over, and the honest answer is reassuring: Israel has excellent, accessible medical care, your child's program has handled sick students hundreds of times, and the system for a gap-year kid is simpler than most families expect. What trips people up isn't the care — it's not knowing the sequence. Who to tell, where to go, what it costs, and what should be set up before the flight. Here's the whole picture, calmly.",
    sections: [
      {
        heading: "Who takes care of a sick student — the parents or the program?",
        paragraphs: [
          "The program, first. Every yeshiva and seminary has staff whose job includes exactly this — a madrich or em bayit who has walked a hundred students through a fever, a sprained ankle, or a strep test. The student's first move when something's wrong is telling the staff, not calling home in a panic — the staff know which clinic the insurance uses, who speaks English, and when something needs a doctor versus soup and a day in bed.",
          "For parents, the pre-flight version of this: know the name of the person your child should go to, and save the program office's number. When something happens mid-year, your call is to the program, and seven time zones away, that's a much better first call than trying to remote-diagnose over WhatsApp.",
        ],
      },
      {
        heading: "What insurance does a gap-year student have in Israel?",
        paragraphs: [
          "Almost every program requires health coverage and most arrange it — typically a group policy with an Israeli insurer built for foreign students, either bundled into tuition or billed alongside it. These policies generally cover doctor visits, urgent care, prescriptions, and hospitalization through the insurer's network, and they come with a hotline that tells you where to go and issues the approval the clinic wants to see.",
          "Before the flight, get three things from the program and put them in the student's phone and yours: the insurer's name, the policy or member number, and the hotline number. Also ask what the policy doesn't cover — dental and pre-existing conditions are the usual gaps, and glasses and therapy vary. Ten minutes of asking in August prevents the 2 a.m. scramble in January.",
        ],
      },
      {
        heading: "Where do they actually go when they're sick?",
        paragraphs: [
          "For everyday illness — fever, infection, the thing that needs antibiotics — the answer is usually a clinic visit arranged through the insurer's hotline or the program, often with English-speaking doctors used to student policies. Many insurers also run telehealth, where a doctor video-calls, diagnoses, and sends a prescription to a nearby pharmacy.",
          "For evenings, weekends, and anything urgent-but-not-emergency — a bad cut, a possible fracture, a kid who got much worse at 11 p.m. — Israel has Terem, a chain of walk-in urgent-care centers that do X-rays, stitches, and labs on the spot. Terem is the middle tier American families don't always know exists, and it handles most of what would otherwise become a miserable ER night. The ER (miyun) is for genuine emergencies; without a referral it's also expensive, so the habit to teach is: insurer hotline or Terem first, ER when it's serious, and for a true emergency call 101 — Magen David Adom, Israel's ambulance service — immediately.",
        ],
        table: {
          columns: ["Situation", "Where to go", "What to expect"],
          rows: [
            { cells: ["Cold, fever, everyday illness", "Program staff → insurer's clinic or telehealth", "Covered visit, prescription sent to a pharmacy"] },
            { cells: ["Nights, weekends, minor injuries", "Terem urgent care", "Walk-in; X-rays, stitches, and labs on site"] },
            { cells: ["Serious emergency", "Call 101 (Magen David Adom) / ER", "Ambulance and ER care; insurer notified after"] },
            { cells: ["Minor aches, questions", "Any pharmacy (Superpharm and others)", "Pharmacists give real advice; much is over-the-counter"] },
          ],
          note:
            "Save the insurer's hotline, the program office, and 101 in the student's phone before the flight — the sequence matters more than any single number.",
        },
      },
      {
        heading: "What does medical care cost in Israel?",
        paragraphs: [
          "Less than Americans fear. With the program's insurance, routine care is typically covered or nearly so through the network. Even paying fully out of pocket, the numbers are un-American: a private doctor visit runs a few hundred shekels, a Terem visit several hundred — often reimbursable under the policy — and prescriptions are usually cheap. The one genuinely expensive door is the ER without a referral, which can run over a thousand shekels before treatment; that's the financial reason the hotline-or-Terem-first habit matters, not just the medical one.",
          "Keep every receipt. Reimbursement claims are routine with these policies, and a photo of each receipt sent to the parents the same day is the entire filing system a gap-year student needs.",
        ],
      },
      {
        heading: "What about prescriptions and medication from home?",
        paragraphs: [
          "The rule from [the packing guide](/guides/gap-year-israel-packing-list) is the rule: a full year's supply of any regular prescription, in original labeled containers, with a doctor's note. Mailing medication mid-year runs into customs and health-ministry holds — [don't ship it](/guides/getting-packages-in-israel). If a refill becomes unavoidable, the path is a local doctor through the insurance, who can usually prescribe the Israeli equivalent.",
          "For everything else, Israeli pharmacies are a pleasant surprise: pharmacists dispense real advice, many medications that need prescriptions in the US are over-the-counter, and there's a Superpharm within walking distance of nearly every program.",
        ],
      },
      {
        heading: "What about homesickness and the harder stuff?",
        paragraphs: [
          "Worth saying plainly: the most common health issue on a gap year isn't physical. Homesickness, a rough adjustment, anxiety flaring in a new country — programs see it every single year, expect it, and have staff for it. The first weeks are the wobble, as [the survival guide](/guides/gap-year-israel-first-two-weeks) puts it, and it mostly passes. When it's more than a wobble, tell the program — many insurance policies include counseling, English-speaking therapists exist in every city with a gap-year population, and no good program treats a struggling kid as an inconvenience.",
          "For parents: a kid who sounds miserable in week two is normal. A kid who's still isolated and flat in week eight is a phone call to the program. The staff can see what you can't from seven time zones away.",
        ],
      },
      {
        heading: "What should be set up before the flight?",
        paragraphs: [
          "One phone-related note inside all of this: the insurer's hotline, the telehealth callback, the clinic's appointment reminder, and the pharmacy's ready-for-pickup text all go to an Israeli number — one more quiet reason the [phone gets set up before the flight](/guides/israeli-phone-number-before-you-land), not after.",
        ],
        steps: [
          "Get the insurer's name, policy number, and hotline from the program; save them in the student's phone and the parents'.",
          "Ask the program what the policy excludes (dental and pre-existing conditions are the usual suspects) and how claims are filed.",
          "Pack a year of prescriptions in original containers with a doctor's note, plus a small kit of the over-the-counter basics they actually use.",
          "Save the emergency sequence in the phone: program staff, insurer hotline, Terem's nearest branch, and 101.",
          "Agree on the escalation rule: student tells the staff first, parents call the program — nobody diagnoses over WhatsApp.",
        ],
      },
    ],
    faq: [
      {
        question: "Do gap-year students in Israel need health insurance?",
        answer:
          "Yes, and nearly every program requires it — most arrange a group policy with an Israeli insurer built for foreign students, covering doctor visits, urgent care, prescriptions, and hospitalization through a network.",
      },
      {
        question: "What is Terem?",
        answer:
          "Israel's chain of walk-in urgent-care centers — open evenings and weekends, with X-rays, stitches, and labs on site. It covers most situations American families would take to an ER, faster and far cheaper.",
      },
      {
        question: "How much does a doctor visit cost in Israel without insurance?",
        answer:
          "A few hundred shekels privately, and a Terem visit several hundred — often reimbursable under a student policy. The expensive door is the ER without a referral, which can exceed a thousand shekels.",
      },
      {
        question: "What's the emergency number in Israel?",
        answer:
          "101 for Magen David Adom, the national ambulance service. Police are 100 and fire is 102. Save all three plus the program's staff numbers before the flight.",
      },
      {
        question: "Can parents talk to the yeshiva or seminary when their child is sick?",
        answer:
          "Yes — and they should. The program staff handle sick students constantly and can see the situation up close. The healthy sequence: the student tells the staff, and parents call the program office rather than trying to manage care from abroad.",
      },
    ],
    relatedLinks: [
      { href: "/guides/gap-year-israel-first-two-weeks", label: "Their first two weeks in Israel" },
      { href: "/guides/gap-year-israel-packing-list", label: "The honest packing list" },
      { href: "/guides/gap-year-israel-checklist", label: "The full gap year checklist" },
      { href: "/guides/israeli-phone-number-before-you-land", label: "Get an Israeli number before you land" },
    ],
  },
  {
    slug: "getting-around-israel",
    title: "How do I get around Israel for the year? Buses, trains, Rav-Kav, and the apps",
    metaTitle: "Getting Around Israel: Rav-Kav, Buses, Trains & Apps",
    metaDescription:
      "The student's guide to Israeli transport: Rav-Kav and contactless fares, Moovit, buses and the fast train, sheruts, and planning around Shabbat.",
    datePublished: "2026-08-16",
    dateModified: "2026-08-16",
    readingTime: "6 min read",
    intro:
      "Israeli public transport is one of the genuinely great deals of the gap year: cheap, frequent, and it goes everywhere — once you understand the system. The learning curve is really four things: the Rav-Kav card, the Moovit app, the Friday-afternoon shutdown, and knowing when a bus beats a taxi. Master those in week one and the whole country opens up for the price of a coffee.",
    sections: [
      {
        heading: "What is a Rav-Kav and how do I get one?",
        paragraphs: [
          "The Rav-Kav is Israel's tap card for buses, light rail, and trains — the Israeli MetroCard or Oyster. You can pick up an anonymous card at light rail stations, train stations, and public-transport service counters, load money onto it, and tap on every ride. There's also a personal Rav-Kav with your name and photo that unlocks discount profiles, but for a one-year student the anonymous card plus phone-based payment covers everything without paperwork.",
          "The modern alternative: skip the card queue entirely and pay contactless. Israeli buses and light rail accept payment by phone and contactless credit card through the fare apps, and most students end up running fares from their phone within a few weeks anyway. Either way, fares are distance-and-time based with free transfers inside a 90-minute window, and daily and monthly caps mean a heavy travel day stops costing more at some point. A normal month of city buses plus a few intercity trips lands around 150–250 shekels — [one of the cheap lines in the gap-year budget](/guides/gap-year-israel-cost).",
        ],
      },
      {
        heading: "Which apps actually matter?",
        paragraphs: [
          "Moovit is the one that matters — the door-to-door transit bible for every bus, train, and light rail in the country, in English, with live arrival times. Trip planning happens in Moovit; everything else is secondary. Alongside it: a fare app for paying by phone, Google Maps or Waze for walking and general orientation, and Gett for taxis. Israel Railways has its own app for train schedules and tickets, worth having in the phone for intercity trips.",
          "Small print that saves frustration: these apps confirm sign-ups with an SMS code, and delivery and taxi apps in particular want a working Israeli mobile number. It's the same pattern as [everything else in Israeli daily life](/guides/israeli-phone-number-for-banking-bit-pango) — set the number up before you need the app, and Moovit's live times plus a day of navigating burn almost no data against a 50GB plan.",
        ],
      },
      {
        heading: "How do buses, trains, and the light rail fit together?",
        paragraphs: [
          "City buses and light rail handle daily life — getting to the Old City, the shuk, a friend's neighborhood. Jerusalem's light rail runs through the center of town; Tel Aviv has its own light rail line plus a dense bus network. Between cities, intercity buses go essentially everywhere cheaply, and the train shines on specific routes — the fast train connects Jerusalem and Tel Aviv's airport-and-center line in around 35 minutes, and the coastal line strings together Tel Aviv, Herzliya, Netanya, and Haifa.",
          "Two habits worth building early: check Moovit before leaving rather than trusting memory, because routes and frequencies shift, and for popular long-distance runs — Eilat especially, and anything around bein hazmanim — book the intercity bus ahead in the app rather than gambling on a seat.",
        ],
        table: {
          columns: ["Getting...", "Best option", "Worth knowing"],
          rows: [
            { cells: ["Around the neighborhood", "Walk", "Israeli cities are compact; students walk more than they expect"] },
            { cells: ["Across the city", "Bus or light rail", "Tap Rav-Kav or pay by phone; free transfers within 90 minutes"] },
            { cells: ["Jerusalem ↔ Tel Aviv", "Fast train", "Around 35 minutes; check Israel Railways for schedules"] },
            { cells: ["Between most cities", "Intercity bus", "Cheap and frequent; book ahead for Eilat and holiday travel"] },
            { cells: ["Late night / no bus", "Gett or a sherut", "Gett is Israel's Uber; sherut shared taxis run fixed routes"] },
            { cells: ["Friday afternoon–Saturday night", "Plan ahead", "Buses and trains stop for Shabbat; sherut lines run in some cities"] },
          ],
          note:
            "Moovit answers almost every \"how do I get there\" question door to door, in English, with live times — it's the first app to install.",
        },
      },
      {
        heading: "What are sherut taxis, and when is Gett worth it?",
        paragraphs: [
          "A sherut is a shared van running a fixed route for a fixed per-seat price — between cities, and along major streets within them. They leave when full, cost a fraction of a private taxi, and crucially, some intercity and Tel Aviv lines keep running on Shabbat and holidays when everything else stops. Knowing the sherut option exists is the difference between stranded and fine on a Saturday night.",
          "Gett is Israel's ride-hailing app — real taxis, app-booked, card-paid, no cash negotiation. The right tool at midnight, in the rain, or hauling luggage; an expensive habit as daily transport, since the bus costs a tenth as much. The budget rule from [the cost guide](/guides/gap-year-israel-cost) applies: taxis are for exceptions, buses are for life.",
        ],
      },
      {
        heading: "How does Shabbat change the map?",
        paragraphs: [
          "From mid-afternoon Friday until after dark Saturday, public transport stops in most of the country — the last buses out of Jerusalem run early Friday afternoon, earlier in winter when Shabbat starts early. Getting to an [off-Shabbat host](/guides/off-shabbos-gap-year) means leaving with margin, not catching the theoretical last bus. The return trip matters too: buses resume Saturday night, but the first hour is crowded and slow, and sherut lines fill the gap in the bigger cities.",
          "The planning rhythm students learn fast: know Friday's candle-lighting time, work backwards through Moovit, and be on a bus by midday. Friday-afternoon Israel is not the place to discover the 2:15 was the last one.",
        ],
      },
      {
        heading: "Should anyone rent a car or use Pango?",
        paragraphs: [
          "For a gap-year student: no. Between buses, trains, sheruts, and Gett, a car is an expense, a parking problem, and an insurance question nobody needs at eighteen. Pango — the parking app the [banking guide](/guides/israeli-phone-number-for-banking-bit-pango) mentions — only matters if you drive, which rules out nearly every student. The one exception is a family visit mid-year where parents rent a car; that's the parents' project, not the student's.",
        ],
      },
    ],
    faq: [
      {
        question: "How do I get a Rav-Kav card in Israel?",
        answer:
          "Pick up an anonymous card at light rail stations, train stations, or public-transport service counters and load money onto it — or skip it and pay contactless by phone through the fare apps, which is what most students end up doing.",
      },
      {
        question: "How much does public transport cost in Israel?",
        answer:
          "Cheap — fares include free transfers within 90 minutes, daily and monthly caps limit heavy use, and a typical student month of city travel plus a few intercity trips runs about 150–250 shekels.",
      },
      {
        question: "Does public transport run on Shabbat in Israel?",
        answer:
          "Mostly no — buses and trains stop from Friday afternoon until Saturday night. Sherut shared taxis keep running on some routes, especially in Tel Aviv, and Gett works throughout.",
      },
      {
        question: "What's the best transit app for Israel?",
        answer:
          "Moovit — door-to-door routing for every bus, train, and light rail in English with live times. Add a fare app for paying by phone, Gett for taxis, and Israel Railways for train tickets.",
      },
      {
        question: "How long is the train from Jerusalem to Tel Aviv?",
        answer:
          "The fast train runs about 35 minutes. It's the best way between the two cities — check schedules in the Israel Railways app, especially before holidays.",
      },
    ],
    relatedLinks: [
      { href: "/guides/gap-year-israel-first-two-weeks", label: "Their first two weeks in Israel" },
      { href: "/guides/off-shabbos-gap-year", label: "Where do students go for off Shabbos?" },
      { href: "/guides/gap-year-israel-cost", label: "What a gap year actually costs" },
      { href: "/israeli-phone-plans-for-students", label: "Student phone plans" },
          { href: "/guides/how-much-data-do-i-need-in-israel", label: "How much data you'll need" },
    ],
  },
  {
    slug: "off-shabbos-gap-year",
    title: "Where do gap year students go for off Shabbos?",
    metaTitle: "Off Shabbos on a Gap Year: Finding Hosts",
    metaDescription:
      "How off Shabbos works for yeshiva and seminary students in Israel: finding host families, getting invited back, and Friday travel timings.",
    datePublished: "2026-08-16",
    dateModified: "2026-08-16",
    readingTime: "6 min read",
    intro:
      "Every yeshiva and seminary runs the same rhythm: some Shabbatot are \"in\" — everyone stays at the program — and some are \"off,\" when the building empties and everyone scatters to hosts around the country. For students with family in Israel, off Shabbos solves itself. For everyone else, it's the year's recurring logistics puzzle: where am I going, how do I get there before candle lighting, and how do I get invited back? Here's how it actually works.",
    sections: [
      {
        heading: "How does the in-Shabbos / off-Shabbos system work?",
        paragraphs: [
          "Programs publish a calendar: in-Shabbatot, where meals and davening happen at the program and attendance is expected, and off-Shabbatot, where students arrange their own plans — usually every second or third week, with everyone out for the long chagim breaks. The calendar is your friend; the students who glance at it Sunday and start arranging then have relaxed weeks, and the ones who realize on Thursday that it's an off week have stressful ones.",
          "One planning note parents appreciate: off-Shabbat plans are also the answer to \"how do we know where our kid is?\" The healthy norm is simple — by midweek, home knows the host's name and city. Not surveillance, just the same courtesy the host is extending.",
        ],
      },
      {
        heading: "How do students actually find Shabbos hosts?",
        paragraphs: [
          "In rough order of how it really happens: relatives, however distant — the second cousin in Ramat Beit Shemesh you've never met is a completely normal Shabbos invitation, and they expect the call. Then family friends and your parents' network; a single WhatsApp from a parent — \"my son is in yeshiva this year, can he come for a Shabbos?\" — produces months of invitations. Then friends' hosts: the roommate going to his aunt brings you along, which is how half of all off-Shabbos plans actually form. Then the program's own network — madrichim, rebbeim, and teachers host students constantly and know alumni families who do too.",
          "Beyond the personal web, Shabbat.com matches guests with host families across Israel and is widely used and legitimate. Anglo neighborhoods — Ramat Beit Shemesh, Efrat, Raanana, Modiin, and half of Jerusalem — run deep hosting cultures where taking gap-year students is simply what families do. The real lesson of the first months: Israel wants to host you. The barrier is almost never finding a family; it's being organized enough to ask by Tuesday instead of Thursday night.",
        ],
      },
      {
        heading: "How do you get invited back?",
        paragraphs: [
          "Being a great Shabbos guest is a learnable skill, and it compounds — the students with standing invitations by Chanukah are the ones who nailed the basics early. None of it is complicated:",
        ],
        steps: [
          "Confirm early in the week, and tell the host when you're arriving — then actually arrive before candle lighting, with margin. Friday buses are not the place for optimism.",
          "Bring something. Wine, chocolates, or flowers, around 40–60 shekels. Hand it over at the door; it's the universal language of Shabbos guests.",
          "Offer to help — setting up, clearing, watching the little kids. Being helpful with the kids is famously the fastest route to a standing invitation.",
          "Bring some Torah to the table. A thought on the parsha from that week's shiur is exactly what the host hoped a yeshiva or seminary student would show up with.",
          "Send a thank-you message after Shabbos. Thirty seconds on motzaei Shabbos is the difference between a one-time guest and \"come back whenever you want.\"",
        ],
      },
      {
        heading: "How do you get there before Shabbos?",
        paragraphs: [
          "The logistics rule is unforgiving: buses and trains stop mid-afternoon Friday and don't resume until Saturday night, and in winter — when candle lighting creeps toward 4 p.m. — the real deadline is earlier than everyone thinks. The habit that works: check the week's candle-lighting time, plan the route in Moovit, and be traveling by midday. [The getting-around guide](/guides/getting-around-israel) covers the system; the off-Shabbos version is simply \"do all of that, earlier.\"",
          "Coordination runs on WhatsApp — the host sending directions, the \"I'm on the 12:40 bus\" update, the Saturday-night \"made it back.\" It's one more bit of Israeli life that assumes [a working Israeli number](/guides/israeli-phone-number-before-you-land), and phones go on the charger before candle lighting, so the travel plan home should be settled before Shabbos starts, not after it ends.",
        ],
      },
      {
        heading: "What if you have nowhere to go?",
        paragraphs: [
          "It happens to everyone at least once, and there are two honest answers. First: say something. Tell the madrich or em bayit by Wednesday — programs keep lists of families who host and will happily place you; no good program lets a student fall through the cracks, but they can't place someone who never asked. Embarrassment is the only real obstacle here, and it's misplaced — connecting students to hosts is a normal part of the staff's week.",
          "Second: staying in is underrated. Most programs run a quiet Shabbos for whoever remains, and a low-key weekend — a long nap, davening without a bus ride, the building to yourselves — is sometimes exactly what a packed year needs. The students who alternate hosted weekends with restful in-Shabbatot tend to enjoy both more. And as [the budget guide](/guides/gap-year-israel-cost) notes, hosted and in-Shabbatot are also what keep the year affordable — the expensive weekends are the improvised hostel-with-friends kind.",
        ],
      },
      {
        heading: "What about Shabbos with friends, hostels, or trips?",
        paragraphs: [
          "Sometimes the plan is a crew of friends doing Shabbos in Tzfat or a hostel weekend somewhere scenic — a real part of the year, and often a highlight. The honest notes: it costs meaningfully more than being hosted, quality varies (a hostel Shabbos is only as good as the people organizing the meals), and programs usually have rules about where students may spend off Shabbos — knowing them beats testing them. Once or twice a year as the special weekend, wonderful; as the default, it's a budget line and a missed chance to sit at Israeli families' tables, which is quietly one of the best parts of the whole year.",
        ],
      },
    ],
    faq: [
      {
        question: "What does \"off Shabbos\" mean in yeshiva or seminary?",
        answer:
          "A Shabbat when the program doesn't run meals or programming and students arrange their own plans — usually every second or third week. \"In\" Shabbatot are spent at the program, and attendance is generally expected.",
      },
      {
        question: "How do gap-year students find Shabbat host families in Israel?",
        answer:
          "Relatives (however distant), parents' networks, friends' hosts, and the program's madrichim and teachers cover most weekends. Shabbat.com matches guests with hosts too. Finding a family is rarely the hard part — asking early in the week is.",
      },
      {
        question: "What should you bring a Shabbos host?",
        answer:
          "Wine, chocolates, or flowers — around 40–60 shekels. Arrive before candle lighting, help where you can, and send a thank-you message after Shabbos. That combination gets students invited back.",
      },
      {
        question: "When do buses stop on Friday in Israel?",
        answer:
          "Mid-afternoon, and effectively earlier in winter when Shabbat starts around 4 p.m. Plan with Moovit and travel by midday Friday — the theoretical last bus is not a plan.",
      },
      {
        question: "What if a student has no Shabbos plans?",
        answer:
          "Tell the madrich or em bayit by midweek — programs keep hosting lists and place students routinely. Staying in for the program's quiet Shabbos is also a perfectly good, restful option.",
      },
    ],
    relatedLinks: [
      { href: "/guides/getting-around-israel", label: "Getting around Israel: buses, trains & Rav-Kav" },
      { href: "/guides/gap-year-israel-cost", label: "What a gap year actually costs" },
      { href: "/guides/gap-year-israel-first-two-weeks", label: "Their first two weeks in Israel" },
      { href: "/israeli-phone-plans-for-students", label: "Student phone plans" },
    ],
  },
  {
    slug: "israeli-sms-verification-from-abroad",
    title: "How do I receive Israeli SMS verification codes from abroad?",
    metaTitle: "Israeli SMS Verification Codes From Abroad: How It Works",
    metaDescription:
      "Locked out of an Israeli bank, Bit or gov.il because the code goes to a number you can't reach? Get a real Israeli mobile number that forwards every text to your inbox, from anywhere in the world, for $14.99/month.",
    datePublished: "2026-08-20",
    dateModified: "2026-08-20",
    readingTime: "7 min read",
    intro:
      "Israel runs on SMS to an 05 number, which is fine until you don't live there. Your bank, Bit, gov.il or Kupat Cholim sends a code to an Israeli mobile — and you're in London, Sydney, Moscow or New York, with no Israeli number that can receive it. The account is yours, the money is yours, and you simply cannot get in. This is a permanent, ordinary situation for anyone with Israeli ties and a life somewhere else, and it has a straightforward fix: a real Israeli number whose texts arrive in your inbox, wherever you happen to be. You never need to visit Israel for it to work.",
    sections: [
      {
        heading: "Why do Israeli banks and services insist on an Israeli number?",
        paragraphs: [
          "Israel runs an unusual amount of daily life through SMS to an 05 mobile number. Bank logins and transfer confirmations, Bit, gov.il, Kupat Cholim appointments, insurance portals, the tax authority, and most Israeli companies' account recovery all assume you are holding an Israeli phone. It isn't a policy anyone wrote down deliberately — it's just what the infrastructure grew into, and it's far more SMS-dependent than the equivalent systems in the US or UK.",
          "That works fine while you live there. It becomes a wall the moment you don't. An Israeli citizen working abroad for two years, an oleh who hasn't flown yet but already opened an account, someone who inherited an Israeli account, a dual citizen with an Israeli business — all of them still have live Israeli accounts that can only be unlocked by a text to a number they no longer hold.",
        ],
      },
      {
        heading: "Why doesn't my Israeli number work while I'm abroad?",
        paragraphs: [
          "Two separate things can be going on, and they have different answers. If you let an Israeli prepaid line lapse, the number is simply gone — idle prepaid numbers in Israel expire after roughly six to twelve months, and once released the number goes back to the pool. No amount of roaming will bring it back.",
          "If the line is still alive but you're overseas, the problem is roaming. BitLink lines don't roam outside Israel — the SIM has no network to attach to abroad, so a text sent to your number never reaches the handset in your pocket. That's a real limitation and worth being clear about rather than discovering it at an airport.",
        ],
      },
      {
        heading: "Can I receive Israeli verification codes without being in Israel?",
        paragraphs: [
          "Yes — because the fix doesn't happen on the handset. SMS-to-email forwarding is a carrier-side setting: the message is intercepted on the network, before it is ever delivered to a phone. Your handset's location, and whether it's even switched on, is irrelevant. The text arrives in your inbox instead.",
          "So the sequence is: you get a real Israeli number, switch on SMS-to-email in your BitLink account with the address you want, and give that number to your bank or to WhatsApp. When they send a code, it lands in your email wherever in the world you happen to be. Nothing needs to be installed, and no app is involved — which also means it works on a laptop, a work computer, or a phone that can't take another SIM.",
        ],
      },
      {
        heading: "Is this a real Israeli number, or a virtual one?",
        paragraphs: [
          "This is the part that matters most, and it's where most alternatives fall down. A BitLink number is a real Israeli mobile number running on Israel's Partner network — a genuine mobile line, with a SIM behind it, registered in your name.",
          "That distinction is not cosmetic. The cheap alternative — an online \"virtual Israeli number\" or a VoIP number from a messaging service — is exactly what banks and serious platforms are built to reject. Financial institutions routinely check whether a number is a real mobile line or a VoIP one, and refuse the VoIP ones for two-factor authentication. That's why people who try the virtual route usually get through WhatsApp and then hit a wall at the bank. A real mobile number doesn't fail that check, because it isn't the thing being screened out.",
        ],
      },
      {
        heading: "What can this not do while you're abroad?",
        paragraphs: [
          "Be clear-eyed about what you're buying. Used this way the number is inbound text only: it does not make or receive calls, you cannot send texts from it, and there is no roaming, because the line never attaches to a network outside Israel. That is the design, not a limitation waiting to be lifted — it is what keeps the price at $14.99/month.",
          "For the verification problem, that's usually enough, because codes are one-way and inbound. But if what you actually need is to speak to your bank in Israel, or to reply to a text, this doesn't solve that on its own, and you shouldn't buy it expecting otherwise. Some services also insist on a voice call rather than an SMS for verification, and those won't work from abroad either.",
        ],
      },
      {
        heading: "Who is this genuinely useful for?",
        paragraphs: [
          "It fits people who have Israeli accounts and live somewhere else, indefinitely: Israelis working or raising families abroad, dual citizens with an Israeli bank account or mortgage, someone managing an elderly parent's affairs from another country, people who inherited an Israeli account, and anyone holding Israeli property or investments from overseas. Our own customers on it are spread across the United States, the United Kingdom, France, Spain, Australia and Russia — none of them waiting to move.",
          "It also fits the other case — someone who is moving to Israel later. Getting the number now means every account you open in advance is tied to a number you will still control after you land, instead of one you have to change on every service afterwards. If that's you, the setup and timing are covered properly in [getting an Israeli phone number before you land](/guides/israeli-phone-number-before-you-land).",
        ],
      },
      {
        heading: "And if you do move to Israel later?",
        paragraphs: [
          "Nothing about the number has to change, and nothing expires if you never go. If you do move, the same number stops being inbox-only and becomes an ordinary Israeli mobile line — put the eSIM on your phone and it makes calls, sends texts and uses data on the local network, keeping the number every one of your accounts already knows.",
          "You can leave SMS-to-email switched on after you land if you like — plenty of people do, because having a written copy of every code in their inbox is useful in itself. Or switch it off from your account at any point. If you're arriving for a gap year or a program, [get the eSIM installed before the flight](/guides/israeli-phone-number-before-you-land) so the line is live the moment you touch down.",
        ],
      },
      {
        heading: "How do you set it up?",
        paragraphs: [
          "The whole thing is done online, from wherever you are. You'll need a name, an email, and a regular US, UK, or Canadian card — no Israeli ID, no Israeli bank account, and no Hebrew paperwork.",
        ],
        steps: [
          "Pick a plan at [bitlink.co.il/plans](/plans) and check out in dollars. No Israeli ID or bank account is required.",
          "You'll get a real Israeli mobile number, registered in your name.",
          "In your BitLink account, switch on SMS-to-email and enter the address you want the texts delivered to.",
          "Give that Israeli number to your bank, to WhatsApp, or to whichever service needs it, and verify as normal — the code arrives in your inbox.",
          "When you land in Israel, install the eSIM (or insert the SIM) and the same number starts working as a normal phone line.",
        ],
      },
    ],
    faq: [
      {
        question: "Can I get an Israeli phone number while living abroad?",
        answer:
          "Yes. You can buy a real Israeli mobile number online from outside Israel with no Israeli ID or bank account, and have its incoming texts delivered to your email until you arrive in the country.",
      },
      {
        question: "Will an Israeli bank accept this number for verification?",
        answer:
          "It's a real mobile line on Partner's network rather than a VoIP or virtual number, so it isn't caught by the checks that reject virtual numbers for two-factor authentication. Individual institutions set their own rules, so test it with a low-stakes login before relying on it for anything critical.",
      },
      {
        question: "Can I use it to register WhatsApp?",
        answer:
          "Yes. WhatsApp sends a registration code by SMS, and that code reaches you by email through the forwarder, so you can complete registration from anywhere.",
      },
      {
        question: "Does the number work as a phone while I'm abroad?",
        answer:
          "No. BitLink lines do not roam outside Israel, so no calls, no outgoing texts. Until you land, it delivers incoming SMS to your email and nothing more. Once you're in Israel it works as a normal mobile line.",
      },
      {
        question: "Is this a virtual number?",
        answer:
          "No. It's a genuine Israeli mobile number on Israel's Partner network, with a SIM behind it and registered in your name — not a VoIP or online number.",
      },
      {
        question: "Does the number change when I move to Israel?",
        answer:
          "No. It stays exactly the same, so every account you registered with it while abroad keeps working. You just start using it as a normal phone.",
      },
    ],
    relatedLinks: [
      { href: "/guides/israeli-phone-number-for-banking-bit-pango", label: "Why banks, Bit & Pango need an Israeli number" },
      { href: "/guides/israeli-phone-number-before-you-land", label: "Get an Israeli number before you land" },
      { href: "/guides/us-phone-number-before-aliyah", label: "Your US number before aliyah" },
      { href: "/israeli-phone-plans-for-olim", label: "Plans for olim" },
    ],
  },
  {
    slug: "travel-esim-or-phone-plan-israel",
    title: "Travel eSIM or phone plan — which do I need for Israel?",
    metaTitle: "Travel eSIM or Phone Plan for Israel?",
    metaDescription:
      "A travel eSIM is a package with an expiry date. A phone plan is a line you keep. Which one you need comes down to how long you're staying.",
    datePublished: "2026-08-23",
    dateModified: "2026-08-23",
    readingTime: "6 min read",
    intro:
      "These look like the same product and they aren't. A travel eSIM is a package: a set amount of data, valid for a set number of days, after which it stops. A phone plan is a line: an ongoing service with a number that stays yours. For a week in Israel the package is usually the better buy, and this guide will say so plainly. For a year, it's the wrong shape of product — and the reason has nothing to do with speed or coverage.",
    sections: [
      {
        heading: "What's actually the difference?",
        paragraphs: [
          "A travel eSIM is sold the way a ticket is sold. You buy 5GB valid for 15 days, or 10GB valid for 30, and when the days run out the package is finished. To carry on, you buy another one. It's designed for a trip with an end date, and for that it works well.",
          "A phone plan is sold the way a utility is sold. It renews monthly, the number is registered to you, and it carries on until you stop it. There's no expiry to manage and nothing to rebuy. That difference sounds administrative, but it's the thing that decides which one suits you.",
        ],
      },
      {
        heading: "When is a travel eSIM the right answer?",
        paragraphs: [
          "Often, and we'd rather say so than pretend otherwise. If you're in Israel for a week or two, you mostly need maps, WhatsApp and a bit of browsing, and you're keeping your home number switched on for anything important, a travel eSIM is cheaper, faster to buy, and completely adequate. Paying for a monthly plan you'll use for nine days makes no sense.",
          "The same is true for a second trip later in the year, or for a parent visiting for two weeks. Short and self-contained is exactly the shape a package is built for.",
        ],
      },
      {
        heading: "So what changes when you're staying longer?",
        paragraphs: [
          "Two things, and the first one is the one people don't see coming. A package has an end date, and Israeli life attaches itself to your phone number faster than you'd expect. Within a fortnight your number is sitting inside your bank's records, your Bit account, gov.il, the program's WhatsApp group, the pharmacy, and the courier who texts before delivering. All of that is anchored to one number.",
          "So the question to ask before buying any package for a long stay is a simple one: when this expires and I buy the next one, do I keep the same number? Ask it explicitly, because if the answer is no, then everything tied to that number comes loose every time you renew — and you'll be re-verifying your bank instead of getting on with your year.",
          "The second thing is arithmetic. Ten months of rebuying a thirty-day package is ten purchases, ten expiry dates to remember, and ten opportunities to be without service because you forgot. A plan renews on its own.",
        ],
      },
      {
        heading: "Don't some travel eSIMs include an Israeli number now?",
        paragraphs: [
          "Yes, and it's worth knowing. The category has moved: alongside the data-only packages, several travel eSIMs now sell Israel bundles that include a real +972 number with calls and texts. If you'd assumed a travel eSIM can never give you an Israeli number, that's out of date.",
          "What tends to stay thin is the talk time. Voice bundles on packages are usually measured in tens or low hundreds of minutes for the month — fine for the occasional call, tight if you actually use your phone as a phone. For comparison, [BitLink's Basic plan](/plans) includes 1,000 minutes and 500 texts at $14.99 a month, and Student 5G includes 5,000 minutes with 50GB of data. Whether that matters depends entirely on whether you make calls.",
        ],
      },
      {
        heading: "How do the costs actually compare?",
        paragraphs: [
          "For light data over a short window, packages usually win on headline price, and for a two-week trip they win comfortably. Across a full year the comparison narrows and then flips, because you're buying twelve of something rather than one of something — and at the larger data sizes a monthly plan tends to be better value than the equivalent package.",
          "The honest summary: if you're deciding between $12 for a fortnight and $14.99 for a month you'll barely use, buy the package. If you're deciding how to be connected from Elul to June, compare the whole year, not the first purchase.",
        ],
        table: {
          columns: ["What you need", "Travel eSIM package", "Phone plan"],
          rows: [
            { cells: ["A week or two in Israel", "Yes — cheaper and simpler", "Overkill"] },
            { cells: ["Data only, keeping your home number", "Yes", "Not necessary"] },
            { cells: ["A number that lasts the whole year", "Ask whether it survives renewal", "Yes, it's yours"], highlight: true },
            { cells: ["Real talk time", "Usually thin", "1,000–5,000 minutes"] },
            { cells: ["Bank, Bit, gov.il, deliveries", "Only with a number bundle", "Yes"] },
            { cells: ["Nothing to remember or rebuy", "Expires; repurchase each time", "Renews on its own"] },
          ],
          note:
            "Neither column is the right answer on its own — the row you're in decides it. Short and self-contained favours a package; long and anchored to Israeli services favours a plan.",
        },
      },
      {
        heading: "What else comes with a plan rather than a package?",
        paragraphs: [
          "The things you only need occasionally, but badly when you do. A plan can be paused rather than cancelled if you go home for the summer and want the number waiting for you. You can [add a US, Canadian or UK number](/us-number-in-israel) so family dial a local number that rings your phone in Israel. You can port the number out to another Israeli carrier whenever you like, because it's registered to you. And you can top up mid-month instead of watching a package die.",
          "There's also somebody to ask. A package is a self-serve product by design, which is fine until the eSIM won't install at 11pm on your first night. With BitLink there's a person on WhatsApp who answers when you need them — that's the service, not a safety net.",
        ],
      },
      {
        heading: "So which should you buy?",
        paragraphs: [
          "Two weeks or less, data-led, home number staying on: buy the travel eSIM. It's the cheaper, simpler, correct answer, and you don't need a plan.",
          "A gap year, a semester, aliyah, a work posting, or anything where Israeli services will end up knowing your number: buy the plan. Not because packages are bad, but because you're not taking a trip — you're living somewhere, and living somewhere wants a phone line rather than a ticket with an expiry date. If that's you, [the student and olim plans](/israeli-phone-plans-for-students) are built for exactly that, and [setting the eSIM up before you fly](/guides/israeli-phone-number-before-you-land) means you land already connected.",
        ],
      },
    ],
    faq: [
      {
        question: "Is a travel eSIM enough for a gap year in Israel?",
        answer:
          "Usually not. Packages expire and have to be repurchased, and the number they give you may not survive that — which matters once your bank, Bit and gov.il know it. For a stay measured in months, a monthly plan is the better shape of product.",
      },
      {
        question: "Do travel eSIMs give you an Israeli phone number?",
        answer:
          "Some do now. Alongside data-only packages, several sell Israel bundles including a real +972 number with calls and texts. Check the specific package — and check whether you keep that number when you renew.",
      },
      {
        question: "Is a travel eSIM cheaper than a phone plan?",
        answer:
          "For a short trip, usually yes, and noticeably so. Across a whole year the comparison narrows and often reverses, because you're buying a package repeatedly rather than paying once a month. Compare the year, not the first purchase.",
      },
      {
        question: "What happens to my number when a travel eSIM package expires?",
        answer:
          "That depends on the provider, which is exactly why it's worth asking before you buy for a long stay. If the number doesn't carry over, every Israeli account tied to it needs re-verifying each time you renew.",
      },
      {
        question: "Can I start with a travel eSIM and switch to a plan later?",
        answer:
          "Yes, and plenty of people do — they land on a package and move to a plan once they realise how much of Israeli life runs through an Israeli number. The only cost is that anything already registered to the old number has to be updated.",
      },
    ],
    relatedLinks: [
      { href: "/guides/esim-israel", label: "How to set up an eSIM in Israel" },
      { href: "/guides/israeli-phone-number-before-you-land", label: "Get an Israeli number before you land" },
      { href: "/guides/israeli-phone-number-for-banking-bit-pango", label: "Why banks and Bit need an Israeli number" },
      { href: "/israel-esim", label: "Israel eSIM with a real Israeli number" },
    ],
  },
];

export function getGuide(slug: string) {
  return guides.find((guide) => guide.slug === slug);
}
