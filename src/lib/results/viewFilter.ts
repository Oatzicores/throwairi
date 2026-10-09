import type { MatchResult } from "@/lib/match/score";
import type { AICategory, PricingTier } from "@/lib/types/ai-tool";

/**
 * Display-only filtering and ordering for the results page sidebar. It never touches
 * scores or the match order itself: "match" keeps the order matchTools() produced, and the
 * original rank number is carried along so a filtered list still shows each tool's real rank.
 */
export type SortKey = "match" | "price" | "popularity" | "name";

export interface ViewState {
  sortKey: SortKey;
  /** Empty = no price filter. */
  tiers: PricingTier[];
  /** Empty = no category filter. A tool matches when ANY of its categories is selected. */
  categories: AICategory[];
}

export interface RankedResult {
  result: MatchResult;
  originalRank: number;
}

export function cheapestMonthly(result: MatchResult): number {
  const priced = result.tool.pricing.plans
    .map((p) => p.priceUsdPerMonth)
    .filter((p): p is number => p !== null); // 0 counts: free plans sort first
  return priced.length > 0 ? Math.min(...priced) : Infinity;
}

export function applyView(results: MatchResult[], view: ViewState): RankedResult[] {
  const ranked = results.map((result, i) => ({ result, originalRank: i + 1 }));
  const filtered = ranked.filter(({ result }) => {
    const { tool } = result;
    if (view.tiers.length > 0 && !view.tiers.includes(tool.pricing.tier)) return false;
    if (view.categories.length > 0 && !tool.categories.some((c) => view.categories.includes(c))) return false;
    return true;
  });

  switch (view.sortKey) {
    case "price":
      return [...filtered].sort((a, b) => cheapestMonthly(a.result) - cheapestMonthly(b.result));
    case "popularity":
      return [...filtered].sort((a, b) => b.result.breakdown.popularity - a.result.breakdown.popularity);
    case "name":
      return [...filtered].sort((a, b) => a.result.tool.name.localeCompare(b.result.tool.name, "en", { sensitivity: "base" }));
    default:
      return filtered; // already in match order
  }
}

/** How many results each option would keep, for the counts shown next to the checkboxes. */
export function countBy<T extends string>(results: MatchResult[], pick: (r: MatchResult) => T[]): Map<T, number> {
  const counts = new Map<T, number>();
  for (const r of results) for (const key of new Set(pick(r))) counts.set(key, (counts.get(key) ?? 0) + 1);
  return counts;
}
