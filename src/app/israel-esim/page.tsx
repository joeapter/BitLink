import type { Metadata } from "next";
import { ServiceLandingPage } from "@/components/marketing/ServiceLandingPage";
import { landingPages } from "@/lib/public-content";
import { createPageMetadata, jsonLdScriptProps, servicePageJsonLd } from "@/lib/seo";

const content = landingPages.israelEsim;

export const metadata: Metadata = createPageMetadata({
  title: content.metaTitle,
  description: content.metaDescription,
  path: content.slug,
});

export default function IsraelEsimPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(servicePageJsonLd(content))} />
      <ServiceLandingPage content={content} />
    </>
  );
}
