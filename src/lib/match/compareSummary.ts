import type { AITool, PricingTier } from "@/lib/types/ai-tool";
import { isRecentlyUpdated } from "@/lib/freshness";
import { usdWithThb } from "@/lib/currency";
import { CAPABILITY_DIMENSION_LABELS, CONFIDENCE_LABELS } from "@/lib/labels";

export interface RankedEntry {
  toolId: string;
  toolName: string;
  rank: number; // 1 = best in this dimension; ties share a rank
  value: string; // short human-readable value shown next to the rank
  reasoning: string; // why this tool landed at this rank
}

export interface ComparisonDimension {
  key: string;
  icon: string;
  label: string;
  entries: RankedEntry[]; // every selected tool, always — never just the winner
  note?: string; // caveat about data quality for this dimension, if any
}

const TIER_RANK: Record<PricingTier, number> = {
  free: 0,
  freemium: 1,
  paid: 2,
  "usage-based": 3,
};

const TIER_LABEL: Record<PricingTier, string> = {
  free: "ฟรี 100%",
  freemium: "มีแผนฟรีให้เริ่มต้น",
  paid: "เสียเงินเท่านั้น",
  "usage-based": "จ่ายตามการใช้งานจริง",
};

const CONFIDENCE_RANK: Record<string, number> = {
  verified: 0,
  probable: 1,
  inference: 2,
  unknown: 3,
};

function cheapestPaidPrice(tool: AITool): number {
  const priced = tool.pricing.plans
    .map((p) => p.priceUsdPerMonth)
    .filter((p): p is number => p !== null);
  return priced.length > 0 ? Math.min(...priced) : Infinity;
}

/** Converts an ascending-is-better sorted list into ranked entries, with ties sharing a rank. */
function toRanked<T>(
  sorted: T[],
  getId: (t: T) => string,
  getName: (t: T) => string,
  getSortValue: (t: T) => number,
  getValue: (t: T) => string,
  getReasoning: (t: T) => string,
): RankedEntry[] {
  const entries: RankedEntry[] = [];
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && getSortValue(sorted[i]) !== getSortValue(sorted[i - 1])) rank = i + 1;
    entries.push({
      toolId: getId(sorted[i]),
      toolName: getName(sorted[i]),
      rank,
      value: getValue(sorted[i]),
      reasoning: getReasoning(sorted[i]),
    });
  }
  return entries;
}

function accessibilityDimension(tools: AITool[]): ComparisonDimension {
  const sorted = [...tools].sort((a, b) => {
    const tierDiff = TIER_RANK[a.pricing.tier] - TIER_RANK[b.pricing.tier];
    if (tierDiff !== 0) return tierDiff;
    return cheapestPaidPrice(a) - cheapestPaidPrice(b);
  });
  return {
    key: "accessibility",
    icon: "💰",
    label: "ราคา / เข้าถึงง่าย",
    entries: toRanked(
      sorted,
      (t) => t.id,
      (t) => t.name,
      (t) => TIER_RANK[t.pricing.tier] * 10000 + (Number.isFinite(cheapestPaidPrice(t)) ? cheapestPaidPrice(t) : 9999),
      (t) => TIER_LABEL[t.pricing.tier],
      (t) => {
        if (t.pricing.tier === "free") return "ใช้งานได้เต็มรูปแบบโดยไม่เสียเงินเลย";
        if (t.pricing.tier === "freemium")
          return `มีแผนฟรี (${t.pricing.freeQuota ?? "โควตาจำกัด"}) ก่อนต้องอัปเกรด`;
        if (t.pricing.tier === "paid")
          return Number.isFinite(cheapestPaidPrice(t))
            ? `ไม่มีแผนฟรี เริ่มต้นที่ ${usdWithThb(cheapestPaidPrice(t))}/เดือน`
            : "ไม่มีแผนฟรี";
        return "จ่ายตามการใช้งานจริง คาดเดาค่าใช้จ่ายรายเดือนล่วงหน้ายากกว่าแผนตายตัว";
      },
    ),
  };
}

