"use client";

import { useBookmarks } from "@/lib/hooks/useBookmarks";

export function BookmarkButton({ toolId, compact = false }: { toolId: string; compact?: boolean }) {
  const { hydrated, isBookmarked, toggleBookmark } = useBookmarks();
  const saved = hydrated && isBookmarked(toolId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleBookmark(toolId);
      }}
      aria-pressed={saved}
      title={saved ? "เอาออกจากรายการที่บันทึกไว้" : "บันทึกไว้ดูทีหลัง"}
      className={
        compact
          ? `flex h-10 w-10 sm:h-8 sm:w-8 flex-none items-center justify-center rounded-full border text-sm transition ${
              saved
                ? "border-amber-400/60 bg-amber-400/10 text-amber-300"
                : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
            }`
          : `flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              saved
                ? "border-amber-400/60 bg-amber-400/10 text-amber-300"
                : "border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
            }`
      }
    >
      <span>{saved ? "★" : "☆"}</span>
      {!compact && <span>{saved ? "บันทึกแล้ว" : "บันทึกไว้ดูทีหลัง"}</span>}
    </button>
  );
}
