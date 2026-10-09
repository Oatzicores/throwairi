import { CATEGORY_KEYWORDS } from "./intent";
import {
  PICKABLE_CATEGORIES,
  pickableList,
  type PickableCategory,
  type PickableCategoryDef,
} from "./categoryRegistry";

export interface CategoryDetection {
  category: PickableCategory;
  /** Explicit keyword hit = 3 each; implicit style signal = its weight. */
  score: number;
  source: "explicit" | "implicit" | "both";
  /** What matched — for tests and debugging, not shown to visitors. */
  matched: string[];
}

/** Below this score the picker is not shown (a lone "4k" is not enough). */
export const DETECTION_THRESHOLD = 3;
const EXPLICIT_HIT = 3;

const ASCII_KEYWORD = /^[a-z0-9 .'-]+$/;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Removes Thai substrings that merely contain a category keyword. */
export function stripFalsePositives(lowerText: string, falsePositives: string[]): string {
  let out = lowerText;
  for (const fp of falsePositives) out = out.split(fp).join(" ");
  return out;
}

function explicitHits(def: PickableCategoryDef, lowerText: string): string[] {
  const base = CATEGORY_KEYWORDS.find((s) => s.category === def.id)?.keywords ?? [];
  const text = stripFalsePositives(lowerText, def.falsePositives);
  const hits: string[] = [];
  for (const raw of [...base, ...def.explicitExtra]) {
    const kw = raw.toLowerCase();
    // ASCII words need boundaries ("logo" must not match "logout", "clip" not
    // "eclipse"); Thai has no reliable boundary so it stays a substring match.
    const matched = ASCII_KEYWORD.test(kw)
      ? new RegExp(`(?<![a-z0-9])${escapeRe(kw)}(?:s|es)?(?![a-z0-9])`).test(text)
      : text.includes(kw);
    if (matched && !hits.includes(kw)) hits.push(kw);
  }
  return hits;
}

function implicitScore(def: PickableCategoryDef, lowerText: string): { score: number; matched: string[] } {
  let score = 0;
  const matched: string[] = [];
  for (const s of def.implicit) {
    if (s.pattern.test(lowerText)) {
      score += s.weight;
      matched.push(s.label);
    }
  }
  // "Tag soup" shape: several short comma-separated fragments plus at least
  // one style signal reads as a generation prompt.
  if (score > 0) {
    const fragments = lowerText.split(",").map((f) => f.trim()).filter((f) => f.length > 0 && f.length <= 40);
    if (fragments.length >= 4) {
      score += 1;
      matched.push("tag-list");
    }
  }
  return { score, matched };
}

/**
 * Which of the pickable categories (image / video) does this prompt look
 * like? Empty array = do not ask, navigate as usual. Sorted by score, then by
 * registry order. Pure and deterministic.
 */
export function detectGenerativeCategories(rawPrompt: string): CategoryDetection[] {
  const lower = rawPrompt.toLowerCase().trim();
  if (!lower) return [];

  const out: CategoryDetection[] = [];
  for (const def of pickableList()) {
    const explicit = explicitHits(def, lower);
    const implicit = implicitScore(def, lower);
    const score = explicit.length * EXPLICIT_HIT + implicit.score;
    if (score < DETECTION_THRESHOLD) continue;
    out.push({
      category: def.id,
      score,
      source: explicit.length > 0 && implicit.score > 0 ? "both" : explicit.length > 0 ? "explicit" : "implicit",
      matched: [...explicit, ...implicit.matched],
    });
  }
  return out.sort(
    (a, b) => b.score - a.score || PICKABLE_CATEGORIES[a.category].order - PICKABLE_CATEGORIES[b.category].order,
  );
}
