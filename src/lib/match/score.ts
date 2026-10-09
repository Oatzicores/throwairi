import type {
  AICategory,
  AITool,
  CapabilityDimension,
  SourcedFact,
} from "@/lib/types/ai-tool";
import type { PromptIntent } from "./intent";
import { activeTools } from "../data/toolStatus";
import { usdWithThb } from "../currency";

export interface ScoreBreakdown {
  taskFit: number; // 0-100
  quality: number;
  accessibility: number;
  costFit: number;
  popularity: number;
  overall: number; // weighted sum, 0-100
}

export const SCORE_WEIGHTS = {
  taskFit: 0.35,
  quality: 0.25,
  accessibility: 0.15,
  costFit: 0.15,
  popularity: 0.1,
} as const;

export interface MatchResult {
  tool: AITool;
  breakdown: ScoreBreakdown;
  reasons: string[]; // Thai-language bullet reasons, most important first
  warnings: string[]; // data-quality caveats (stale data, missing sources)
}

const CATEGORY_TO_DIMENSIONS: Record<AICategory, CapabilityDimension[]> = {
  chat: ["chat", "reasoning", "longContext"],
  image: ["image"],
  video: ["video"],
  audio: ["audio"],
  code: ["code", "reasoning"],
  agent: ["agentTools", "reasoning"],
  search: ["reasoning", "longContext"],
  multimodal: ["chat", "image", "video", "audio", "code"],
};

const STALE_DATA_DAYS = 30;

function daysBetween(isoA: string, isoB: string): number {
  const a = new Date(isoA).getTime();
  const b = new Date(isoB).getTime();
  return Math.abs(a - b) / (1000 * 60 * 60 * 24);
}

function averageKnownScores(scores: SourcedFact<number>[]): number | null {
  const known = scores.filter((s) => s.confidence !== "unknown");
  if (known.length === 0) return null;
  return known.reduce((sum, s) => sum + s.value, 0) / known.length;
}

function computeTaskFit(tool: AITool, intent: PromptIntent): number {
  const [primary, secondary] = intent.categories;
  if (primary && tool.categories.includes(primary)) return 100;
  if (secondary && tool.categories.includes(secondary)) return 70;

  // Fall back to capability scores for the primary intent's dimensions —
  // a tool might be strong at the underlying skill without being tagged
  // in that category (e.g. a chat model with decent code capability).
  if (primary) {
    const dims = CATEGORY_TO_DIMENSIONS[primary];
    const relevant = tool.capabilities
      .filter((c) => dims.includes(c.dimension))
      .map((c) => c.score);
    const avg = averageKnownScores(relevant);
    if (avg !== null && avg >= 60) return Math.round(avg * 0.6); // partial credit, capped below a real category match
  }
  return 20;
}

function computeQuality(tool: AITool, intent: PromptIntent): number {
  const primary = intent.categories[0] ?? "chat";
  const dims = CATEGORY_TO_DIMENSIONS[primary];
  const relevant = tool.capabilities
    .filter((c) => dims.includes(c.dimension))
    .map((c) => c.score);
  const capAvg = averageKnownScores(relevant);
  if (capAvg !== null) return Math.round(capAvg);

  return 50; // neutral — no sourced quality signal found
}

function computeAccessibility(tool: AITool): number {
  const tierBase: Record<AITool["pricing"]["tier"], number> = {
    free: 90,
    freemium: 75,
    paid: 45,
    "usage-based": 35,
  };
  let score = tierBase[tool.pricing.tier];
  const beginnerFriendly = tool.bestFor.some((phrase) =>
    /มือใหม่|beginner|เริ่มต้น|ง่าย/i.test(phrase),
  );
  if (beginnerFriendly) score = Math.min(100, score + 10);
  return score;
}

function computeCostFit(
  tool: AITool,
  budget: PromptIntent["budget"],
): number {
  const tier = tool.pricing.tier;
  if (budget === "free-only") {
    if (tier === "free") return 100;
    if (tier === "freemium" && tool.pricing.freeQuota) return 80;
    return 10;
  }
  if (budget === "paid-ok") {
    if (tier === "usage-based") return 70; // unpredictable cost, still usable
    return 90;
  }
  // unspecified — default to favoring accessible options since this app
  // targets users who don't yet know what they need
  const unspecifiedBase: Record<AITool["pricing"]["tier"], number> = {
    free: 90,
    freemium: 85,
    paid: 55,
    "usage-based": 45,
  };
  return unspecifiedBase[tier];
}

function computePopularity(tool: AITool, catalog: AITool[]): number {
  const groups = new Map<string, { min: number; max: number }>();
  for (const t of catalog) {
    for (const signal of t.usageSignals) {
      if (signal.value.confidence === "unknown") continue;
      const key = signal.metric;
      const existing = groups.get(key);
      const v = signal.value.value;
      if (!existing) {
        groups.set(key, { min: v, max: v });
      } else {
        existing.min = Math.min(existing.min, v);
        existing.max = Math.max(existing.max, v);
      }
    }
  }

  const normalizedScores: number[] = [];
  for (const signal of tool.usageSignals) {
    if (signal.value.confidence === "unknown") continue;
    const range = groups.get(signal.metric);
    if (!range || range.max === range.min) continue;
    const v = signal.value.value;
    let normalized = ((v - range.min) / (range.max - range.min)) * 100;
    // similarweb-rank: lower rank number = more popular, so invert
    if (signal.metric === "similarweb-rank") normalized = 100 - normalized;
    normalizedScores.push(normalized);
  }

  if (normalizedScores.length === 0) return 30; // no sourced usage evidence — conservative default, not zero
  return Math.round(
    normalizedScores.reduce((a, b) => a + b, 0) / normalizedScores.length,
  );
}