function commercialRightsDimension(tools: AITool[]): ComparisonDimension {
  const sorted = [...tools].sort(
    (a, b) =>
      CONFIDENCE_RANK[a.pricing.commercialUseSummary.confidence] -
      CONFIDENCE_RANK[b.pricing.commercialUseSummary.confidence],
  );
  return {
    key: "commercial",
    icon: "✅",
    label: "สิทธิ์การใช้งานเชิงพาณิชย์",
    entries: toRanked(
      sorted,
      (t) => t.id,
      (t) => t.name,
      (t) => CONFIDENCE_RANK[t.pricing.commercialUseSummary.confidence],
      (t) => CONFIDENCE_LABELS[t.pricing.commercialUseSummary.confidence] || "ไม่มีข้อมูล",
      (t) => t.pricing.commercialUseSummary.value.slice(0, 120) + (t.pricing.commercialUseSummary.value.length > 120 ? "…" : ""),
    ),
  };
}

function capabilityDimension(tools: AITool[]): ComparisonDimension | null {
  // Only meaningful when at least one tool has a sourced capability score —
  // otherwise every tool would tie at "no data", which isn't a comparison.
  const hasAny = tools.some((t) => t.capabilities.some((c) => c.score.confidence !== "unknown"));
  if (!hasAny) return null;

  const scored = tools.map((t) => {
    const known = t.capabilities.filter((c) => c.score.confidence !== "unknown");
    const best = known.sort((a, b) => b.score.value - a.score.value)[0];
    return { tool: t, best };
  });
  const sorted = [...scored].sort((a, b) => (b.best?.score.value ?? -1) - (a.best?.score.value ?? -1));

  return {
    key: "capability",
    icon: "🧠",
    label: "คะแนนความสามารถ (จากแหล่งอ้างอิงจริง)",
    entries: toRanked(
      sorted,
      (s) => s.tool.id,
      (s) => s.tool.name,
      (s) => -(s.best?.score.value ?? -1),
      (s) => (s.best ? `${s.best.score.value}/100 (${CAPABILITY_DIMENSION_LABELS[s.best.dimension] ?? s.best.dimension})` : "ไม่มีข้อมูล"),
      (s) =>
        s.best
          ? `คะแนนด้าน${CAPABILITY_DIMENSION_LABELS[s.best.dimension] ?? s.best.dimension}สูงสุดที่มีข้อมูล — ระดับความเชื่อมั่น "${s.best.score.confidence}"`
          : "ยังไม่มีคะแนนความสามารถที่ยืนยันแหล่งที่มาได้สำหรับตัวนี้",
    ),
    note: tools.some((t) => !t.capabilities.some((c) => c.score.confidence !== "unknown"))
      ? "บางตัวยังไม่มีคะแนนความสามารถที่ sourced ในระบบ — ไม่ได้แปลว่าตัวนั้นแย่กว่า แค่ยังไม่มีข้อมูลยืนยัน"
      : undefined,
  };
}

