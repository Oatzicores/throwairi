"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { AITool } from "@/lib/types/ai-tool";
import { CATEGORY_LABELS, PRICING_TIER_LABELS } from "@/lib/labels";
import { usdWithThb } from "@/lib/currency";
import { ComparePicker } from "./ComparePicker";
import { CompareSummary } from "./CompareSummary";
import { PricingBadge, ConfidenceBadge } from "./Badges";

export function CompareApp({
  catalog,
  initialSelectedIds,
}: {
  catalog: AITool[];
  initialSelectedIds: string[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [pickerOpen, setPickerOpen] = useState(initialSelectedIds.length === 0);

  // Keep the address bar shareable without asking Next.js to re-render the
  // route from the server on every click — a plain checkbox toggle has no
  // business round-tripping to the server, and doing so is what made this
  // page feel like it reloaded on every click.
  useEffect(() => {
    const url = selectedIds.length > 0 ? `/compare?ids=${selectedIds.join(",")}` : "/compare";
    window.history.replaceState(null, "", url);
  }, [selectedIds]);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }, []);

  const tools = selectedIds
    .map((id) => catalog.find((t) => t.id === id))
    .filter((t): t is AITool => Boolean(t));

  // The picker is always the same mounted element (never swapped out for a
  // different subtree) so its checkboxes never shift position or lose their
  // open/closed state out from under a click mid-selection — that's what
  // caused only the first pick to register when picking several in a row.
  // Wide screens: picker in a sticky left sidebar, comparison on the right. Phones: one column, the
  // picker sits on top behind a collapse button (same mounted element either way).
  const summaryText =
    tools.length > 0
      ? `AI ที่เลือก (${tools.length}/4): ${tools.map((t) => t.name).join(", ")}`
      : "เลือก AI สูงสุด 4 ตัวเพื่อเปรียบเทียบ";

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          aria-expanded={pickerOpen}
          aria-controls="compare-picker"
          className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-left text-sm text-slate-200 hover:border-slate-600 lg:hidden"
        >
          <span>{summaryText}</span>
          <span className="text-slate-500">{pickerOpen ? "ซ่อน ▲" : "แก้ไข ▼"}</span>
        </button>
        <div id="compare-picker" className={`${pickerOpen ? "mt-3 block" : "hidden"} lg:mt-0 lg:block`}>
          <ComparePicker catalog={catalog} selectedIds={selectedIds} onToggle={toggle} />
        </div>
      </aside>

      <div className="min-w-0 space-y-6">
      {tools.length > 0 && <CompareSummary tools={tools} onRemove={toggle} />}

      {tools.length > 0 && (
      <div className="overflow-x-auto overflow-y-hidden pb-1">
        <table className="w-full min-w-[26rem] border-collapse text-sm sm:min-w-[640px]">
          <thead>
            <tr>
              <th className="w-20 border-b border-slate-800 pb-3 text-left text-xs font-medium text-slate-500 sm:w-40">
                หัวข้อ
              </th>
              {tools.map((tool) => (
                <th key={tool.id} className="border-b border-slate-800 px-3 pb-3 text-left">
                  <Link href={`/tool/${tool.id}`} className="font-semibold text-white hover:underline">
                    {tool.name}
                  </Link>
                  <div className="text-xs font-normal text-slate-500">{tool.vendor}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="align-top">
            <Row label="ประเภท">
              {tools.map((t) => (
                <td key={t.id} className="px-3 py-3 text-slate-300">
                  {t.categories.map((c) => CATEGORY_LABELS[c]).join(", ")}
                </td>
              ))}
            </Row>
            <Row label="ราคา">
              {tools.map((t) => (
                <td key={t.id} className="px-3 py-3">
                  <PricingBadge tier={t.pricing.tier} />
                  <div className="mt-1 text-xs text-slate-500">
                    {t.pricing.plans[0]
                      ? t.pricing.plans[0].priceUsdPerMonth === 0
                        ? "มีแผนฟรี"
                        : (t.pricing.plans[0].priceUsdPerMonth === null ? "เริ่มต้น ?/เดือน" : `เริ่มต้น ${usdWithThb(t.pricing.plans[0].priceUsdPerMonth)}/เดือน`)
                      : "-"}
                  </div>
                </td>
              ))}
            </Row>
            <Row label="แผนฟรี">
              {tools.map((t) => (
                <td key={t.id} className="px-3 py-3 text-slate-300">
                  {t.pricing.freeQuota ?? "ไม่มีแผนฟรี"}
                </td>
              ))}
            </Row>
            <Row label="สิทธิ์เชิงพาณิชย์">
              {tools.map((t) => (
                <td key={t.id} className="px-3 py-3">
                  <div className="flex items-start gap-1.5">
                    <ConfidenceBadge confidence={t.pricing.commercialUseSummary.confidence} source={{ url: t.pricing.commercialUseSummary.sourceUrl, topic: "สิทธิ์เชิงพาณิชย์" }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{t.pricing.commercialUseSummary.value}</p>
                </td>
              ))}
            </Row>
            <Row label="จุดแข็ง">
              {tools.map((t) => (
                <td key={t.id} className="px-3 py-3 text-slate-300">
                  <ul className="space-y-0.5">
                    {t.strengths.slice(0, 3).map((s, i) => (
                      <li key={i}>+ {s}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </Row>
            <Row label="จุดอ่อน">
              {tools.map((t) => (
                <td key={t.id} className="px-3 py-3 text-slate-300">
                  <ul className="space-y-0.5">
                    {t.weaknesses.slice(0, 3).map((s, i) => (
                      <li key={i}>− {s}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </Row>
            <Row label="เหมาะกับ">
              {tools.map((t) => (
                <td key={t.id} className="px-3 py-3 text-slate-300">
                  {t.bestFor.join(" · ")}
                </td>
              ))}
            </Row>
          </tbody>
        </table>
        <p className="mt-3 text-xs text-slate-600">
          ป้าย {PRICING_TIER_LABELS.free} / {PRICING_TIER_LABELS.freemium} / {PRICING_TIER_LABELS.paid} /{" "}
          {PRICING_TIER_LABELS["usage-based"]} อ้างอิงหน้าราคาทางการ ณ วันที่ตรวจสอบล่าสุดของแต่ละตัว — ดูรายละเอียดเต็มที่หน้าเดี่ยวของแต่ละ AI
        </p>
      </div>
      )}

      {tools.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-500">
          ยังไม่ได้เลือก AI — เลือกจากรายการด้านซ้าย (หรือด้านบนบนมือถือ)
        </p>
      )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="border-b border-slate-800/60 py-3 pr-3 text-xs font-medium text-slate-500">{label}</td>
      {children}
    </tr>
  );
}
