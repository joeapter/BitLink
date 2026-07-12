import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Globe2, PhoneCall, Signal } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { TextWithLinks } from "@/components/ui/TextWithLinks";
import { getPlan, usCanadaNumberAddOn } from "@/lib/plans";
import {
  breadcrumbJsonLd,
  canonicalUrl,
  createPageMetadata,
  faqPageJsonLd,
  jsonLdScriptProps,
  organizationId,
} from "@/lib/seo";
import { formatMoney } from "@/lib/utils";

const pagePath = "/aliyah";
const workPlan = getPlan("max-5g");

export const metadata: Metadata = createPageMetadata({
  title: "Aliyah Phone Service — Israeli Number + US Line",
  description:
    "Israeli phone service ready when you land: work-ready data, guided activation, and a US, Canadian, or UK number add-on so home can still reach you.",
  path: pagePath,
  image: {
    url: "/assets/bitlink-telecom-hero-v2.jpg",
    width: 1672,
    height: 941,
    alt: "BitLink phone service connecting to Israel.",
  },
});

const aliyahPageJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Aliyah", path: pagePath },
    ]),
    {
      "@type": "Service",
      "@id": `${canonicalUrl(pagePath)}#service`,
      name: "BitLink Aliyah phone service",
      description:
        "Israeli phone service for people making Aliyah, with local service, guided activation, work-ready data, and optional US, Canadian, or UK local numbers.",
      serviceType: "Mobile telecommunications service",
      url: canonicalUrl(pagePath),
      provider: {
        "@id": organizationId,
      },
      areaServed: {
        "@type": "Country",
        name: "Israel",
      },
    },
  ],
};

const aliyahFaqItems = [
  {
    question: "Can I set up my Israeli phone before my aliyah flight?",
    answer:
      "Yes — and it's worth doing. Checkout is online, and on an eSIM-compatible phone the activation QR code arrives by email within minutes of payment, so your Israeli number can be live before you board. That matters on arrival day: Misrad HaPnim paperwork, the bank, and your first deliveries all assume a working Israeli mobile number. If you'd rather have a physical SIM, [support](/support) can help you time it around your landing date.",
  },
  {
    question: "Can I keep my US, UK, or Canadian number when I make aliyah?",
    answer:
      "Yes, two ways. You can [port your existing number to BitLink](/keep-your-number) for a one-time $49.99 — it takes up to 3 business days and your old number keeps working until the switch completes. Or you can keep things simple and add a [new US, Canadian, or UK local number](/us-number-in-israel) to your plan for $9.99/month, so family and clients dial a local number that rings your phone in Israel. Many olim do both: port the number everyone knows, and drop the old US plan entirely.",
  },
  {
    question: "What does phone service cost after aliyah?",
    answer:
      "BitLink plans run $14.99–$39.99 per month in USD with VAT included and no long-term contract. [Max 5G](/plans/max-5g) at $39.99/month is the one built for the first year of aliyah — 120GB of data plus 150 minutes of calling to US and Canadian numbers included, for staying close to family while everything else is new. There are no setup surprises: each plan's full contract is published on its page before you pay.",
  },
  {
    question: "Is an airport SIM good enough for my first weeks?",
    answer:
      "It'll work that day — the risk comes later. Kiosk SIMs are frequently registered to the seller, not to you, which means the number often can't be ported to a permanent plan, and idle prepaid numbers expire within months. Meanwhile your bank, Misrad HaPnim, and Kupat Cholim will all be keyed to that number from week one. Better order of operations: land with a number you own — no Teudat Zehut or passport needed to [sign up with BitLink](/plans), and it's live before your flight. [The airport SIM trap](/guides/airport-sim-trap-israel) explains the whole issue.",
  },
];

const essentials = [
  {
    icon: PhoneCall,
    title: "Connected when you land",
    body: "Your first days move quickly. Have an Israeli number ready for apartment calls, deliveries, banking, schools, and everything that starts locally.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Keep work moving",
    body: "Stay available for client calls, messages, meetings, maps, and the everyday work that cannot wait for a telecom setup to catch up.",
  },
  {
    icon: Globe2,
    title: "A local number for callers back home",
    body: "Add a US, Canadian, or UK local number alongside your Israeli line, so clients and family have a local way to reach you after you arrive.",
  },
];

