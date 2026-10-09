"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AITool } from "@/lib/types/ai-tool";
import { useBookmarks } from "@/lib/hooks/useBookmarks";
import { CATEGORY_LABELS } from "@/lib/labels";
import { PricingBadge } from "@/components/Badges";
import { BookmarkButton } from "@/components/BookmarkButton";
import { UpdateStamp } from "@/components/UpdateStamp";

export default function FavoritesPage() {
  const { bookmarks, hydrated } = useBookmarks();
  const [allTools, setAllTools] = useState<AITool[] | null>(null);

  useEffect(() => {
    if (bookmarks.length === 0) return;
    fetch("/api/tools")
      .then((res) => res.json())
      .then((data: { tools: AITool[] }) => setAllTools(data.tools))
      .catch(() => setAllTools([]));
  }, [bookmarks.length]);

  const savedTools = (allTools ?? []).filter((t) => bookmarks.includes(t.id));

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="text-xl font-semibold text-white">AI ที่บันทึกไว้</h1>
      <p className="mt-1 text-sm text-slate-400">
        รายการนี้เก็บไว้ในเบราว์เซอร์นี้เท่านั้น (localStorage) — เปิดจากเครื่อง/เบราว์เซอร์อื่นจะไม่เห็นรายการเดียวกัน
      </p>

      {!hydrated ? null : bookmarks.length === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-500">
          ยังไม่มี AI ที่บันทึกไว้ — กดปุ่ม ☆ ที่การ์ด AI หรือหน้ารายละเอียดเพื่อบันทึกไว้ดูทีหลัง
          <div className="mt-4">
            <Link href="/" className="text-violet-400 hover:underline">
              ← ไปค้นหา AI
            </Link>
          </div>
        </div>
      ) : allTools === null ? (
        <p className="mt-8 text-center text-slate-500">กำลังโหลด…</p>
      ) : (
        <div className="mt-6 space-y-3">
          {savedTools.map((tool) => (
            <div
              key={tool.id}
              className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/tool/${tool.id}`} className="font-semibold text-white hover:underline">
                    {tool.name}
                  </Link>
                  <span className="text-xs text-slate-500">{tool.vendor}</span>
                  {tool.discontinued ? (
                    <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-300">ปิดให้บริการแล้ว</span>
                  ) : (
                    <PricingBadge tier={tool.pricing.tier} />
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {tool.categories.map((c) => (
                    <span key={c} className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                      {CATEGORY_LABELS[c]}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-sm text-slate-300">{tool.shortDescription}</p>
                <UpdateStamp update={tool.lastProductUpdate} showNote className="mt-1.5" />
              </div>
              <BookmarkButton toolId={tool.id} compact />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
