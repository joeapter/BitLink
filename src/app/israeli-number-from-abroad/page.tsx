import type { Metadata } from "next";
import { ServiceLandingPage } from "@/components/marketing/ServiceLandingPage";
import { landingPages } from "@/lib/public-content";
import { createPageMetadata, faqPageJsonLd, jsonLdScriptProps, servicePageJsonLd } from "@/lib/seo";

// Deliberately absent from the site navigation. This serves a secondary
// audience — people with Israeli ties living permanently abroad — whose needs
// don't overlap with the arriving-in-Israel customer the rest of the site talks
// to, and putting it in the menu would confuse both. It is fully indexable
// though: the guides that feed it can only pass authority to a page search
// engines are allowed to rank, and search is where this audience comes from.
const content = landingPages.israeliNumberFromAbroad;

export const metadata: Metadata = createPageMetadata({
  title: content.metaTitle,
  description: content.metaDescription,
  path: content.slug,
});

export default function IsraeliNumberFromAbroadPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(servicePageJsonLd(content))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(faqPageJsonLd(content.qaBlocks))} />
      <ServiceLandingPage content={content} />
    </>
  );
}
