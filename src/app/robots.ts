import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Query-driven or per-visitor pages: nothing useful to index, and the
      // results URL carries whatever the visitor typed.
      disallow: ["/results", "/favorites", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
