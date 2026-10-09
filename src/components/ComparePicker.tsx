"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { AITool } from "@/lib/types/ai-tool";
import { CATEGORY_LABELS } from "@/lib/labels";
import { matchFinder } from "@/lib/prompts/finder";
import { ToolLogo } from "./ToolLogo";
import { UpdateStamp } from "./UpdateStamp";

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" });
};

export function ComparePicker({
  catalog,
  selectedIds,
  onToggle,
}: {
  catalog: AITool[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<"az" | "za">("az");
  // The card is position:fixed so the scrolling sidebar list cannot clip it.
  const [hover, setHover] = useState<{ id: string; top: number; left: number } | null>(null);
  const uid = useId();
  const hoverId = hover?.id ?? null;
  const setHoverId = (updater: null | ((cur: string | null) => string | null)) =>
    setHover((cur) => (updater === null ? null : updater(cur?.id ?? null) === null ? null : cur));

  const showCard = (id: string, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const W = 320;
    const beside = r.right + 8 + W <= window.innerWidth; // wide screens: to the right of the list
    const left = beside ? r.right + 8 : Math.max(8, Math.min(r.left, window.innerWidth - W - 8));
    const top = beside ? Math.max(8, Math.min(r.top, window.innerHeight - 230)) : Math.min(r.bottom + 4, window.innerHeight - 230);
    setHover({ id, top, left });
  };

  // A fixed card would float away from its row when the page or the list scrolls: close it instead.
  useEffect(() => {
    if (!hover) return;
    const close = () => setHover(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [hover]);

  // The search decides WHO is listed; A-Z / Z-A decides the order of that list.
  const shown = useMemo(() => {
    const list = matchFinder(catalog, query);
    const dir = order === "az" ? 1 : -1;
    return [...list].sort((a, b) => dir * a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  }, [catalog, query, order]);

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">เลือก AI สูงสุด 4 ตัวเพื่อเปรียบเทียบ</h2>
        <span className="text-xs text-slate-500">{selectedIds.length}/4</span>
      </div>

      <label htmlFor={`${uid}-q`} className="sr-only">
        ค้นหา AI
      </label>
      <input
        id={`${uid}-q`}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ค้นหา AI พิมพ์แค่บางส่วนก็ได้ เช่น kl, chat, runway"
        autoComplete="off"
        className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
      />
      <div role="group" aria-label="เรียงลำดับตามชื่อ" className="mt-2 flex items-center gap-2">
        <span className="text-xs text-slate-500">เรียง:</span>
        {(
          [
            ["az", "A → Z"],
            ["za", "Z → A"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setOrder(value)}
            aria-pressed={order === value}
            className={`min-h-[44px] rounded-full border px-3 py-1 text-xs sm:min-h-[32px] font-medium transition ${
              order === value
                ? "border-violet-400 bg-violet-500/20 text-violet-100"
                : "border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-slate-500" aria-live="polite">
        {query ? `พบ ${shown.length} จาก ${catalog.length} ตัว` : "เอาเมาส์ชี้ที่ชื่อ AI เพื่อดูรุ่นล่าสุดที่ผู้ให้บริการระบุ"}
      </p>

      {shown.length === 0 && (
        <p className="mt-3 text-sm text-slate-400">ไม่พบ AI ที่ตรงกับ &ldquo;{query}&rdquo; ลองพิมพ์ให้สั้นลง</p>
      )}

      <div className="mt-3 grid grid-cols-1 gap-1.5 lg:max-h-[calc(100vh-17rem)] lg:overflow-y-auto lg:pr-1">
        {shown.map((tool) => {
          const checked = selectedIds.includes(tool.id);
          const disabled = !checked && selectedIds.length >= 4;
          const open = hoverId === tool.id;
          const cardId = `${uid}-card-${tool.id}`;
          return (
            <div
              key={tool.id}
              className="relative"
              onMouseEnter={(e) => showCard(tool.id, e.currentTarget)}
              onMouseLeave={() => setHoverId((cur) => (cur === tool.id ? null : cur))}
              onFocus={(e) => showCard(tool.id, e.currentTarget)}
              onBlur={(e) => {
                // Focus moving to a link inside the card must not close it.
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  setHoverId((cur) => (cur === tool.id ? null : cur));
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setHoverId(null);
              }}
            >
              <label
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  checked
                    ? "border-violet-500 bg-violet-500/10 text-white"
                    : disabled
                      ? "border-slate-800 text-slate-600"
                      : "border-slate-800 text-slate-300 hover:border-slate-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggle(tool.id)}
                  aria-describedby={open ? cardId : undefined}
                  className="accent-violet-500"
                />
                <ToolLogo id={tool.id} name={tool.name} size={22} />
                <span className="truncate">{tool.name}</span>
                <span className="ml-auto text-[10px] text-slate-500">
                  {tool.categories.map((c) => CATEGORY_LABELS[c]).join(", ")}
                </span>
              </label>
              {open && hover && <HoverCard id={cardId} tool={tool} top={hover.top} left={hover.left} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HoverCard({ id, tool, top, left }: { id: string; tool: AITool; top: number; left: number }) {
  const v = tool.latestVersion;
  return (
    <div
      id={id}
      role="tooltip"
      style={{ top, left }}
      className="fixed z-50 w-80 max-w-[calc(100vw-1rem)] rounded-lg border border-slate-600 bg-slate-950 p-3 text-xs leading-relaxed text-slate-300 shadow-xl"
    >
      <p className="text-slate-500">{tool.name} · รุ่นล่าสุดที่ผู้ให้บริการระบุ</p>
      <UpdateStamp update={tool.lastProductUpdate} showNote className="mt-1" />
      {v ? (
        <>
          <p className="mt-1 text-base font-semibold text-white">{v.name}</p>
          <p className="mt-1 text-slate-400">
            {v.releaseDate ? (
              <>เปิดตัว {formatDate(v.releaseDate)} · </>
            ) : (
              <>ผู้ให้บริการไม่ระบุวันเปิดตัว · </>
            )}
            ตรวจเมื่อ {formatDate(v.lastVerified)}
          </p>
          {v.note && <p className="mt-1 text-slate-500">{v.note}</p>}
          <a
            href={v.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-block text-violet-400 hover:underline"
          >
            เปิดแหล่งที่มา ↗
          </a>
        </>
      ) : (
        <p className="mt-1 text-slate-400">
          ยังไม่มีข้อมูลรุ่นล่าสุดที่ยืนยันจากหน้าทางการของผู้ให้บริการ เราจึงไม่เดา
        </p>
      )}
    </div>
  );
}
