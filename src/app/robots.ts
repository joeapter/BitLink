import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account/",
        "/admin/",
        "/api/",
        "/auth/",
        "/email-signature",
        "/legal/plans/",
        "/support/ticket/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
