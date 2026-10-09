import type { MetadataRoute } from "next";
import { loadCatalog } from "@/lib/data/loadCatalog";
import { SITE_URL } from "@/lib/site";

// Public, indexable pages only. /results, /favorites and /api are per-visitor
// or query-driven and are excluded (see robots.ts).
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    "",
    "/compare",
    "/updates",
    "/about",
    "/methodology",
    "/corrections",
    "/legal",
    "/support",
    "/prompts/video",
    "/prompts/image",
  ];

  const tools = loadCatalog().map((tool) => ({
    url: `${SITE_URL}/tool/${tool.id}`,
    lastModified: tool.lastUpdated,
  }));

  return [...staticPages.map((path) => ({ url: `${SITE_URL}${path}` })), ...tools];
}
