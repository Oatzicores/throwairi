"use client";

import { useState } from "react";
import type { AITool } from "@/lib/types/ai-tool";
import { summarizeComparison } from "@/lib/match/compareSummary";

const RANK_BADGE = ["🥇", "🥈", "🥉"];

export function CompareSummary({
  tools,
  onRemove,
}: {
  tools: AITool[];
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (tools.length === 0) return null;

  const dimensions = summarizeComparison(tools);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[44px] w-full items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-white">
          📋 สรุปผลเปรียบเทียบ — ใครชนะด้านไหนบ้าง
        </span>
        <span className="text-xs text-violet-400">{open ? "ซ่อน ▲" : "ดูสรุป ▼"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-5">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4 text-xs">
            <span className="text-slate-500">กำลังเปรียบเทียบ:</span>
            {tools.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onRemove(t.id)}
                title="เอาตัวนี้ออกจากการเปรียบเทียบ"
                className="flex items-center gap-1 rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-1 text-violet-300 hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300"
              >
                {t.name}
                <span className="text-slate-500">×</span>
              </button>
            ))}
            <span className="ml-auto text-slate-600">สลับตัวได้จากรายการด้านล่าง — สรุปนี้อัปเดตให้เองทุกครั้ง</span>
          </div>

          {dimensions.map((dim) => (
            <div key={dim.key}>
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
                <span>{dim.icon}</span>
                <span>{dim.label}</span>
              </h3>
              <ol className="mt-2 space-y-1.5">
                {dim.entries.map((entry) => (
                  <li
                    key={entry.toolId}
                    className="flex items-start gap-2 rounded-lg bg-slate-800/40 px-3 py-2 text-sm"
                  >
                    <span className="w-7 flex-none text-center font-semibold text-slate-400">
                      {RANK_BADGE[entry.rank - 1] ?? `#${entry.rank}`}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-medium text-white">{entry.toolName}</span>
                      <span className="ml-1.5 text-slate-500">({entry.value})</span>
                      <div className="mt-0.5 text-xs text-slate-400">{entry.reasoning}</div>
                    </span>
                  </li>
                ))}
              </ol>
              {dim.note && <p className="mt-1.5 text-xs text-amber-400">⚠️ {dim.note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
