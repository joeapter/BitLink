import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { guides } from "@/lib/guides";
import { breadcrumbJsonLd, canonicalUrl, createPageMetadata, jsonLdScriptProps } from "@/lib/seo";

const pagePath = "/guides";

export const metadata: Metadata = createPageMetadata({
  title: "Guides — Israeli Phone Service, Explained",
  description:
    "Practical guides for English speakers sorting out phone service in Israel: pre-arrival eSIM setup, why banks and Bit need an Israeli number, porting, and more.",
  path: pagePath,
});

const guidesJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Guides", path: pagePath },
    ]),
    {
      "@type": "ItemList",
      "@id": `${canonicalUrl(pagePath)}#guides`,
      name: "BitLink guides",
      itemListElement: guides.map((guide, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: canonicalUrl(`/guides/${guide.slug}`),
        name: guide.title,
      })),
    },
  ],
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function GuidesPage() {
  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(guidesJsonLd)} />

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#eef5f8_100%)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-soft-cyan/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <Breadcrumbs items={[{ label: "Guides" }]} />
          <p className="text-sm font-semibold text-link-blue">BitLink guides</p>
          <h1 className="mt-3 max-w-4xl text-balance text-5xl font-semibold tracking-normal text-ink sm:text-6xl">
            Israeli phone service, explained properly.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-slate">
            Practical, honest walkthroughs of the phone decisions every English speaker in Israel runs into — written
            to answer the question, not to fill a page.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="group flex flex-col rounded-lg border border-ink/10 bg-[#f8fbfc] p-7 transition hover:border-link-blue/30 hover:bg-white hover:shadow-soft"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-slate">
                {formatDate(guide.datePublished)} · {guide.readingTime}
              </p>
              <h2 className="mt-3 text-balance text-2xl font-semibold tracking-normal text-ink">{guide.title}</h2>
              <p className="mt-3 flex-1 text-sm leading-6 text-muted-slate">{guide.metaDescription}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-link-blue">
                Read the guide
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
