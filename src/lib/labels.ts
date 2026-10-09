import type { AICategory, Confidence, PricingTier } from "@/lib/types/ai-tool";

export const CATEGORY_LABELS: Record<AICategory, string> = {
  chat: "แชท / เขียน",
  image: "สร้างภาพ",
  video: "สร้างวิดีโอ",
  audio: "สร้างเสียง/เพลง",
  code: "เขียนโค้ด",
  agent: "เอเจนต์อัตโนมัติ",
  multimodal: "หลายรูปแบบ",
  search: "ค้นข้อมูล",
};

export const PRICING_TIER_LABELS: Record<PricingTier, string> = {
  free: "ฟรี",
  freemium: "ฟรี + เสียเงิน",
  paid: "เสียเงินเท่านั้น",
  "usage-based": "จ่ายตามการใช้งาน",
};

export const PRICING_TIER_COLORS: Record<PricingTier, string> = {
  free: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  freemium: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  paid: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "usage-based": "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
};

// "probable" and "inference" share one label on purpose: for a reader both mean the same thing,
// "this did not come straight from the vendor", and the badge links the source so they can judge.
// "unknown" has no label: the value next to it already says there is no data.
export const NON_VENDOR_LABEL = "แหล่งข้อมูลไม่ใช่จากผู้ให้บริการโดยตรง";

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  verified: "ข้อมูลยืนยันจากผู้ให้บริการ",
  probable: NON_VENDOR_LABEL,
  inference: NON_VENDOR_LABEL,
  unknown: "",
};

export const CONFIDENCE_COLORS: Record<Confidence, string> = {
  verified: "text-emerald-400",
  probable: "text-sky-400",
  inference: "text-sky-400",
  unknown: "text-slate-500",
};

export const SCORE_DIMENSION_LABELS = {
  taskFit: "ตรงกับงาน",
  quality: "คุณภาพ",
  accessibility: "ใช้งานง่าย",
  costFit: "ตรงงบ",
  popularity: "ความนิยม",
} as const;

export const CAPABILITY_DIMENSION_LABELS: Record<string, string> = {
  chat: "แชท",
  image: "สร้างภาพ",
  video: "สร้างวิดีโอ",
  audio: "สร้างเสียง",
  code: "เขียนโค้ด",
  reasoning: "การให้เหตุผล",
  longContext: "อ่านเอกสารยาว",
  agentTools: "ทำงานอัตโนมัติ",
};