function popularityDimension(tools: AITool[]): ComparisonDimension {
  // If 2+ tools share the exact same usage-signal metric, that's a genuine
  // apples-to-apples number (e.g. both on the same LMArena board) — prefer
  // that over the generic "how many signals do we have" fallback.
  const metricCounts = new Map<string, number>();
  for (const t of tools) {
    for (const s of t.usageSignals) {
      if (s.value.confidence === "unknown") continue;
      metricCounts.set(s.metric, (metricCounts.get(s.metric) ?? 0) + 1);
    }
  }
  const sharedMetric = [...metricCounts.entries()].find(([, count]) => count >= 2)?.[0];

  if (sharedMetric) {
    const withMetric = tools
      .map((t) => ({ t, signal: t.usageSignals.find((s) => s.metric === sharedMetric && s.value.confidence !== "unknown") }))
      .filter((x) => x.signal);
    const withoutMetric = tools.filter((t) => !withMetric.some((x) => x.t.id === t.id));
    const higherIsBetter = sharedMetric !== "similarweb-rank";
    const sortedWith = [...withMetric].sort((a, b) =>
      higherIsBetter ? b.signal!.value.value - a.signal!.value.value : a.signal!.value.value - b.signal!.value.value,
    );

    const entries: RankedEntry[] = toRanked(
      sortedWith,
      (x) => x.t.id,
      (x) => x.t.name,
      (x) => (higherIsBetter ? -x.signal!.value.value : x.signal!.value.value),
      (x) => `${x.signal!.value.value} (${x.signal!.label})`,
      (x) => `เทียบตรงกับตัวอื่นในกลุ่มด้วยตัวชี้วัดเดียวกัน: ${x.signal!.label}`,
    );
    const nextRank = entries.length > 0 ? entries[entries.length - 1].rank + 1 : 1;
    for (const t of withoutMetric) {
      entries.push({
        toolId: t.id,
        toolName: t.name,
        rank: nextRank,
        value: "ไม่มีข้อมูลชนิดเดียวกัน",
        reasoning: "ไม่มีตัวชี้วัดความนิยมแบบเดียวกับตัวอื่นในกลุ่มนี้เพื่อเทียบโดยตรง",
      });
    }
    return { key: "popularity", icon: "📈", label: "ความนิยม / หลักฐานการใช้งานจริง", entries };
  }

  // Fallback: rank by how much sourced usage evidence exists at all.
  const sorted = [...tools].sort(
    (a, b) =>
      b.usageSignals.filter((s) => s.value.confidence !== "unknown").length -
      a.usageSignals.filter((s) => s.value.confidence !== "unknown").length,
  );
  return {
    key: "popularity",
    icon: "📈",
    label: "ความนิยม / หลักฐานการใช้งานจริง",
    entries: toRanked(
      sorted,
      (t) => t.id,
      (t) => t.name,
      (t) => -t.usageSignals.filter((s) => s.value.confidence !== "unknown").length,
      (t) => {
        const s = t.usageSignals.find((s) => s.value.confidence !== "unknown");
        return s ? `${s.value.value} (${s.label})` : "ไม่มีข้อมูล";
      },
      (t) => {
        const s = t.usageSignals.find((s) => s.value.confidence !== "unknown");
        return s
          ? `อ้างอิง ${s.label} — ไม่มีตัวชี้วัดร่วมกับตัวอื่นในกลุ่มนี้ให้เทียบตรงๆ`
          : "ยังไม่มีข้อมูลความนิยมที่ยืนยันแหล่งที่มาได้สำหรับตัวนี้";
      },
    ),
    note: "กลุ่มนี้ไม่มีตัวชี้วัดความนิยมชนิดเดียวกันระหว่างกัน จึงเทียบจาก 'จำนวนหลักฐานที่มี' แทนการเทียบตัวเลขตรงๆ",
  };
}

function reviewSentimentDimension(tools: AITool[]): ComparisonDimension {
  const sorted = [...tools].sort(
    (a, b) =>
      b.reviews.positiveThemes.length -
      b.reviews.negativeThemes.length -
      (a.reviews.positiveThemes.length - a.reviews.negativeThemes.length),
  );
  return {
    key: "reviews",
    icon: "🗣️",
    label: "รีวิวผู้ใช้จริง (บวก vs ลบ)",
    entries: toRanked(
      sorted,
      (t) => t.id,
      (t) => t.name,
      (t) => -(t.reviews.positiveThemes.length - t.reviews.negativeThemes.length),
      (t) => `+${t.reviews.positiveThemes.length} / −${t.reviews.negativeThemes.length}`,
      (t) => {
        const pos = t.reviews.positiveThemes[0];
        const neg = t.reviews.negativeThemes[0];
        const parts: string[] = [];
        if (pos) parts.push(`จุดที่ถูกชมบ่อย: ${pos}`);
        if (neg) parts.push(`จุดที่ถูกบ่นบ่อย: ${neg}`);
        return parts.join(" · ") || "ยังไม่มีธีมรีวิวที่บันทึกไว้";
      },
    ),
  };
}

