"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { matchFinder } from "@/lib/prompts/finder";
import type { FinderTool } from "@/lib/prompts/finder";
import { useToolPool } from "./ToolPoolProvider";
import { SubscribeButton } from "./SubscribeButton";
import { ToolLogo } from "./ToolLogo";

const KIND_LABEL = {
  "vendor-guide": "คู่มือของผู้ให้บริการ",
  leaderboard: "ตารางโหวตของบุคคลที่สาม",
} as const;

/**
 * "อยากลอง AI ตัวอื่น?" — type any part of a name (or nothing: the whole list
 * is shown) and pick a tool. It only shows what we can source; for a tool we
 * have not assessed against this prompt it says so instead of implying a fit.
 */
export function ToolFinder({
  recommended,
  categoryLabel,
}: {
  /** toolId -> role for the picks already shown on this prompt card. */
  recommended: Record<string, "best" | "alt">;
  categoryLabel: string;
}) {
  const pool = useToolPool();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const uid = useId();

  const matches = useMemo(() => matchFinder(pool, query), [pool, query]);
  const selected = pool.find((t) => t.id === selectedId) ?? null;

  if (pool.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
      <label htmlFor={`${uid}-q`} className="text-sm font-semibold text-slate-200">
        อยากลองกับ AI ตัวอื่น? ค้นหาชื่อ (พิมพ์แค่บางส่วนก็ได้)
      </label>
      <input
        id={`${uid}-q`}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedId(null);
        }}
        placeholder={`เช่น kl, veo, runway — หรือเว้นว่างเพื่อดูทุกตัวสำหรับ${categoryLabel}`}
        autoComplete="off"
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
      />

      <ul aria-label="AI ที่พบ" className="mt-2 flex flex-wrap gap-2">
        {matches.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => setSelectedId(selectedId === t.id ? null : t.id)}
              aria-pressed={selectedId === t.id}
              className={`min-h-[44px] rounded-full border px-3 py-1 text-xs sm:min-h-[36px] font-medium transition ${
                selectedId === t.id
                  ? "border-violet-400 bg-violet-500/20 text-violet-100"
                  : "border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <ToolLogo id={t.id} name={t.name} size={18} />
                {t.name}
              </span>
              {recommended[t.id] && <span className="ml-1 text-emerald-300">★</span>}
            </button>
          </li>
        ))}
      </ul>
      {matches.length === 0 && (
        <p className="mt-2 text-xs text-slate-500">
          ไม่พบชื่อที่ตรงในรายการของหน้านี้ ลองพิมพ์ให้สั้นลง หรือดู AI ทั้งหมดได้ที่{" "}
          <Link href="/" className="text-violet-400 hover:underline">
            หน้าค้นหา
          </Link>
        </p>
      )}
      {Object.keys(recommended).length > 0 && matches.length > 0 && (
        <p className="mt-1.5 text-xs text-slate-500">★ = อยู่ในรายการแนะนำของ Prompt นี้ด้านบนแล้ว</p>
      )}

      <div aria-live="polite">{selected && <ToolDetail tool={selected} role={recommended[selected.id]} />}</div>
    </div>
  );
}

function ToolDetail({ tool, role }: { tool: FinderTool; role: "best" | "alt" | undefined }) {
  return (
    <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <ToolLogo id={tool.id} name={tool.name} size={28} />
        <Link href={`/tool/${tool.id}`} className="font-semibold text-white hover:text-violet-300">
          {tool.name}
        </Link>
        <span className="text-xs text-slate-500">{tool.vendor}</span>
      </p>
      <p className="mt-1 text-slate-400">{tool.shortDescription}</p>

      {role ? (
        <p className="mt-2 text-xs text-emerald-300">
          Prompt นี้แนะนำเครื่องมือนี้ไว้แล้วด้านบน ({role === "best" ? "แนะนำที่สุด" : "ตัวเลือกรอง"}) ดูเหตุผลและหลักฐานในการ์ดด้านบน
        </p>
      ) : (
        <p className="mt-2 text-xs text-amber-400">
          ⚠️ เรายังไม่ได้ประเมินว่า Prompt นี้เหมาะกับเครื่องมือนี้แค่ไหน ใช้ Prompt เดียวกันลองดูได้
          แต่ผลลัพธ์อาจต่างจากตัวที่แนะนำ และควรตรวจเองว่ารองรับภาษาไทยหรือไม่
        </p>
      )}

      {tool.evidence.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {tool.evidence.map((e) => (
            <li key={e.sourceUrl + e.text} className="text-xs leading-relaxed text-slate-500">
              <span className="text-slate-400">{KIND_LABEL[e.kind]}:</span> {e.text}{" "}
              <a
                href={e.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-nowrap text-violet-400 hover:underline"
              >
                เปิดแหล่งที่มา ↗
              </a>{" "}
              <span className="whitespace-nowrap">(ตรวจ {e.checkedAt})</span>
            </li>
          ))}
        </ul>
      )}
      {tool.signal && (
        <p className="mt-2 text-xs text-slate-500">
          <span className="text-slate-400">ข้อมูลในแคตตาล็อก:</span> {tool.signal.label} = {tool.signal.value}
          {tool.signal.lastVerified && ` (ตรวจ ${tool.signal.lastVerified})`}{" "}
          {tool.signal.sourceUrl && (
            <a
              href={tool.signal.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:underline"
            >
              แหล่งที่มา ↗
            </a>
          )}
        </p>
      )}
      {tool.evidence.length === 0 && !tool.signal && (
        <p className="mt-2 text-xs text-slate-500">ยังไม่มีหลักฐานเปรียบเทียบของเครื่องมือนี้ในหน้านี้</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          href={`/tool/${tool.id}`}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white"
        >
          ดูรายละเอียดเครื่องมือ →
        </Link>
        <SubscribeButton tool={tool.link} variant="card" />
      </div>
    </div>
  );
}