function generateReasons(
  tool: AITool,
  intent: PromptIntent,
  breakdown: ScoreBreakdown,
): string[] {
  const reasons: string[] = [];
  const primary = intent.categories[0];

  if (primary && tool.categories.includes(primary)) {
    reasons.push(`ตรงกับประเภทงานที่ต้องการ (${tool.categories.join(", ")})`);
  }

  const dims = primary ? CATEGORY_TO_DIMENSIONS[primary] : [];
  const bestCap = tool.capabilities
    .filter((c) => dims.includes(c.dimension) && c.score.confidence !== "unknown")
    .sort((a, b) => b.score.value - a.score.value)[0];
  if (bestCap) {
    reasons.push(
      `ความสามารถด้าน ${bestCap.dimension} ได้คะแนน ${bestCap.score.value}/100 (${bestCap.score.confidence === "verified" ? "ยืนยันแล้ว" : "ข้อมูลอ้างอิง"})`,
    );
  }

  if (breakdown.accessibility >= 75) {
    reasons.push("เหมาะกับมือใหม่ เริ่มใช้งานง่าย");
  }

  if (intent.budget === "free-only" && breakdown.costFit >= 80) {
    reasons.push("มีแผนฟรีที่ใช้งานได้จริง ตรงกับงบที่ระบุ");
  } else if (intent.budget === "paid-ok" && tool.pricing.plans.length > 0) {
    const cheapest = tool.pricing.plans
      // "Cheapest paid plan": a $0 plan is the free tier, not a paid one.
      .filter((p) => p.priceUsdPerMonth !== null && p.priceUsdPerMonth > 0)
      .sort((a, b) => (a.priceUsdPerMonth ?? 0) - (b.priceUsdPerMonth ?? 0))[0];
    if (cheapest) {
      reasons.push(
        `แผนเริ่มต้นแบบเสียเงินอยู่ที่ ~${usdWithThb(cheapest.priceUsdPerMonth ?? 0)}/เดือน (${cheapest.name})`,
      );
    }
  }

  if (breakdown.popularity >= 70) {
    reasons.push("มีหลักฐานการใช้งานจริงสูงเมื่อเทียบกับ AI ตัวอื่นในหมวดเดียวกัน");
  }

  if (reasons.length === 0) {
    reasons.push("มีความสามารถใกล้เคียงกับสิ่งที่ต้องการ แต่ข้อมูลยืนยันยังมีจำกัด");
  }

  return reasons;
}

function generateWarnings(tool: AITool, today: string): string[] {
  const warnings: string[] = [];
  if (daysBetween(tool.pricing.lastVerified, today) > STALE_DATA_DAYS) {
    warnings.push(
      `⚠️ ข้อมูลราคาตรวจสอบล่าสุดเมื่อ ${tool.pricing.lastVerified} อาจล้าสมัย ควรเช็คหน้าราคาทางการอีกครั้ง`,
    );
  }
  if (tool.pricing.commercialUseSummary.confidence === "unknown") {
    warnings.push("⚠️ ไม่พบข้อมูลสิทธิ์การใช้งานเชิงพาณิชย์ที่ยืนยันได้ ควรอ่าน ToS ก่อนใช้จริง");
  }
  return warnings;
}

export function matchTools(
  catalog: AITool[],
  intent: PromptIntent,
  today: string = new Date().toISOString().slice(0, 10),
): MatchResult[] {
  // A tool the vendor has shut down is not a recommendation, whatever its scores would be.
  const active = activeTools(catalog);
  return active
    .map((tool) => {
      const taskFit = computeTaskFit(tool, intent);
      const quality = computeQuality(tool, intent);
      const accessibility = computeAccessibility(tool);
      const costFit = computeCostFit(tool, intent.budget);
      const popularity = computePopularity(tool, active);
      const overall = Math.round(
        taskFit * SCORE_WEIGHTS.taskFit +
          quality * SCORE_WEIGHTS.quality +
          accessibility * SCORE_WEIGHTS.accessibility +
          costFit * SCORE_WEIGHTS.costFit +
          popularity * SCORE_WEIGHTS.popularity,
      );
      const breakdown: ScoreBreakdown = {
        taskFit,
        quality,
        accessibility,
        costFit,
        popularity,
        overall,
      };
      return {
        tool,
        breakdown,
        reasons: generateReasons(tool, intent, breakdown),
        warnings: generateWarnings(tool, today),
      } satisfies MatchResult;
    })
    .sort((a, b) => b.breakdown.overall - a.breakdown.overall);
}
