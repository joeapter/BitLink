import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { TextWithLinks } from "@/components/ui/TextWithLinks";
import { DeviceCompatibilityChecker } from "@/components/guides/DeviceCompatibilityChecker";
import { getGuide, guides } from "@/lib/guides";
import {
  breadcrumbJsonLd,
  canonicalUrl,
  createPageMetadata,
  faqPageJsonLd,
  jsonLdScriptProps,
  organizationId,
  stripInlineLinks,
} from "@/lib/seo";

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Guide" };
  return createPageMetadata({
    title: guide.metaTitle,
    description: guide.metaDescription,
    path: `/guides/${guide.slug}`,
  });
}

function guideJsonLd(guide: NonNullable<ReturnType<typeof getGuide>>) {
  const path = `/guides/${guide.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Guides", path: "/guides" },
        { name: guide.title, path },
      ]),
      {
        "@type": "Article",
        "@id": `${canonicalUrl(path)}#article`,
        headline: guide.title,
        description: guide.metaDescription,
        url: canonicalUrl(path),
        datePublished: guide.datePublished,
        dateModified: guide.dateModified,
        inLanguage: "en",
        author: {
          "@id": organizationId,
        },
        publisher: {
          "@id": organizationId,
        },
        articleBody: stripInlineLinks(
          [
            guide.intro,
            ...guide.sections.flatMap((section) => [...section.paragraphs, ...(section.steps ?? [])]),
          ].join("\n\n"),
        ),
      },
    ],
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(guideJsonLd(guide))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(faqPageJsonLd(guide.faq))} />

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#eef5f8_100%)] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-soft-cyan/20 blur-3xl" />
        <div className="relative mx-auto max-w-3xl">
          <Breadcrumbs items={[{ label: "Guides", href: "/guides" }, { label: guide.metaTitle }]} />
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-slate">
            Published {formatDate(guide.datePublished)}
            {guide.dateModified !== guide.datePublished ? ` · Updated ${formatDate(guide.dateModified)}` : ""} ·{" "}
            {guide.readingTime}
          </p>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
            {guide.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-slate">
            <TextWithLinks text={guide.intro} />
          </p>
        </div>
      </section>

      <article className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {guide.sections.map((section) => (
            <section key={section.heading} className="mb-12">
              <h2 className="text-balance text-2xl font-semibold tracking-normal text-ink sm:text-3xl">
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph, index) => (
                <p key={index} className="mt-4 text-base leading-7 text-muted-slate sm:leading-8">
                  <TextWithLinks text={paragraph} />
                </p>
              ))}
              {section.table ? (
                <>
                  <div className="mt-5 overflow-x-auto rounded-xl border border-ink/10">
                    <table className="w-full min-w-140 text-left text-sm">
                      <thead>
                        <tr className="bg-[#f8fbfc]">
                          {section.table.columns.map((column) => (
                            <th key={column} scope="col" className="p-4 font-semibold text-ink">
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink/8">
                        {section.table.rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className={row.highlight ? "bg-soft-cyan/15 align-top" : "align-top"}>
                            {row.cells.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className={`p-4 leading-6 ${
                                  cellIndex === 0 || row.highlight ? "font-semibold text-ink" : "text-muted-slate"
                                }`}
                              >
                                <TextWithLinks text={cell} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {section.table.note ? <p className="mt-3 text-xs text-slate-400">{section.table.note}</p> : null}
                </>
              ) : null}
              {section.steps?.length ? (
                <ol className="mt-4 grid gap-3">
                  {section.steps.map((step, index) => (
                    <li key={index} className="flex gap-3 text-base leading-7 text-muted-slate">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-white">
                        {index + 1}
                      </span>
                      <span className="min-w-0">
                        <TextWithLinks text={step} />
                      </span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </section>
          ))}

          {guide.deviceCompatibility ? (
            <section className="mb-12">
              <h2 className="text-balance text-2xl font-semibold tracking-normal text-ink sm:text-3xl">
                Phones that support eSIM
              </h2>
              <div className="mt-5 overflow-hidden rounded-xl border border-ink/10">
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-ink/8">
                    {guide.deviceCompatibility.groups.map((group) => (
                      <tr key={group.brand} className="align-top">
                        <th scope="row" className="w-40 bg-[#f8fbfc] p-4 font-semibold text-ink">
                          {group.brand}
                        </th>
                        <td className="p-4 text-muted-slate">
                          <p className="leading-6 text-ink">{group.models}</p>
                          {group.caveat ? <p className="mt-1.5 text-xs leading-5 text-slate-500">{group.caveat}</p> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-slate-400">{guide.deviceCompatibility.updatedNote}</p>
              <div className="mt-6">
                <DeviceCompatibilityChecker />
              </div>
            </section>
          ) : null}

          <section className="mb-12 rounded-lg border border-ink/10 bg-[#f8fbfc] p-7 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-normal text-ink">Quick answers</h2>
            <div className="mt-4 divide-y divide-ink/8">
              {guide.faq.map((item) => (
                <div key={item.question} className="py-5 first:pt-0 last:pb-0">
                  <h3 className="text-lg font-semibold text-ink">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-slate">
                    <TextWithLinks text={item.answer} />
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap gap-4 text-sm font-semibold text-link-blue">
            {guide.relatedLinks.map((link) => (
              <Link key={link.href} href={link.href} className="inline-flex items-center gap-2 transition hover:text-ink">
                {link.label}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </article>

      <section className="bg-ink px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-balance text-2xl font-semibold tracking-normal sm:text-3xl">
              Ready to set up your Israeli number?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Monthly plans from $14.99, VAT included, no contract — with real people on WhatsApp if you get stuck.
            </p>
          </div>
          <ButtonLink href="/plans" variant="dark" size="lg" className="shrink-0">
            See the plans
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
