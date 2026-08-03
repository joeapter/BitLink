import type { Metadata } from "next";
import { ServiceLandingPage } from "@/components/marketing/ServiceLandingPage";
import { TrialOfferPromo } from "@/components/marketing/TrialOfferPromo";
import { landingPages } from "@/lib/public-content";
import { createPageMetadata, faqPageJsonLd, jsonLdScriptProps, servicePageJsonLd } from "@/lib/seo";

const content = landingPages.olimPlans;

export const metadata: Metadata = createPageMetadata({
  title: content.metaTitle,
  description: content.metaDescription,
  path: content.slug,
});

export default function OlimPhonePlansPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(servicePageJsonLd(content))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(faqPageJsonLd(content.qaBlocks))} />
      <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6 lg:px-8">
        <TrialOfferPromo />
      </div>
      <ServiceLandingPage content={content} />
    </>
  );
}