function beginnerFitDimension(tools: AITool[]): ComparisonDimension {
  const tierBase: Record<PricingTier, number> = { free: 0, freemium: 1, paid: 2, "usage-based": 3 };
  const isBeginnerTagged = (t: AITool) => t.bestFor.some((b) => /มือใหม่|beginner|เริ่มต้น|ง่าย/i.test(b));
  const sorted = [...tools].sort((a, b) => {
    const scoreA = tierBase[a.pricing.tier] - (isBeginnerTagged(a) ? 1 : 0);
    const scoreB = tierBase[b.pricing.tier] - (isBeginnerTagged(b) ? 1 : 0);
    return scoreA - scoreB;
  });
  return {
    key: "beginner",
    icon: "🌱",
    label: "ความเหมาะสมกับมือใหม่",
    entries: toRanked(
      sorted,
      (t) => t.id,
      (t) => t.name,
      (t) => tierBase[t.pricing.tier] - (isBeginnerTagged(t) ? 1 : 0),
      (t) => (isBeginnerTagged(t) ? "ระบุไว้ว่าเหมาะมือใหม่" : TIER_LABEL[t.pricing.tier]),
      (t) => {
        const tag = t.bestFor.find((b) => /มือใหม่|beginner|เริ่มต้น|ง่าย/i.test(b));
        if (tag) return `ข้อมูลระบุตรงๆ ว่า "${tag}"`;
        if (t.pricing.tier === "free" || t.pricing.tier === "freemium")
          return "มีแผนฟรีให้ลองใช้ก่อนตัดสินใจ ความเสี่ยงต่ำสำหรับมือใหม่";
        return "ไม่มีแผนฟรีให้ทดลอง มือใหม่ต้องตัดสินใจจ่ายเงินก่อนเห็นผลจริง";
      },
    ),
  };
}

function freshnessDimension(tools: AITool[]): ComparisonDimension | null {
  const withDates = tools.filter((t) => t.lastProductUpdate);
  if (withDates.length === 0) return null;

  const sorted = [...tools].sort((a, b) => {
    const da = a.lastProductUpdate ? new Date(a.lastProductUpdate.value).getTime() : -Infinity;
    const db = b.lastProductUpdate ? new Date(b.lastProductUpdate.value).getTime() : -Infinity;
    return db - da;
  });
  return {
    key: "freshness",
    icon: "🕒",
    label: "อัปเดตจากผู้ให้บริการล่าสุด",
    entries: toRanked(
      sorted,
      (t) => t.id,
      (t) => t.name,
      (t) => -(t.lastProductUpdate ? new Date(t.lastProductUpdate.value).getTime() : -Infinity),
      (t) => t.lastProductUpdate?.value ?? "ไม่มีข้อมูล",
      (t) => {
        if (!t.lastProductUpdate) return "ยังไม่มีวันที่อัปเดตจากผู้ให้บริการที่ยืนยันได้สำหรับตัวนี้";
        const fresh = isRecentlyUpdated(t.lastProductUpdate.value);
        return `${t.lastProductUpdate.note ?? "อัปเดตล่าสุดที่ยืนยันได้"}${fresh ? " (ภายใน 7 วันที่ผ่านมา)" : ""}`;
      },
    ),
  };
}

/**
 * Full multi-dimension comparison — every selected tool is ranked (not just
 * the winner named) on every dimension, with a short reasoning line each.
 * Every dimension is computed purely from fields already in the catalog;
 * a dimension is omitted entirely (rather than faked) when no tool in the
 * current selection has sourced data for it.
 */
export function summarizeComparison(tools: AITool[]): ComparisonDimension[] {
  if (tools.length === 0) return [];
  return [
    accessibilityDimension(tools),
    commercialRightsDimension(tools),
    capabilityDimension(tools),
    popularityDimension(tools),
    reviewSentimentDimension(tools),
    beginnerFitDimension(tools),
    freshnessDimension(tools),
  ].filter((d): d is ComparisonDimension => d !== null);
}
