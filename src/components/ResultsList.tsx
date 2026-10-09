"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { MatchResult } from "@/lib/match/score";
import type { KeywordHit } from "@/lib/match/intent";
import type { AICategory, PricingTier } from "@/lib/types/ai-tool";
import { CATEGORY_LABELS, PRICING_TIER_LABELS } from "@/lib/labels";
import { usdWithThb } from "@/lib/currency";
import { applyView, cheapestMonthly, countBy } from "@/lib/results/viewFilter";
import type { RankedResult, SortKey } from "@/lib/results/viewFilter";
import { ToolCard } from "./ToolCard";
import { ToolLogo } from "./ToolLogo";
import { ConfidenceBadge, PricingBadge } from "./Badges";
import { SubscribeButton } from "./SubscribeButton";

const SORT_LABELS: Record<SortKey, string> = {
  match: "ตรงกับ Prompt มากสุด",
  price: "ราคาถูกสุดก่อน",
  popularity: "ความนิยมสูงสุดก่อน",
  name: "ชื่อ A → Z",
};

const TIER_ORDER: PricingTier[] = ["free", "freemium", "usage-based", "paid"];

/**
 * Results page: filter sidebar on the left (a collapsible panel on phones), cards or a dense table on
 * the right. The sidebar only filters and re-orders what matchTools() already scored; it never changes a
 * score. `sidebarExtra` is the server-rendered news / compare block placed under the filters.
 */
