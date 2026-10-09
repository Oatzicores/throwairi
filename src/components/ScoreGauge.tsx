import type { ScoreBreakdown } from "@/lib/match/score";
import { SCORE_WEIGHTS } from "@/lib/match/score";
import { SCORE_DIMENSION_LABELS } from "@/lib/labels";

const SEGMENT_COLORS: Record<keyof typeof SCORE_DIMENSION_LABELS, string> = {
  taskFit: "bg-violet-500",
  quality: "bg-indigo-500",
  accessibility: "bg-sky-500",
  costFit: "bg-teal-500",
  popularity: "bg-amber-500",
};

export function ScoreGauge({ breakdown }: { breakdown: ScoreBreakdown }) {
  const dims = Object.keys(SCORE_DIMENSION_LABELS) as (keyof typeof SCORE_DIMENSION_LABELS)[];

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-slate-400">ระดับความตรง Prompt</span>
        <span className="text-lg font-semibold text-white">{breakdown.overall}/100</span>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-800">
        {dims.map((dim) => {
          const weight = SCORE_WEIGHTS[dim];
          const contribution = (breakdown[dim] * weight) / 100;
          const widthPercent = contribution * 100;
          return (
            <div
              key={dim}
              className={SEGMENT_COLORS[dim]}
              style={{ width: `${widthPercent}%` }}
              title={`${SCORE_DIMENSION_LABELS[dim]}: ${breakdown[dim]}/100 (น้ำหนัก ${Math.round(weight * 100)}%)`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
        {dims.map((dim) => (
          <span key={dim} className="inline-flex items-center gap-1">
            <span className={`inline-block h-2 w-2 rounded-full ${SEGMENT_COLORS[dim]}`} />
            {SCORE_DIMENSION_LABELS[dim]} {breakdown[dim]}
          </span>
        ))}
      </div>
    </div>
  );
}