export default function AliyahPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(aliyahPageJsonLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(faqPageJsonLd(aliyahFaqItems))} />

      <main className="bg-white">
        <section className="relative isolate min-h-[42rem] overflow-hidden border-b border-ink/10 bg-[#eef5f8] px-4 py-20 sm:px-6 sm:py-28 lg:min-h-[44rem] lg:px-8">
          <Image
            src="/assets/bitlink-telecom-hero-v2.jpg"
            alt="BitLink phone service connecting to Israel."
            fill
            priority
            sizes="100vw"
            className="object-cover object-[68%_center] lg:object-center"
          />
          <div className="absolute inset-0 bg-white/35" aria-hidden="true" />

          <div className="relative mx-auto max-w-7xl">
            <div className="max-w-2xl pt-4 lg:pt-14">
              <p className="text-sm font-semibold text-link-blue">BitLink for Aliyah</p>
              <h1 className="mt-3 text-balance text-5xl font-semibold tracking-normal text-ink sm:text-6xl">
                Your phone works when you land. Your work does too.
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-700">
                BitLink phone plans for aliyah run $14.99–$39.99/month in USD, VAT included, with a real Israeli number on every plan. Max 5G at $39.99/month is built for the first year: 120GB of 5G data plus 150 minutes of calling to US and Canadian numbers included, and a US, Canadian, or UK local number can be added to any plan for $9.99/month so family back home can call you locally. Activation is by eSIM — usually live within minutes of checkout, often before you board — or by physical SIM.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href={`/plans/${workPlan.slug}`} size="lg">
                  Choose a work-ready plan
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href="/support" variant="secondary" size="lg">
                  Talk through your setup
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.72fr_1fr]">
            <div>
              <p className="text-sm font-semibold text-link-blue">Aliyah phone questions</p>
              <h2 className="mt-3 text-balance text-4xl font-semibold tracking-normal text-ink">
                The questions every oleh asks.
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-slate">
                More detail on porting, plans, and setup lives in the olim guide and FAQ.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/israeli-phone-plans-for-olim" variant="secondary">
                  Olim plan guide
                </ButtonLink>
                <ButtonLink href="/faq" variant="ghost">
                  Full FAQ
                </ButtonLink>
              </div>
            </div>
            <div className="divide-y divide-ink/8 rounded-lg border border-ink/10 bg-white shadow-soft">
              {aliyahFaqItems.map((item) => (
                <article key={item.question} className="p-6 sm:p-7">
                  <h3 className="text-lg font-semibold tracking-normal text-ink">{item.question}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-slate">
                    <TextWithLinks text={item.answer} />
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-link-blue">No arrival downtime</p>
              <h2 className="mt-3 text-balance text-4xl font-semibold tracking-normal text-ink">
                Your first week in Israel should not come with a communication gap.
              </h2>
            </div>

            <div className="mt-10 grid border-y border-ink/10 md:grid-cols-3">
              {essentials.map((item, index) => (
                <div
                  key={item.title}
                  className={`py-8 md:px-8 ${index > 0 ? "border-t border-ink/10 md:border-l md:border-t-0" : ""}`}
                >
                  <item.icon className="h-5 w-5 text-link-blue" aria-hidden="true" />
                  <h3 className="mt-5 text-xl font-semibold tracking-normal text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-slate">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#eef5f8] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
            <div className="max-w-xl">
              <p className="text-sm font-semibold text-link-blue">A local number for callers back home</p>
              <h2 className="mt-3 text-balance text-4xl font-semibold tracking-normal text-ink">
                Clients and family can call a local number. You answer from Israel.
              </h2>
              <p className="mt-5 text-base leading-7 text-muted-slate sm:text-lg sm:leading-8">
                Add a US, Canadian, or UK local number alongside your Israeli line. It gives the people calling from home a local way to reach you, without asking them to dial Israel or navigate an international calling setup.
              </p>
              <p className="mt-5 text-3xl font-semibold text-ink">
                {formatMoney(usCanadaNumberAddOn.priceCents, usCanadaNumberAddOn.currency)}
                <span className="text-base font-medium text-muted-slate">/mo add-on</span>
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href={`/plans/${workPlan.slug}`} variant="secondary">
                  View eligible plans
                </ButtonLink>
                <ButtonLink href="/support" variant="ghost">
                  Ask about your number
                </ButtonLink>
              </div>
            </div>

            <dl className="grid border-y border-ink/10 sm:grid-cols-2">
              {[
                ["Israeli service", "Local number and monthly plan"],
                ["Local reachability", "US, Canada, or UK add-on"],
                ["Client calls", "A local number to reach you"],
                ["Activation", "Guided eSIM or physical SIM setup"],
              ].map(([label, value], index) => (
                <div
                  key={label}
                  className={`p-6 ${index > 1 ? "border-t border-ink/10" : ""} ${index % 2 === 1 ? "sm:border-l sm:border-ink/10" : ""}`}
                >
                  <dt className="text-sm font-semibold text-muted-slate">{label}</dt>
                  <dd className="mt-2 text-xl font-semibold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-link-blue">For a work-heavy first month</p>
              <h2 className="mt-3 max-w-xl text-balance text-4xl font-semibold tracking-normal text-ink">
                Data and calling capacity that does not slow down your day.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-slate sm:text-lg sm:leading-8">
                Max 5G is the higher-data choice for people who are working, navigating, calling home, and building a new routine at the same time.
              </p>
              <p className="mt-5 text-3xl font-semibold text-ink">
                {formatMoney(workPlan.priceCents, workPlan.currency)}
                <span className="text-base font-medium text-muted-slate">/mo</span>
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href={`/plans/${workPlan.slug}`} variant="secondary">
                  See Max 5G details
                </ButtonLink>
                <Link href="/israeli-phone-plans-for-olim" className="inline-flex items-center gap-2 self-start text-sm font-semibold text-link-blue transition hover:text-ink">
                  Read the olim phone plan guide
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="grid border-y border-ink/10 sm:grid-cols-2">
              {[
                ["Data", workPlan.comparison.data],
                ["Local calls", workPlan.comparison.calls],
                ["Texts", workPlan.comparison.texts],
                ["International calling", "150 min to US and Canada"],
              ].map(([label, value], index) => (
                <div
                  key={label}
                  className={`p-6 ${index > 1 ? "border-t border-ink/10" : ""} ${index % 2 === 1 ? "sm:border-l sm:border-ink/10" : ""}`}
                >
                  <p className="text-sm font-semibold text-muted-slate">{label}</p>
                  <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-ink px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <Signal className="h-6 w-6 text-soft-cyan" aria-hidden="true" />
              <h2 className="mt-5 text-balance text-3xl font-semibold tracking-normal sm:text-4xl">
                Move countries without going offline.
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
                Choose the plan that matches your work and home life, keep the details visible before checkout, and arrive ready to answer the next call.
              </p>
            </div>
            <ButtonLink href="/plans" variant="dark" size="lg">
              Choose a plan
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        </section>
      </main>
    </>
  );
}
