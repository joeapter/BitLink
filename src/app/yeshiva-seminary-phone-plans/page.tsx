import type { Metadata } from "next";
import { ServiceLandingPage } from "@/components/marketing/ServiceLandingPage";
import { landingPages } from "@/lib/public-content";
import { createPageMetadata, faqPageJsonLd, jsonLdScriptProps, servicePageJsonLd } from "@/lib/seo";

const content = landingPages.yeshivaPlans;

export const metadata: Metadata = createPageMetadata({
  title: content.metaTitle,
  description: content.metaDescription,
  path: content.slug,
});

export default function YeshivaSeminaryPlansPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(servicePageJsonLd(content))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(faqPageJsonLd(content.qaBlocks))} />
      <ServiceLandingPage content={content} />
    </>
  );
}
