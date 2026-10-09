import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { PickableCategory } from "@/lib/match/categoryRegistry";
import { isPickableCategory } from "@/lib/match/categoryRegistry";

/**
 * Prompt library for the pages reached from the category picker
 * ("กดเพื่อหา Prompt สำหรับวีดีโอ/ภาพ"). Data lives in data/prompts/<category>.json.
 *
 * Nothing here may read prices, affiliate data or ranking scores: which tool
 * is recommended is decided by the evidence written next to it in the JSON
 * (a vendor's own guide or a dated leaderboard snapshot), never by money.
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const httpsUrl = z.string().url().startsWith("https://");

export const evidenceSchema = z.object({
  /** vendor-guide = the tool maker's own documentation; leaderboard = a third-party ranking snapshot. */
  kind: z.enum(["vendor-guide", "leaderboard"]),
  text: z.string().min(10),
  sourceUrl: httpsUrl,
  checkedAt: isoDate,
});

export const pickSchema = z.object({
  /** Optional heading, used only in the overview box. */
  headline: z.string().optional(),
  /** Catalog tool id: the card links to /tool/<toolId>. */
  toolId: z.string().min(1),
  /** The concrete model/product inside that tool the evidence is about. */
  model: z.string().min(1),
  role: z.enum(["best", "alt"]),
  reason: z.string().min(10),
  /** Keys into the file's `evidence` map. At least one: no evidence, no recommendation. */
  evidence: z.array(z.string()).min(1),
  caveat: z.string().optional(),
});

export const promptSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(2),
  /** "เหมาะสำหรับสร้าง…" */
  suitableFor: z.string().min(5),
  /** Shown first. */
  thai: z.string().min(20),
  /** Shown second, as a separate block. */
  english: z.string().min(20),
  picks: z.array(pickSchema).min(1),
  tips: z.array(z.string()).default([]),
  caveats: z.array(z.string()).default([]),
});

export const promptLibrarySchema = z.object({
  category: z.enum(["image", "video"]),
  updatedAt: isoDate,
  intro: z.string().min(10),
  overview: z.array(pickSchema).min(1),
  evidence: z.record(z.string(), evidenceSchema),
  guides: z.array(z.object({ title: z.string(), url: httpsUrl })).min(1),
  prompts: z.array(promptSchema).min(1),
});

export type Evidence = z.infer<typeof evidenceSchema>;
export type Pick = z.infer<typeof pickSchema>;
export type LibraryPrompt = z.infer<typeof promptSchema>;
export type PromptLibrary = z.infer<typeof promptLibrarySchema>;

const PROMPTS_DIR = path.join(process.cwd(), "data", "prompts");

/** Every evidence key referenced by a pick that the file does not define. */
export function missingEvidenceKeys(lib: PromptLibrary): string[] {
  const picks = [...lib.overview, ...lib.prompts.flatMap((p) => p.picks)];
  const missing = new Set<string>();
  for (const pick of picks) {
    for (const key of pick.evidence) if (!(key in lib.evidence)) missing.add(key);
  }
  return [...missing];
}

const cache = new Map<PickableCategory, PromptLibrary>();

/** Returns null (and warns) when the file is missing or invalid, so the page can 404 instead of showing half data. */
export function loadPromptLibrary(category: string): PromptLibrary | null {
  if (!isPickableCategory(category)) return null;
  const hit = cache.get(category);
  if (hit) return hit;

  try {
    const raw = fs.readFileSync(path.join(PROMPTS_DIR, `${category}.json`), "utf8");
    const parsed = promptLibrarySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.warn(`prompt library ${category}: invalid`, parsed.error.issues);
      return null;
    }
    const missing = missingEvidenceKeys(parsed.data);
    if (missing.length > 0 || parsed.data.category !== category) {
      console.warn(`prompt library ${category}: unresolved evidence keys`, missing);
      return null;
    }
    cache.set(category, parsed.data);
    return parsed.data;
  } catch (err) {
    console.warn(`prompt library ${category}: cannot read`, err);
    return null;
  }
}

export function promptsHref(category: PickableCategory): string {
  return `/prompts/${category}`;
}
