import type { AICategory } from "../types/ai-tool";

/**
 * Categories the visitor is asked to choose between after pressing search,
 * when the prompt looks like an image or video generation prompt.
 *
 * To offer another category later (e.g. audio): widen `PickableCategory`, add
 * one entry to `PICKABLE_CATEGORIES`. The question sentence, the buttons, the
 * URL validation and the intent override all follow from this registry.
 *
 * This file imports nothing at runtime, so `intent.ts` and `categoryDetect.ts`
 * can both depend on it without a cycle.
 */
export type PickableCategory = "image" | "video";

// Compile-time guard: every pickable id must be a real catalog category.
const _pickableIsAICategory: PickableCategory extends AICategory ? true : never = true;
void _pickableIsAICategory;

export interface ImplicitSignal {
  /** Matched against the lower-cased raw prompt. */
  pattern: RegExp;
  weight: 1 | 2 | 3;
  label: string;
}

export interface PickableCategoryDef {
  id: PickableCategory;
  /** Text on the choice button, e.g. "วาดภาพ". */
  buttonLabel: string;
  /** Position in the question sentence and on the button row. */
  order: number;
  /** Extra explicit keywords on top of CATEGORY_KEYWORDS[id] in intent.ts. */
  explicitExtra: string[];
  /**
   * Thai substrings that contain a category keyword without meaning it
   * (substring matching has no word boundaries), removed before matching
   * THIS category only.
   */
  falsePositives: string[];
  /** Prompt-style vocabulary that signals generation without naming a medium. */
  implicit: ImplicitSignal[];
}

// Style vocabulary shared by image and video prompts (weight 1 each: several
// are needed together before the picker appears).
const SHARED_STYLE: ImplicitSignal[] = [
  { pattern: /cinematic/, weight: 1, label: "cinematic" },
  { pattern: /(?<![a-z0-9])[48]k(?![a-z0-9])/, weight: 1, label: "4k/8k" },
  { pattern: /highly detailed/, weight: 1, label: "highly detailed" },
  { pattern: /photorealistic|ultra realistic|hyper ?realistic/, weight: 1, label: "photorealistic" },
  { pattern: /octane render|unreal engine/, weight: 1, label: "render engine" },
  { pattern: /bokeh|depth of field/, weight: 1, label: "lens look" },
  { pattern: /volumetric lighting|golden hour|studio lighting/, weight: 1, label: "lighting" },
  { pattern: /masterpiece|best quality|trending on artstation/, weight: 1, label: "quality tags" },
  { pattern: /(?<![0-9])(16:9|9:16|1:1|4:3|21:9)(?![0-9])/, weight: 1, label: "aspect ratio" },
];

export const PICKABLE_CATEGORIES: Record<PickableCategory, PickableCategoryDef> = {
  video: {
    id: "video",
    buttonLabel: "วีดีโอ",
    order: 1,
    explicitExtra: ["ภาพยนตร์"],
    falsePositives: [],
    implicit: [
      ...SHARED_STYLE,
      { pattern: /--ar\s+\d+:\d+/, weight: 2, label: "--ar" },
      { pattern: /slow motion|timelapse|time-lapse|b-roll|drone shot|tracking shot|dolly/, weight: 2, label: "camera move" },
      { pattern: /camera (pan|zoom|movement)|pan (left|right)|zoom in/, weight: 2, label: "camera move" },
      { pattern: /(?<![a-z0-9])\d+ ?fps(?![a-z0-9])/, weight: 2, label: "fps" },
      { pattern: /มุมกล้อง|ซูมเข้า|สโลว์โมชัน/, weight: 2, label: "กล้อง" },
      // Model names are ambiguous words (a runway, a Sora), so weight 2.
      { pattern: /(?<![a-z0-9])(sora|veo|runway|kling|pika)(?![a-z0-9])/, weight: 2, label: "video model" },
    ],
  },
  image: {
    id: "image",
    buttonLabel: "วาดภาพ",
    order: 2,
    explicitExtra: [],
    falsePositives: [
      "ภาพรวม",
      "ภาพยนตร์",
      "ภาพลักษณ์",
      "สภาพ",
      "รูปแบบ",
      "รูปร่าง",
      "รูปธรรม",
      "วาดหวัง",
    ],
    implicit: [
      ...SHARED_STYLE,
      { pattern: /--ar\s+\d+:\d+/, weight: 3, label: "--ar" },
      { pattern: /--v\s*\d|--stylize|negative prompt:|cfg scale|(?<![a-z0-9])sampler(?![a-z0-9])/, weight: 3, label: "sd/mj flags" },
      { pattern: /midjourney|stable diffusion|(?<![a-z0-9])sdxl(?![a-z0-9])|dall-?e/, weight: 3, label: "image model" },
      { pattern: /(?<![a-z0-9])(flux|lora)(?![a-z0-9])/, weight: 2, label: "image model" },
      { pattern: /digital art|concept art|oil painting|watercolor|anime style|3d render/, weight: 2, label: "art style" },
      { pattern: /สมจริง|แสงสวย/, weight: 1, label: "ลักษณะภาพ" },
    ],
  },
};

export function pickableList(): PickableCategoryDef[] {
  return Object.values(PICKABLE_CATEGORIES).sort((a, b) => a.order - b.order);
}

export function isPickableCategory(v: unknown): v is PickableCategory {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(PICKABLE_CATEGORIES, v);
}

/** Validates the `category` URL param. Anything unexpected is ignored. */
export function parseCategoryParam(v: string | string[] | undefined): PickableCategory | undefined {
  return typeof v === "string" && isPickableCategory(v) ? v : undefined;
}

/** "คุณจะนำ Prompt นี้ไปใช้ในวีดีโอหรือวาดภาพ?" for the default two. */
export function buildQuestion(defs: PickableCategoryDef[] = pickableList()): string {
  const labels = defs.map((d) => d.buttonLabel);
  const list =
    labels.length <= 2
      ? labels.join("หรือ")
      : `${labels.slice(0, -1).join(", ")} หรือ${labels[labels.length - 1]}`;
  return `คุณจะนำ Prompt นี้ไปใช้ใน${list}?`;
}