export function ResultsList({
  results,
  rawPrompt,
  keywordHits,
  sidebarExtra,
}: {
  results: MatchResult[];
  rawPrompt: string;
  keywordHits: KeywordHit[];
  sidebarExtra?: React.ReactNode;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("match");
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [categories, setCategories] = useState<AICategory[]>([]);
  const [view, setView] = useState<"cards" | "table">("cards");
  const [panelOpen, setPanelOpen] = useState(false);

  const shown = useMemo(() => applyView(results, { sortKey, tiers, categories }), [results, sortKey, tiers, categories]);
  const tierCounts = useMemo(() => countBy(results, (r) => [r.tool.pricing.tier]), [results]);
  const categoryCounts = useMemo(() => countBy(results, (r) => r.tool.categories), [results]);
  const categoryList = useMemo(
    () => [...categoryCounts.keys()].sort((a, b) => CATEGORY_LABELS[a].localeCompare(CATEGORY_LABELS[b], "th")),
    [categoryCounts],
  );
  const activeFilters = tiers.length + categories.length;

  const toggle = <T,>(list: T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const clear = () => {
    setTiers([]);
    setCategories([]);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          aria-expanded={panelOpen}
          aria-controls="results-filters"
          className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 lg:hidden"
        >
          <span>ตัวกรองและมุมมอง{activeFilters > 0 ? ` (${activeFilters})` : ""}</span>
          <span className="text-slate-500">{panelOpen ? "ซ่อน ▲" : "แสดง ▼"}</span>
        </button>

        <div id="results-filters" className={`${panelOpen ? "mt-3 block" : "hidden"} space-y-4 lg:mt-0 lg:block`}>
          <FilterBox title="มุมมอง">
            <div role="group" aria-label="เลือกมุมมอง" className="grid grid-cols-2 gap-1 rounded-lg bg-slate-950/60 p-1">
              {(
                [
                  ["cards", "การ์ด"],
                  ["table", "ตาราง"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={view === value}
                  onClick={() => setView(value)}
                  className={`min-h-[44px] rounded-md text-xs font-medium transition lg:min-h-[36px] ${
                    view === value ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </FilterBox>

          <FilterBox title="เรียงตาม">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label="เรียงตาม"
              className="min-h-[44px] w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-200 focus:border-violet-500 focus:outline-none lg:min-h-0"
            >
              {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </FilterBox>

          <FilterBox title="ราคา">
            <ul className="space-y-1.5">
              {TIER_ORDER.filter((t) => tierCounts.has(t)).map((t) => (
                <li key={t}>
                  <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-slate-300 lg:min-h-[28px]">
                    <input
                      type="checkbox"
                      checked={tiers.includes(t)}
                      onChange={() => setTiers(toggle(tiers, t))}
                      className="accent-violet-500"
                    />
                    <span>{PRICING_TIER_LABELS[t]}</span>
                    <span className="ml-auto text-xs text-slate-500">{tierCounts.get(t)}</span>
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setTiers(["free", "freemium"])}
              className="mt-1 min-h-[44px] text-xs text-violet-400 hover:underline lg:min-h-0"
            >
              แสดงเฉพาะที่มีแผนฟรี
            </button>
          </FilterBox>

          {categoryList.length > 1 && (
            <FilterBox title="ประเภทงาน">
              <ul className="space-y-1.5">
                {categoryList.map((c) => (
                  <li key={c}>
                    <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-slate-300 lg:min-h-[28px]">
                      <input
                        type="checkbox"
                        checked={categories.includes(c)}
                        onChange={() => setCategories(toggle(categories, c))}
                        className="accent-violet-500"
                      />
                      <span>{CATEGORY_LABELS[c]}</span>
                      <span className="ml-auto text-xs text-slate-500">{categoryCounts.get(c)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </FilterBox>
          )}

          {activeFilters > 0 && (
            <button type="button" onClick={clear} className="min-h-[44px] w-full rounded-lg border border-slate-700 py-2 text-xs text-slate-300 hover:border-slate-500 hover:text-white">
              ล้างตัวกรอง ({activeFilters})
            </button>
          )}

          {sidebarExtra}
        </div>
      </aside>

      <div className="min-w-0 space-y-4">
        <p className="text-xs text-slate-500" aria-live="polite">
          แสดง {shown.length} จาก {results.length} รายการ
        </p>

        {view === "cards" ? (
          shown.map(({ result, originalRank }, i) => (
            <ToolCard
              key={result.tool.id}
              result={result}
              rank={sortKey === "match" ? originalRank : i + 1}
              rawPrompt={rawPrompt}
              keywordHits={keywordHits}
            />
          ))
        ) : (
          <ResultsTable rows={shown} showOriginalRank={sortKey === "match"} />
        )}

        {shown.length === 0 && (
          <p className="text-slate-400">
            {activeFilters > 0 ? "ไม่มี AI ที่ตรงกับตัวกรองที่เลือก ลองล้างตัวกรองดู" : "ไม่พบ AI ที่ตรงกับ Prompt นี้ในฐานข้อมูลปัจจุบัน"}
          </p>
        )}
      </div>
    </div>
  );
}

function FilterBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-violet-500/15 bg-slate-900/60 p-3">
      <h2 className="mb-2 text-xs font-semibold tracking-wide text-slate-400">{title}</h2>
      {children}
    </section>
  );
}

function ResultsTable({ rows, showOriginalRank }: { rows: RankedResult[]; showOriginalRank: boolean }) {
  return (
    <div className="overflow-x-auto overflow-y-hidden rounded-2xl border border-violet-500/20 bg-slate-900/60">
      <table className="w-full min-w-[46rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
            <th className="px-3 py-2.5 font-medium">#</th>
            <th className="px-3 py-2.5 font-medium">เครื่องมือ</th>
            <th className="px-3 py-2.5 font-medium">ราคา</th>
            <th className="px-3 py-2.5 font-medium">สิทธิ์เชิงพาณิชย์</th>
            <th className="px-3 py-2.5 font-medium">รุ่นล่าสุด</th>
            <th className="px-3 py-2.5 text-right font-medium">ความตรง</th>
            <th className="px-3 py-2.5 font-medium">
              <span className="sr-only">ลิงก์</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ result, originalRank }, i) => {
            const { tool, breakdown } = result;
            const from = cheapestMonthly(result);
            const rank = showOriginalRank ? originalRank : i + 1;
            return (
              <tr key={tool.id} className="border-b border-slate-800/60 align-top last:border-0">
                <td className="px-3 py-3 font-mono text-xs text-violet-300">{String(rank).padStart(2, "0")}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <ToolLogo id={tool.id} name={tool.name} size={32} />
                    <div className="min-w-0">
                      <Link href={`/tool/${tool.id}`} className="font-semibold text-white hover:underline">
                        {tool.name}
                      </Link>
                      <div className="text-xs text-slate-500">{tool.vendor}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <PricingBadge tier={tool.pricing.tier} />
                  <div className="mt-1 text-xs text-slate-500">
                    {tool.pricing.tier === "free"
                      ? "ฟรี"
                      : Number.isFinite(from)
                        ? from === 0
                          ? "มีแผนฟรี"
                          : `เริ่มต้น ${usdWithThb(from)}/เดือน`
                        : "-"}
                  </div>
                </td>
                <td className="max-w-[16rem] px-3 py-3">
                  <ConfidenceBadge confidence={tool.pricing.commercialUseSummary.confidence} source={{ url: tool.pricing.commercialUseSummary.sourceUrl, topic: "สิทธิ์เชิงพาณิชย์" }} />
                  <p className="mt-1 line-clamp-3 text-xs text-slate-400">{tool.pricing.commercialUseSummary.value}</p>
                </td>
                <td className="px-3 py-3 text-xs text-slate-300">
                  {tool.latestVersion ? (
                    <span title={`ตรวจ ${tool.latestVersion.lastVerified}`}>{tool.latestVersion.name}</span>
                  ) : (
                    <span className="text-slate-600">ยังไม่มีข้อมูล</span>
                  )}
                </td>
                <td className="px-3 py-3 text-right font-mono text-sm text-slate-200">{breakdown.overall}/100</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Link href={`/tool/${tool.id}`} className="text-xs font-medium text-violet-400 hover:text-violet-300">
                      รายละเอียด →
                    </Link>
                    <SubscribeButton tool={tool} variant="card" />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
