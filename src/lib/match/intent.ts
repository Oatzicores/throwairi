import type { AICategory } from "@/lib/types/ai-tool";
import { isPickableCategory } from "./categoryRegistry";

export type SkillLevel = "beginner" | "intermediate" | "advanced";
export type BudgetPreference = "free-only" | "paid-ok" | "unspecified";

export interface PromptIntent {
  rawPrompt: string;
  categories: AICategory[]; // ranked, most likely first
  budget: BudgetPreference;
  skillLevel: SkillLevel;
  keywords: string[]; // matched keyword hits, for explaining the match
}

interface CategoryKeywordSet {
  category: AICategory;
  keywords: string[];
}

// Keyword sets are intentionally simple substring matches (Thai has no
// reliable word-boundary regex without a tokenizer). Order doesn't matter;
// scores accumulate per category and the highest wins.
export const CATEGORY_KEYWORDS: CategoryKeywordSet[] = [
  {
    category: "image",
    keywords: [
      "ภาพ",
      "รูป",
      "วาด",
      "โลโก้",
      "โปสเตอร์",
      "ภาพประกอบ",
      "image",
      "picture",
      "photo",
      "artwork",
      "illustration",
      "logo",
      "poster",
      "thumbnail",
      "แบนเนอร์",
    ],
  },
  {
    category: "video",
    keywords: [
      "วิดีโอ",
      "วีดีโอ",
      "คลิป",
      "ตัดต่อ",
      "หนังสั้น",
      "video",
      "clip",
      "footage",
      "animation",
      "แอนิเมชัน",
      "reels",
      "tiktok",
    ],
  },
  {
    category: "audio",
    keywords: [
      "เสียง",
      "พากย์",
      "เพลง",
      "ดนตรี",
      "เสียงพูด",
      "voice",
      "音",
      "audio",
      "music",
      "song",
      "podcast",
      "narration",
      "voiceover",
      "tts",
    ],
  },
  {
    category: "code",
    keywords: [
      "โค้ด",
      "โปรแกรม",
      "เขียนโปรแกรม",
      "เว็บไซต์",
      "แอป",
      "บั๊ก",
      "code",
      "coding",
      "programming",
      "developer",
      "debug",
      "function",
      "api",
      "script",
      "website",
      "app development",
    ],
  },
  {
    category: "agent",
    keywords: [
      "อัตโนมัติ",
      "จัดการงาน",
      "ทำงานแทน",
      "เอเจนต์",
      "automate",
      "automation",
      "agent",
      "workflow",
      "browse the web",
      "ท่องเว็บแทน",
      "ทำธุระ",
    ],
  },
  {
    category: "search",
    keywords: [
      "ค้นหา",
      "หาข้อมูล",
      "วิจัย",
      "research",
      "search",
      "แหล่งอ้างอิง",
      "citation",
    ],
  },
  {
    category: "chat",
    keywords: [
      "แชท",
      "คุย",
      "ถามตอบ",
      "สรุป",
      "เขียนบทความ",
      "แปลภาษา",
      "chat",
      "conversation",
      "ask",
      "summarize",
      "write an essay",
      "translate",
      "brainstorm",
      "ระดมความคิด",
    ],
  },
];

export const FREE_ONLY_KEYWORDS = [
  "ฟรี",
  "free",
  "ไม่มีเงิน",
  "ไม่อยากจ่าย",
  "ไม่เสียเงิน",
  "no budget",
  "งบน้อย",
  "ไม่มีงบ",
];

export const PAID_OK_KEYWORDS = [
  "จ่ายได้",
  "เสียเงินได้",
  "ยอมจ่าย",
  "paid",
  "subscription",
  "งบเยอะ",
  "พรีเมียม",
  "premium",
];

export const BEGINNER_KEYWORDS = [
  "มือใหม่",
  "เริ่มต้น",
  "ไม่เคยใช้",
  "beginner",
  "new to",
  "ไม่รู้จัก ai",
  "ง่ายๆ",
];

