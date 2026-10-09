import Parser from "rss-parser";
import { isSafeHttpUrl } from "@/lib/security/input";
import type { NewsItem } from "@/lib/types/ai-tool";

// Verified live RSS feeds (checked 2026-09-03 — see docs/catalog-research-brief.md
// for the sourcing rules this project follows). Kept short and reputable
// rather than padded — a broken feed silently drops from results instead of
// failing the whole request.
const FEEDS: { url: string; source: string }[] = [
  { url: "https://techcrunch.com/category/artificial-intelligence/feed/", source: "TechCrunch AI" },
  { url: "https://venturebeat.com/category/ai/feed/", source: "VentureBeat AI" },
  { url: "https://www.artificialintelligence-news.com/feed/", source: "AI News" },
  { url: "https://www.marktechpost.com/feed/", source: "MarkTechPost" },
];

const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
let cache: { items: NewsItem[]; fetchedAt: number } | null = null;

// Without a timeout one hung feed would hold the whole results page open.
const FEED_TIMEOUT_MS = 8000;
const parser = new Parser({ timeout: FEED_TIMEOUT_MS });

async function fetchFeed(feed: { url: string; source: string }): Promise<NewsItem[]> {
  try {
    const result = await parser.parseURL(feed.url);
    return (result.items ?? []).slice(0, 15).map((item) => ({
      title: item.title ?? "(ไม่มีชื่อเรื่อง)",
      // Feed content is third-party: only plain web links may become an href.
      url: isSafeHttpUrl(item.link) ? item.link : feed.url,
      publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      source: feed.source,
      summary: (item.contentSnippet ?? item.content ?? "").slice(0, 300),
    }));
  } catch (err) {
    // A single dead feed shouldn't take down the news panel — return
    // nothing from it and let the other feeds carry the response. Log it so
    // a feed that stays broken is noticed instead of vanishing silently.
    console.warn(`[news] feed failed: ${feed.source} (${feed.url}):`, (err as Error).message);
    return [];
  }
}

export async function getLatestAINews(): Promise<{
  items: NewsItem[];
  fetchedAt: string;
}> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return { items: cache.items, fetchedAt: new Date(cache.fetchedAt).toISOString() };
  }

  const results = await Promise.all(FEEDS.map(fetchFeed));
  const items = results
    .flat()
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  if (items.length === 0) {
    // Every feed failed. Don't cache the empty result for 6 hours; serve the
    // last good copy (marked with its real fetch time) if there is one.
    if (cache) {
      console.warn("[news] all feeds failed; serving stale cache");
      return { items: cache.items, fetchedAt: new Date(cache.fetchedAt).toISOString() };
    }
    return { items: [], fetchedAt: new Date(now).toISOString() };
  }

  cache = { items, fetchedAt: now };
  return { items, fetchedAt: new Date(now).toISOString() };
}

/**
 * Filter news to items whose title/summary mentions any of the given
 * keywords — used to surface "news related to this prompt" on the results
 * page. Simple substring match, same rationale as intent.ts (no tokenizer
 * available for mixed Thai/English text).
 */
export function filterNewsByKeywords(items: NewsItem[], keywords: string[]): NewsItem[] {
  if (keywords.length === 0) return items.slice(0, 5);
  const lowerKeywords = keywords.map((k) => k.toLowerCase());
  const matched = items.filter((item) => {
    const haystack = (item.title + " " + item.summary).toLowerCase();
    return lowerKeywords.some((k) => haystack.includes(k));
  });
  return (matched.length > 0 ? matched : items).slice(0, 5);
}
