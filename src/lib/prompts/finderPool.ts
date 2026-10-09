import type { AITool } from "../types/ai-tool";
import { isActiveTool } from "../data/toolStatus";
import type { FinderEvidence, FinderTool } from "./finder";
import type { PromptLibrary } from "./promptLibrary";

/**
 * Who can be looked up in a page's "find another AI" box: every active
 * catalog tool of the page's category, plus any tool the library already
 * recommends somewhere on the page (e.g. chat tools that make images).
 *
 * Deliberately no scores and no ranking: the box only shows what we can
 * source, in alphabetical order, so it cannot become a way to promote a tool.
 */
export function buildFinderPool(lib: PromptLibrary, catalog: AITool[]): FinderTool[] {
  const picks = [...lib.overview, ...lib.prompts.flatMap((p) => p.picks)];
  const recommended = new Set(picks.map((p) => p.toolId));

  return catalog
    .filter((t) => isActiveTool(t) && (t.categories.includes(lib.category) || recommended.has(t.id)))
    .map((t): FinderTool => {
      const keys = new Set<string>();
      for (const p of picks) if (p.toolId === t.id) for (const k of p.evidence) keys.add(k);
      const evidence: FinderEvidence[] = [...keys].map((k) => {
        const e = lib.evidence[k];
        return { kind: e.kind, text: e.text, sourceUrl: e.sourceUrl, checkedAt: e.checkedAt };
      });

      // The catalog's ELO for a chat model says nothing about images, so only
      // use it when the tool itself belongs to this page's category.
      const elo = t.categories.includes(lib.category)
        ? t.usageSignals.find((s) => s.metric === "arena-elo" && typeof s.value.value === "number")
        : undefined;

      return {
        id: t.id,
        name: t.name,
        vendor: t.vendor,
        shortDescription: t.shortDescription,
        link: {
          id: t.id,
          websiteUrl: t.websiteUrl,
          plansUrl: t.plansUrl,
          affiliate: t.affiliate,
          discontinued: t.discontinued,
          pricing: { tier: t.pricing.tier },
        },
        evidence,
        lastUpdate: t.lastProductUpdate
          ? { value: t.lastProductUpdate.value, note: t.lastProductUpdate.note ?? null, sourceUrl: t.lastProductUpdate.sourceUrl }
          : null,
        signal: elo
          ? {
              label: elo.label,
              value: elo.value.value as number,
              lastVerified: elo.value.lastVerified,
              sourceUrl: elo.value.sourceUrl,
            }
          : null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