export const INTERMEDIATE_KEYWORDS = [
  "พอใช้เป็น",
  "มีประสบการณ์บ้าง",
  "ใช้มาบ้างแล้ว",
  "intermediate",
  "some experience",
  "already familiar",
];

export const ADVANCED_KEYWORDS = [
  "มืออาชีพ",
  "ขั้นสูง",
  "professional",
  "advanced",
  "expert",
  "ละเอียด",
];

function countHits(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw.toLowerCase()));
}

export function parsePromptIntent(
  rawPrompt: string,
  overrides?: {
    budget?: BudgetPreference;
    skillLevel?: SkillLevel;
    /** Category the visitor chose in the post-search picker (image / video). */
    category?: AICategory;
  },
): PromptIntent {
  const categoryScores = new Map<AICategory, number>();
  const matchedKeywords: string[] = [];

  for (const set of CATEGORY_KEYWORDS) {
    const hits = countHits(rawPrompt, set.keywords);
    if (hits.length > 0) {
      categoryScores.set(set.category, hits.length);
      matchedKeywords.push(...hits);
    }
  }

  const detected: AICategory[] = [...categoryScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);

  // A category the visitor chose goes first. The picker offered "video or
  // image?", so the sibling picker categories are dropped (otherwise the one
  // not chosen would still score as the secondary match); other detected
  // categories such as code or audio stay as the secondary. Scoring is not
  // touched: this only changes which category is primary, it never filters.
  //
  // Otherwise default to "chat" if nothing matched — a bare prompt with no
  // domain words is most likely a general chat/writing task.
  const categories: AICategory[] = overrides?.category
    ? [
        overrides.category,
        ...detected.filter((c) => c !== overrides.category && !isPickableCategory(c)),
      ]
    : detected.length > 0
      ? detected
      : ["chat"];

  const budget: BudgetPreference =
    overrides?.budget ??
    (countHits(rawPrompt, FREE_ONLY_KEYWORDS).length > 0
      ? "free-only"
      : countHits(rawPrompt, PAID_OK_KEYWORDS).length > 0
        ? "paid-ok"
        : "unspecified");

  const skillLevel: SkillLevel =
    overrides?.skillLevel ??
    (countHits(rawPrompt, BEGINNER_KEYWORDS).length > 0
      ? "beginner"
      : countHits(rawPrompt, INTERMEDIATE_KEYWORDS).length > 0
        ? "intermediate"
        : countHits(rawPrompt, ADVANCED_KEYWORDS).length > 0
          ? "advanced"
          : "beginner"); // this app targets beginners by default per the spec

  return {
    rawPrompt,
    categories,
    budget,
    skillLevel,
    keywords: matchedKeywords,
  };
}

export interface KeywordHit {
  keyword: string; // the exact substring matched in the raw prompt
  kind: "category" | "budget";
  value: string; // AICategory id or BudgetPreference
}

// Re-runs the same substring matching parsePromptIntent uses internally,
// but returns *which* keyword triggered *which* signal — the raw material
// for showing users a sentence-level breakdown of how their prompt was
// interpreted (see src/lib/match/promptAnalysis.ts). Kept in this module so
// it can never drift from the keyword lists actually used for matching.
export function findKeywordHits(rawPrompt: string): KeywordHit[] {
  const hits: KeywordHit[] = [];
  for (const set of CATEGORY_KEYWORDS) {
    for (const keyword of countHits(rawPrompt, set.keywords)) {
      hits.push({ keyword, kind: "category", value: set.category });
    }
  }
  for (const keyword of countHits(rawPrompt, FREE_ONLY_KEYWORDS)) {
    hits.push({ keyword, kind: "budget", value: "free-only" });
  }
  for (const keyword of countHits(rawPrompt, PAID_OK_KEYWORDS)) {
    hits.push({ keyword, kind: "budget", value: "paid-ok" });
  }
  return hits;
}
