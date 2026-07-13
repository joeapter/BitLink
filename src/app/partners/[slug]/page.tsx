import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceLandingPage } from "@/components/marketing/ServiceLandingPage";
import { getPartnerPage, partnerPages } from "@/lib/partner-pages";
import {
  createPageMetadata,
  faqPageJsonLd,
  jsonLdScriptProps,
  servicePageJsonLd,
} from "@/lib/seo";

// Partner landing pages — one per partner institution. Visiting the page sets
// the org's bl_org attribution cookie via middleware (partner-org-codes.ts),
// so the clean URL itself is the referral link a school shares.

export const dynamic = "force-static";

export function generateStaticParams() {
  return Object.keys(partnerPages).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const partner = getPartnerPage(slug);
  if (!partner) return {};
  return createPageMetadata({
    title: partner.content.metaTitle,
    description: partner.content.metaDescription,
    path: partner.content.slug,
  });
}

export default async function PartnerPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const partner = getPartnerPage(slug);
  if (!partner) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScriptProps(servicePageJsonLd(partner.content))}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScriptProps(faqPageJsonLd(partner.content.qaBlocks))}
      />
      <ServiceLandingPage content={partner.content} />
    </>
  );
}
