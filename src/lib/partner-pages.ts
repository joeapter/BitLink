import type { LandingPageContent } from "@/lib/public-content";
import { partnerOrgCodes } from "@/lib/partner-org-codes";

// Partner (org) landing pages — one real, indexed page per partner
// institution, reusing the ServiceLandingPage template. Each page's URL
// carries the org's attribution via middleware (see partner-org-codes.ts),
// so a school shares bitlink.co.il/partners/<slug> instead of a ?org= link.
//
// Two rules for the copy:
// 1. Say nothing about the institution itself we haven't confirmed with them
//    (no location, program details, or phone-policy claims) — the page speaks
//    to their families about phones, not on the school's behalf.
// 2. Each page gets genuinely distinct copy — near-identical pages with
//    swapped names are doorway-page territory.

export type PartnerPage = {
  orgName: string;
  orgType: "yeshiva" | "seminary" | "shul" | "community";
  content: LandingPageContent;
};

export const partnerPages: Record<string, PartnerPage> = {
  "neveh-zion": {
    orgName: "Neveh Zion",
    orgType: "yeshiva",
    content: {
      slug: "/partners/neveh-zion",
      metaTitle: "Phone Plans for Neveh Zion Students",
      metaDescription:
        "BitLink is a phone partner for Neveh Zion families: plans from $14.99/month in USD, parents pay from abroad with no Israeli paperwork, English support, setup before the flight.",
      eyebrow: "BitLink × Neveh Zion",
      h1: "Phone service for Neveh Zion students, handled before the flight.",
      intro:
        "This is Neveh Zion's partner page with BitLink — signups from here are linked to the yeshiva through BitLink's partner program automatically, with no code to type. Plans run $14.99–$39.99/month in USD with VAT included, parents pay from the US, UK, or Canada with their own card (no Teudat Zehut, no Israeli paperwork), and on an eSIM-compatible phone the Israeli number is live before your son boards. Support is real people, in English, on WhatsApp.",
      primaryCta: {
        href: "/plans",
        label: "See the plans",
      },
      secondaryCta: {
        href: "/guides/yeshiva-seminary-phone-checklist",
        label: "Read the phone checklist",
      },
      highlights: [
        {
          title: "Set up from home, working on arrival",
          body: "Checkout is online and takes minutes. On an eSIM phone the Israeli number is active before the flight — your son lands reachable, no airport SIM counter.",
        },
        {
          title: "Parents stay in control",
          body: "The account, the billing, and support all work from abroad: USD prices, your own card, English WhatsApp support — without needing your son to relay messages.",
        },
        {
          title: "Signups support the yeshiva",
          body: "Lines opened through this page are tracked to Neveh Zion and supported through BitLink's partner program, at no cost to your family.",
        },
      ],
      details: [
        {
          title: "Check the phone policy for your son's year first",
          body: "Phone rules can differ by program and year. Confirm with the yeshiva office whether your son needs a certified kosher phone or may bring a smartphone — that decides the device and the plan, and it's worth knowing before buying either.",
        },
        {
          title: "Both paths are covered",
          body: "Kosher plans ($19.99–$24.99/month, voice-only, on lines recognized by Vaadat Harabanim L'inyanei Tikshoret) run on a physical SIM and need a certified kosher device. Standard plans (Student 5G at $34.99/month is the most common) activate by eSIM in minutes. Monthly terms either way — no long-term contract.",
        },
        {
          title: "Family can call without international rates",
          body: "A US or Canadian local number can be added to any plan — including kosher lines — for $9.99/month, so calling your son costs what a local call costs. Kosher+ and Max 5G also include 150 minutes of calling back to the US and Canada.",
        },
      ],
      qaBlocks: [
        {
          question: "How should my son get set up with a phone for Neveh Zion?",
          answer:
            "In this order: confirm the yeshiva's phone policy for his year (kosher device or smartphone), sort the device to match, then order the plan — about two weeks before the flight for a kosher physical SIM, or any time for an eSIM, which activates within minutes of checkout. The [full phone checklist](/guides/yeshiva-seminary-phone-checklist) walks through the timeline week by week. Ordering through this page links the signup to Neveh Zion automatically.",
        },
        {
          question: "Can I pay for the line from the US and manage it from home?",
          answer:
            "Yes — that's the normal setup for yeshiva families. Checkout is priced in US dollars with VAT included and takes a regular US, UK, or Canadian card; no Teudat Zehut or Israeli paperwork is involved. The account stays in your hands: billing, plan changes, and support all work from abroad, in English, by WhatsApp, phone, or email.",
        },
        {
          question: "Does signing up through this page cost my family anything extra?",
          answer:
            "No. Prices are identical everywhere on the site — $14.99–$39.99/month for standard plans, $19.99–$24.99/month for kosher plans. The only difference is attribution: lines opened from this page are tracked to Neveh Zion and supported through BitLink's partner program.",
        },
        {
          question: "What happens to the line after the year ends?",
          answer:
            "Whatever fits: plans are monthly with no commitment, so the line can simply be cancelled. If your son is coming back — next zman or a second year — the line can be paused for $10/month and the Israeli number stays his, with everything registered to it intact. And if he stays long-term and ever wants a different carrier, every BitLink line is left open for porting out, no blocks or fees.",
        },
      ],
      planSlugs: ["kosher-basic", "student-5g", "kosher-plus"],
      relatedLinks: [
        { href: "/guides/yeshiva-seminary-phone-checklist", label: "Student phone checklist" },
        { href: "/yeshiva-seminary-phone-plans", label: "Yeshiva & seminary plans" },
        { href: "/kosher-phone-plans-israel", label: "Kosher phone plans" },
      ],
      finalHeading: "Questions before you order?",
      finalBody:
        "Ask anything — device compatibility, the right plan for your son's year, or timing around the flight. A real person answers, in English.",
    },
  },
};

export function getPartnerPage(slug: string): PartnerPage | undefined {
  // Guard: every partner page must have a matching org code, or attribution
  // silently wouldn't work for it.
  return partnerOrgCodes[slug] ? partnerPages[slug] : undefined;
}
