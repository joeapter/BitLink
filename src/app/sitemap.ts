import type { MetadataRoute } from "next";
import { plans } from "@/lib/plans";
import { canonicalUrl } from "@/lib/seo";

const lastModified = new Date("2026-06-22");
const recentUpdate = new Date("2026-07-02");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: canonicalUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: canonicalUrl("/plans"),
      lastModified,
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
      lastModified,
      changeFrequency: "monthly",
      priority: 0.84,
    },
    {
      url: canonicalUrl("/aliyah"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.84,
    },
    {
      url: canonicalUrl("/kosher-phone-plans-israel"),
      lastModified: recentUpdate,
      changeFrequency: "monthly",
      priority: 0.82,
    },
    ...plans.map((plan) => ({
      url: canonicalUrl(`/plans/${plan.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: plan.featured ? 0.85 : 0.8,
    })),
    {
      url: canonicalUrl("/support"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: canonicalUrl("/refer"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: canonicalUrl("/faq"),
      lastModified,
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
