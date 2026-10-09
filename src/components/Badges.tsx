import type { Confidence, PricingTier } from "@/lib/types/ai-tool";
import {
  CONFIDENCE_COLORS,
  CONFIDENCE_LABELS,
  PRICING_TIER_COLORS,
  PRICING_TIER_LABELS,
} from "@/lib/labels";

export function PricingBadge({ tier }: { tier: PricingTier }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PRICING_TIER_COLORS[tier]}`}
    >
      {PRICING_TIER_LABELS[tier]}
    </span>
  );
}

/**
 * How sure we are of a fact. `source` adds the link and says which fact it is about, so a reader who
 * sees "not directly from the vendor" can open the page and check. Renders nothing for "unknown".
 */
export function ConfidenceBadge({
  confidence,
  source,
}: {
  confidence: Confidence;
  source?: { url: string | null; topic: string };
}) {
  const label = CONFIDENCE_LABELS[confidence];
  if (!label) return null;
  const showSource = confidence !== "verified" && source;
  return (
    <span className={`text-[11px] font-medium ${CONFIDENCE_COLORS[confidence]}`}>
      ● {label}
      {showSource &&
        (source.url ? (
          <>
            {" "}
            <span className="font-normal text-slate-500">(เรื่อง{source.topic})</span>{" "}
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-normal text-violet-400 hover:underline"
            >
              ดูแหล่งข้อมูล ↗
            </a>
          </>
        ) : (
          <span className="font-normal text-slate-500"> (เรื่อง{source.topic})</span>
        ))}
    </span>
  );
}

export function CategoryPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
      {label}
    </span>
  );
}
