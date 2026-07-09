import type { Metadata } from "next";
import type { BitLinkPlan } from "@/lib/plans";
import type { LandingPageContent } from "@/lib/public-content";

export const SITE_NAME = "BitLink";
export const SITE_URL = "https://www.bitlink.co.il";
export const DEFAULT_TITLE = "Modern Israeli Telecom";
export const DEFAULT_DESCRIPTION =
  "BitLink gives you simple monthly Israeli phone plans, secure checkout, guided activation, and human support.";

export const defaultOgImage = {
  url: "/assets/bitlink-telecom-hero-v2.jpg",
  width: 1672,
  height: 941,
  alt: "BitLink Israeli phone service",
};

export const indexRobots: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
};

export const noIndexRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
};

export function canonicalUrl(path = "/") {
  if (!path || path === "/") return SITE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`.replace(/\/$/, "");
}

function titleWithSite(title: string) {
  return title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
}

export function createPageMetadata({
  title,
  description,
  path,
  image = defaultOgImage,
}: {
  title: string;
  description: string;
  path: string;
  image?: typeof defaultOgImage;
}): Metadata {
  const fullTitle = titleWithSite(title);
  const url = canonicalUrl(path);

  return {
    // Titles that already carry the brand skip the "| BitLink" layout template
    // so pages like /students don't render a doubled brand suffix.
    title: title.includes(SITE_NAME) ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image.url],
    },
    robots: indexRobots,
  };
}

export function createNoIndexMetadata(title: string, description?: string): Metadata {
  return {
    title,
    description,
    robots: noIndexRobots,
  };
}

type JsonLd = Record<string, unknown>;

export function jsonLdScriptProps(jsonLd: JsonLd) {
  return {
    __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
  };
}

export const organizationId = `${SITE_URL}/#organization`;
export const websiteId = `${SITE_URL}/#website`;

export const siteJsonLd: JsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: "BitLink Ltd.",
      alternateName: SITE_NAME,
      url: SITE_URL,
      logo: canonicalUrl("/assets/logo-v2.png"),
      email: "support@bitlink.co.il",
      telephone: "+972587939426",
      identifier: "341280188",
      foundingDate: "2026",
      address: {
        "@type": "PostalAddress",
        streetAddress: "HaRashar Hirsch 4/1",
        addressLocality: "Beit Shemesh",
        postalCode: "9965000",
        addressCountry: "IL",
      },
      areaServed: {
        "@type": "Country",
        name: "Israel",
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          telephone: "+972587939426",
          email: "support@bitlink.co.il",
          areaServed: "IL",
          availableLanguage: ["en"],
        },
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          telephone: "+13473445733",
          email: "support@bitlink.co.il",
          areaServed: ["US", "CA"],
          availableLanguage: ["en"],
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "en",
      publisher: {
        "@id": organizationId,
      },
    },
  ],
};

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}

export function planJsonLd(plan: BitLinkPlan): JsonLd {
  const path = `/plans/${plan.slug}`;
  const url = canonicalUrl(path);

  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Plans", path: "/plans" },
        { name: plan.name, path },
      ]),
      // Product alongside Service: price rich results key off Product.
      {
        "@type": "Product",
        "@id": `${url}#product`,
        name: `${plan.name} mobile plan`,
        description: plan.seoDescription,
        image: canonicalUrl(defaultOgImage.url),
        brand: {
          "@id": organizationId,
        },
        offers: {
          "@type": "Offer",
          url,
          price: (plan.priceCents / 100).toFixed(2),
          priceCurrency: plan.currency,
          availability: "https://schema.org/InStock",
        },
      },
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: `${plan.name} mobile plan`,
        description: plan.detail,
        serviceType: "Mobile telecommunications plan",
        url,
        provider: {
          "@id": organizationId,
        },
        areaServed: {
          "@type": "Country",
          name: "Israel",
        },
        offers: {
          "@type": "Offer",
          url,
          price: (plan.priceCents / 100).toFixed(2),
          priceCurrency: plan.currency,
          availability: "https://schema.org/InStock",
        },
      },
    ],
  };
}

export function plansCollectionJsonLd(plans: BitLinkPlan[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Plans", path: "/plans" },
      ]),
      {
        "@type": "OfferCatalog",
        "@id": `${canonicalUrl("/plans")}#plans`,
        name: "BitLink mobile plans",
        itemListElement: plans.map((plan) => ({
          "@type": "Offer",
          url: canonicalUrl(`/plans/${plan.slug}`),
          price: (plan.priceCents / 100).toFixed(2),
          priceCurrency: plan.currency,
          availability: "https://schema.org/InStock",
          itemOffered: {
            "@type": "Service",
            name: `${plan.name} mobile plan`,
            url: canonicalUrl(`/plans/${plan.slug}`),
          },
        })),
      },
    ],
  };
}

export function servicePageJsonLd(content: LandingPageContent): JsonLd {
  const url = canonicalUrl(content.slug);

  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: content.metaTitle, path: content.slug },
      ]),
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: content.metaTitle,
        description: content.metaDescription,
        serviceType: "Mobile telecommunications service",
        url,
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
}

// Answer copy may carry inline [label](/path) links for on-page rendering;
// structured data expects plain text, so the link syntax is stripped here.
export function stripInlineLinks(text: string) {
  return text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1");
}

export interface TestimonialReview {
  author: string;
  ratingValue: number;
  reviewBody: string;
}

// Emits its own Organization node (sharing organizationId) carrying
// aggregateRating + review — kept separate from the sitewide siteJsonLd
// Organization declaration in layout.tsx so review markup only appears on
// pages that actually render the testimonials, not on every page.
export function testimonialsJsonLd(reviews: TestimonialReview[]): JsonLd {
  const average = reviews.reduce((sum, r) => sum + r.ratingValue, 0) / reviews.length;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "BitLink Ltd.",
        url: SITE_URL,
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: average.toFixed(1),
          bestRating: "5",
          worstRating: "1",
          reviewCount: reviews.length,
        },
        review: reviews.map((r) => ({
          "@type": "Review",
          author: {
            "@type": "Person",
            name: r.author,
          },
          reviewRating: {
            "@type": "Rating",
            ratingValue: r.ratingValue,
            bestRating: 5,
            worstRating: 1,
          },
          reviewBody: r.reviewBody,
          itemReviewed: {
            "@id": organizationId,
          },
        })),
      },
    ],
  };
}

export function faqPageJsonLd(items: Array<{ question: string; answer: string }>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: stripInlineLinks(item.answer),
      },
    })),
  };
}
