import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Headphones, MapPin, Smartphone, UsersRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { getPlan } from "@/lib/plans";
import { breadcrumbJsonLd, canonicalUrl, createPageMetadata, jsonLdScriptProps, organizationId } from "@/lib/seo";
import { formatMoney } from "@/lib/utils";

const pagePath = "/students";
const studentPlan = getPlan("student-5g");

const referralImage = {
  url: "/assets/Bit%20Link%20Refferal%20image.png",
  width: 1122,
  height: 1402,
  alt: "BitLink referral offer showing 5GB of monthly data per linked friend, up to 25GB per month.",
};

export const metadata: Metadata = createPageMetadata({
  title: "BitLink for Students",
  description:
    "Israeli phone service for students who want to land connected, stay in the group chat, and keep their semester moving with BitLink.",
  path: pagePath,
  image: referralImage,
});

const studentPageJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Students", path: pagePath },
    ]),
    {
      "@type": "Service",
      "@id": `${canonicalUrl(pagePath)}#service`,
      name: "BitLink student phone service",
      description:
        "Israeli phone service for students, with local numbers, generous data, guided activation, and practical human support.",
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

const essentials = [
  {
    icon: Smartphone,
    title: "Connected when you land",
    body: "Have an Israeli number ready for rides, campus groups, deliveries, new roommates, and the plans that start the minute you arrive.",
  },
  {
    icon: MapPin,
    title: "Data for real student life",
    body: "Keep maps, group chats, music, video calls, and a full social calendar moving without treating data like a daily emergency.",
  },
  {
    icon: Headphones,
    title: "Help that gets you moving",
    body: "If activation needs a hand, reach someone who can sort out the practical details and get you back to what you were doing.",
  },
];

export default function StudentsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(studentPageJsonLd)} />

      <main className="bg-white">
        <section className="border-b border-ink/10 bg-[#f8fbfc] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-semibold text-link-blue">BitLink for students</p>
            <h1 className="mt-3 max-w-4xl text-balance text-5xl font-semibold tracking-normal text-ink sm:text-6xl">
              Your phone works when you land.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-slate">
              Land, meet people, find your way around, and stay in the loop from day one. BitLink gives students an Israeli number, enough data for the way you actually live, and a plan that is ready to keep up.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={`/plans/${studentPlan.slug}`} size="lg">
                Start with Student 5G
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="/support" variant="secondary" size="lg">
                Ask a question first
              </ButtonLink>
            </div>

            <div className="mt-16 grid border-y border-ink/10 sm:grid-cols-3">
              {essentials.map((item, index) => (
                <div
                  key={item.title}
                  className={`py-8 sm:px-8 ${index > 0 ? "border-t border-ink/10 sm:border-l sm:border-t-0" : ""}`}
                >
                  <item.icon className="h-5 w-5 text-link-blue" aria-hidden="true" />
                  <h2 className="mt-5 text-xl font-semibold tracking-normal text-ink">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-slate">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-link-blue">Start with the plan most students choose</p>
              <h2 className="mt-3 max-w-xl text-balance text-4xl font-semibold tracking-normal text-ink">
                More than enough data to keep student life in full swing.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-slate sm:text-lg sm:leading-8">
                Student 5G is built for everyday use: a local number, generous data, local calls and texts, and the option to make it easier for family back home to reach you.
              </p>
              <p className="mt-5 text-3xl font-semibold text-ink">
                {formatMoney(studentPlan.priceCents, studentPlan.currency)}
                <span className="text-base font-medium text-muted-slate">/mo</span>
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href={`/plans/${studentPlan.slug}`} variant="secondary">
                  See Student 5G details
                </ButtonLink>
                <Link href="/israeli-phone-plans-for-students" className="inline-flex items-center gap-2 self-start text-sm font-semibold text-link-blue transition hover:text-ink">
                  Read the student plan guide
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <dl className="grid border-y border-ink/10 sm:grid-cols-2">
              {[
                ["Data", studentPlan.comparison.data],
                ["Local calls", studentPlan.comparison.calls],
                ["Texts", studentPlan.comparison.texts],
                ["Activation", "eSIM or physical SIM"],
              ].map(([label, value], index) => (
                <div
                  key={label}
                  className={`p-6 ${index > 1 ? "border-t border-ink/10" : ""} ${index % 2 === 1 ? "sm:border-l sm:border-ink/10" : ""}`}
                >
                  <dt className="text-sm font-semibold text-muted-slate">{label}</dt>
                  <dd className="mt-2 text-2xl font-semibold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="bg-[#eef5f8] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div className="max-w-xl">
              <p className="text-sm font-semibold text-link-blue">Better together</p>
              <h2 className="mt-3 text-balance text-4xl font-semibold tracking-normal text-ink">
                Bring your people into the loop.
              </h2>
              <p className="mt-5 text-base leading-7 text-muted-slate sm:text-lg sm:leading-8">
                When friends need the same setup, BitLink makes the referral side simple. Share the service, stay connected together, and keep the current referral offer clear from the start.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/refer" variant="secondary">
                  Explore referrals
                  <UsersRound className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href="/plans" variant="ghost">
                  Compare all plans
                </ButtonLink>
              </div>
            </div>

            <figure className="mx-auto w-full max-w-[35rem]">
              <Image
                src={referralImage.url}
                alt={referralImage.alt}
                width={referralImage.width}
                height={referralImage.height}
                sizes="(max-width: 1024px) min(100vw - 3rem, 35rem), 35rem"
                className="h-auto w-full rounded-lg shadow-soft"
              />
              <figcaption className="mt-4 text-center text-xs leading-5 text-muted-slate">
                Referral data is subject to eligibility and the referral terms shown at the time of signup.
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="bg-ink px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <CheckCircle2 className="h-6 w-6 text-soft-cyan" aria-hidden="true" />
              <h2 className="mt-5 text-balance text-3xl font-semibold tracking-normal sm:text-4xl">
                Land connected. Keep moving.
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
                Choose the plan that matches your phone use, see the details before checkout, and get the setup handled without missing a beat.
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
