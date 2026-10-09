import type { AICategory, AITool } from "@/lib/types/ai-tool";
import { CATEGORY_LABELS, PRICING_TIER_LABELS } from "@/lib/labels";
import type { KeywordHit, SkillLevel } from "./intent";
import type { MatchResult } from "./score";

// Splits a raw prompt into clause-sized chunks for the sentence-level
// "here's how we read your prompt" breakdown shown under each result.
// Thai has no reliable word-boundary regex (see intent.ts), so — same as
// the rest of the matching engine — this leans on punctuation and common
// clause conjunctions rather than a real tokenizer.
const SEGMENT_DELIMITER = /(?:[,，。.!?！？\n]+|\s+(?:และ|แต่|หรือ|เพราะ|เพื่อ)\s+)/;

export interface PromptSegment {
  text: string;
  hits: KeywordHit[];
}

export function segmentPrompt(rawPrompt: string, hits: KeywordHit[]): PromptSegment[] {
  const clauses = rawPrompt
    .split(SEGMENT_DELIMITER)
    .map((c) => c.trim())
    .filter(Boolean);

  return clauses.map((text) => {
    const lower = text.toLowerCase();
    const matched = hits.filter((h) => lower.includes(h.keyword.toLowerCase()));
    // A clause can legitimately carry more than one signal (e.g. "ภาพการ์ตูน
    // ฟรีๆ" is both a category and a budget cue) — keep every distinct one
    // instead of only the first match, so nothing gets silently dropped.
    const seen = new Set<string>();
    const deduped = matched.filter((h) => {
      const key = `${h.kind}:${h.value}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return { text, hits: deduped };
  });
}

const SKILL_LABELS: Record<SkillLevel, string> = {
  beginner: "เริ่มต้น",
  intermediate: "พอใช้เป็น",
  advanced: "มืออาชีพ",
};

// Ties every explanation to a number the app actually computed
// (score.ts's breakdown, or the tool's own category/pricing data) instead
// of freeform text — so it's a real trace of the match, not a guess.
export function explainHit(hit: KeywordHit, tool: AITool, result: MatchResult): string {
  const { breakdown } = result;
  if (hit.kind === "category") {
    const label = CATEGORY_LABELS[hit.value as AICategory];
    const matches = tool.categories.includes(hit.value as AICategory);
    return matches
      ? `คำว่า "${hit.keyword}" ตีความว่าต้องการงาน "${label}" — ${tool.name} รองรับหมวดนี้โดยตรง (คะแนนตรงกับงาน ${breakdown.taskFit}/100)`
      : `คำว่า "${hit.keyword}" ตีความว่าต้องการงาน "${label}" — ${tool.name} ไม่ได้จัดอยู่ในหมวดนี้โดยตรง แต่มีความสามารถใกล้เคียงที่ยังนำมาพิจารณา (คะแนนตรงกับงาน ${breakdown.taskFit}/100)`;
  }
  if (hit.kind === "budget") {
    const tierLabel = PRICING_TIER_LABELS[tool.pricing.tier];
    const wantsFree = hit.value === "free-only";
    return `คำว่า "${hit.keyword}" ตีความว่า${wantsFree ? "ต้องการแผนฟรีเท่านั้น" : "ยอมจ่ายเงินได้"} — ${tool.name} เป็นแผน "${tierLabel}" (คะแนนตรงกับงบ ${breakdown.costFit}/100)`;
  }
  const skillLabel = SKILL_LABELS[hit.value as SkillLevel];
  return `คำว่า "${hit.keyword}" ตีความระดับผู้ใช้ว่า "${skillLabel}" — นำมาพิจารณาความง่ายในการเริ่มใช้งานของ ${tool.name} (คะแนนใช้งานง่าย ${breakdown.accessibility}/100)`;
}

export interface AnnotatedSegment {
  text: string;
  explanations: string[]; // empty = this clause wasn't a specific match signal
}

export function buildAnnotatedSegments(
  rawPrompt: string,
  hits: KeywordHit[],
  tool: AITool,
  result: MatchResult,
): AnnotatedSegment[] {
  return segmentPrompt(rawPrompt, hits).map((seg) => ({
    text: seg.text,
    explanations: seg.hits.map((h) => explainHit(h, tool, result)),
  }));
}
