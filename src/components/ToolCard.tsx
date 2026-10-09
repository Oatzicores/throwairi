import Link from "next/link";
import type { MatchResult } from "@/lib/match/score";
import type { KeywordHit } from "@/lib/match/intent";
import { buildAnnotatedSegments } from "@/lib/match/promptAnalysis";
import { CATEGORY_LABELS } from "@/lib/labels";
import { ScoreGauge } from "./ScoreGauge";
import { PricingBadge } from "./Badges";
import { BookmarkButton } from "./BookmarkButton";
import { ConfidenceBadge } from "./Badges";
import { PromptAnalysisBlock } from "./PromptAnalysisBlock";
import { isRecentlyUpdated } from "@/lib/freshness";
import { SubscribeButton } from "./SubscribeButton";
import { ToolLogo } from "./ToolLogo";

export function ToolCard({
  result,
  rank,
  rawPrompt,
  keywordHits,
}: {
  result: MatchResult;
  rank: number;
  rawPrompt: string;
  keywordHits: KeywordHit[];
}) {
  const { tool, breakdown, reasons, warnings } = result;
  const productUpdate = tool.lastProductUpdate;
  const productFreshlyUpdated = productUpdate ? isRecentlyUpdated(productUpdate.value) : false;
  const promptSegments = buildAnnotatedSegments(rawPrompt, keywordHits, tool, result);

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-slate-900/60 p-4 shadow-[0_0_28px_-14px_rgba(139,92,246,0.7)] transition hover:border-violet-400/40 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex flex-none flex-col items-center gap-1.5">
          <span className="font-mono text-xs font-semibold tracking-wider text-violet-300" aria-label={`อันดับ ${rank}`}>
            {String(rank).padStart(2, "0")}
          </span>
          <ToolLogo id={tool.id} name={tool.name} size={44} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/tool/${tool.id}`} className="text-lg font-semibold text-white hover:underline">
              {tool.name}
            </Link>
            <span className="text-xs text-slate-500">{tool.vendor}</span>
            <PricingBadge tier={tool.pricing.tier} />
            {productUpdate && (
              <span className="text-[11px]">
                <span className="text-slate-500">อัปเดต </span>
                <span className={productFreshlyUpdated ? "rainbow-text" : "text-slate-500"}>
                  {productUpdate.value}
                </span>
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {tool.categories.map((c) => (
              <span key={c} className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                {CATEGORY_LABELS[c]}
              </span>
            ))}
          </div>
        </div>
        <BookmarkButton toolId={tool.id} compact />
      </div>

      {/* Below the header row so it uses the full card width on phones; lines up with the title from sm up. */}
      <div className="mt-3 sm:pl-14">
        <p className="text-sm text-slate-300">{tool.shortDescription}</p>
        <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <span>สิทธิ์เชิงพาณิชย์: {tool.pricing.commercialUseSummary.value}</span>
          <ConfidenceBadge confidence={tool.pricing.commercialUseSummary.confidence} source={{ url: tool.pricing.commercialUseSummary.sourceUrl, topic: "สิทธิ์เชิงพาณิชย์" }} />
          <span>· ตรวจข้อมูลราคา {tool.pricing.lastVerified}</span>
        </p>
      </div>

      <PromptAnalysisBlock segments={promptSegments} />

      <div className="mt-4">
        <ScoreGauge breakdown={breakdown} />
      </div>

      <ul className="mt-3 space-y-1 text-sm text-slate-300">
        {reasons.map((reason, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-emerald-400">✓</span>
            <span>{reason}</span>
          </li>
        ))}
      </ul>

      {warnings.length > 0 && (
        <div className="mt-3 space-y-1 rounded-lg bg-amber-500/10 p-2.5 text-xs text-amber-300">
          {warnings.map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Link
          href={`/tool/${tool.id}`}
          className="text-sm font-medium text-violet-400 hover:text-violet-300"
        >
          ดูรายละเอียดเต็ม →
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
          <SubscribeButton tool={tool} variant="card" />
          <a
            href={tool.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            เว็บไซต์ทางการ ↗
          </a>
        </div>
      </div>
    </div>
  );
}
