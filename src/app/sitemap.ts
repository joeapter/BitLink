import type { MetadataRoute } from "next";
import { guides } from "@/lib/guides";
import { partnerPages } from "@/lib/partner-pages";
import { plans } from "@/lib/plans";
import { canonicalUrl } from "@/lib/seo";

const lastModified = new Date("2026-06-22");
const recentUpdate = new Date("2026-07-05");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: canonicalUrl("/"),
      lastModified: recentUpdate,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: canonicalUrl("/plans"),
      lastModified: recentUpdate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: canonicalUrl("/israel-esim"),
      lastModified: recentUpdate,
      changeFrequency: "monthly",
      priority: 0.82,
    },
    {
      url: canonicalUrl("/israeli-phone-plans-for-students"),
      lastModified: recentUpdate,
      changeFrequency: "monthly",
      priority: 0.82,
    },
    {
      url: canonicalUrl("/israeli-phone-plans-for-olim"),
      lastModified: recentUpdate,
      changeFrequency: "monthly",
      priority: 0.82,
    },
    {
      url: canonicalUrl("/students"),
      lastModified: recentUpdate,
      changeFrequency: "monthly",
      priority: 0.84,
    },
    {
      url: canonicalUrl("/aliyah"),
      lastModified: recentUpdate,
      changeFrequency: "monthly",
      priority: 0.84,
    },
    {
      url: canonicalUrl("/kosher-phone-plans-israel"),
      lastModified: recentUpdate,
      changeFrequency: "monthly",
      priority: 0.82,
    },
    {
      url: canonicalUrl("/keep-your-number"),
      lastModified: recentUpdate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: canonicalUrl("/yeshiva-seminary-phone-plans"),
      lastModified: recentUpdate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: canonicalUrl("/us-number-in-israel"),
      lastModified: recentUpdate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: canonicalUrl("/israel-sim-for-tourists"),
      lastModified: recentUpdate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: canonicalUrl("/guides"),
      lastModified: recentUpdate,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...guides.map((guide) => ({
      url: canonicalUrl(`/guides/${guide.slug}`),
      lastModified: new Date(guide.dateModified),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...Object.keys(partnerPages).map((slug) => ({
      url: canonicalUrl(`/partners/${slug}`),
      lastModified: new Date("2026-07-13"),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: canonicalUrl("/about"),
      lastModified: recentUpdate,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    ...plans.map((plan) => ({
      url: canonicalUrl(`/plans/${plan.slug}`),
      lastModified: recentUpdate,
      changeFrequency: "monthly" as const,
      priority: plan.featured ? 0.85 : 0.8,
    })),
    {
      url: canonicalUrl("/support"),
      lastModified: recentUpdate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: canonicalUrl("/refer"),
      lastModified: recentUpdate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: canonicalUrl("/faq"),
      lastModified: recentUpdate,
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: canonicalUrl("/legal/privacy"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: canonicalUrl("/legal/terms"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
