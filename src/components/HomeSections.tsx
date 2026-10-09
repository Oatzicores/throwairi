import Link from "next/link";
import type { AICategory, AITool } from "@/lib/types/ai-tool";
import { CATEGORY_LABELS } from "@/lib/labels";
import { activeTools } from "@/lib/data/toolStatus";
import { buildResultsHref } from "@/lib/resultsUrl";
import { isPickableCategory } from "@/lib/match/categoryRegistry";
import { ConfidenceBadge } from "./Badges";
import { ToolLogo } from "./ToolLogo";

const CHIP_ORDER: AICategory[] = ["video", "image", "audio", "chat", "code", "agent"];

/**
 * Row of category shortcuts under the search box. Each chip is a ready-made search, so it uses the same
 * results page (and, for video/image, the same `category` param the picker sets).
 */
export function CategoryChips() {
  return (
    <nav aria-label="ทางลัดตามประเภทงาน" className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2 px-4">
      <span className="w-full text-center text-xs text-slate-500">หรือเริ่มจากประเภทงาน</span>
      {CHIP_ORDER.map((cat) => (
        <Link
          key={cat}
          href={buildResultsHref({
            q: `AI ${CATEGORY_LABELS[cat]}`,
            category: isPickableCategory(cat) ? cat : undefined,
          })}
          className="rounded-full border border-violet-500/30 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 transition hover:border-violet-400 hover:bg-violet-500/10 hover:text-white"
        >
          {CATEGORY_LABELS[cat]}
        </Link>
      ))}
    </nav>
  );
}

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" });
};

/**
 * "เพิ่งอัปเดต": the tools whose vendor-update date (with a source) is newest. It is a news-style
 * strip, not a recommendation: cards show the date and how sure we are of it, and the choice depends on
 * nothing but that date (docs/adr/0001).
 */
export function RecentUpdatesRow({ catalog, limit = 6 }: { catalog: AITool[]; limit?: number }) {
  const rows = activeTools(catalog)
    .filter((t) => t.lastProductUpdate?.value && t.lastProductUpdate.confidence !== "unknown")
    .sort((a, b) => Date.parse(b.lastProductUpdate!.value) - Date.parse(a.lastProductUpdate!.value))
    .slice(0, limit);
  if (rows.length === 0) return null;

  return (
    <section aria-labelledby="recent-heading" className="mx-auto w-full max-w-6xl px-4 pt-14">
      <div className="flex items-baseline justify-between">
        <h2 id="recent-heading" className="text-xl font-semibold text-white">
          เพิ่งอัปเดตล่าสุด
        </h2>
        <Link href="/updates" className="text-sm text-violet-400 hover:underline">
          ดูทั้งหมด →
        </Link>
      </div>
      <p className="mt-1 text-sm text-slate-500">เรียงตามวันที่ผู้ให้บริการอัปเดต ไม่ใช่การจัดอันดับความดี</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((t) => (
          <li key={t.id}>
            {/* The badge holds its own source link and <a> can't nest in <a>, so the card is a div: the name
                link's ::after stretches over the whole card and the badge sits above it (relative z-10). */}
            <div className="relative flex h-full items-start gap-3 rounded-2xl border border-violet-500/20 bg-slate-900/60 p-4 shadow-[0_0_28px_-16px_rgba(139,92,246,0.7)] transition hover:border-violet-400/50">
              <ToolLogo id={t.id} name={t.name} size={44} />
              <span className="min-w-0">
                <Link
                  href={`/tool/${t.id}`}
                  className="block truncate font-semibold text-white after:absolute after:inset-0 after:rounded-2xl after:content-['']"
                >
                  {t.name}
                </Link>
                <span className="mt-0.5 block text-xs text-slate-400">
                  อัปเดต {formatDate(t.lastProductUpdate!.value)}{" "}
                  <span className="relative z-10">
                    <ConfidenceBadge
                      confidence={t.lastProductUpdate!.confidence}
                      source={{ url: t.lastProductUpdate!.sourceUrl, topic: "วันที่อัปเดต" }}
                    />
                  </span>
                </span>
                {t.latestVersion && (
                  <span className="mt-1 block text-xs text-slate-300">รุ่นล่าสุดที่ผู้ให้บริการระบุ: {t.latestVersion.name}</span>
                )}
                <span className="mt-1 line-clamp-2 block text-xs text-slate-500">{t.lastProductUpdate!.note ?? t.shortDescription}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

const STEPS = [
  { n: "01", title: "พิมพ์สิ่งที่อยากทำ", text: "เล่าเป็นภาษาไทยหรืออังกฤษก็ได้ เช่น \"อยากทำคลิปโปรโมทร้านกาแฟ\"" },
  { n: "02", title: "ดูรายการเรียงตามความเหมาะสม", text: "ทุกตัวมีเหตุผล ราคา สิทธิ์เชิงพาณิชย์ และแหล่งอ้างอิงที่กดตรวจได้" },
  { n: "03", title: "เปรียบเทียบและเลือกเอง", text: "เทียบได้สูงสุด 4 ตัว ไม่มีอันดับที่ซื้อได้ เงินไม่มีผลต่อลำดับ" },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="mx-auto w-full max-w-6xl px-4 pb-16">
      <h2 id="how-heading" className="text-center text-xl font-semibold text-white">
        ใช้งานอย่างไร
      </h2>
      <ol className="mt-6 grid gap-4 md:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.n} className="rounded-2xl border border-violet-500/20 bg-slate-900/60 p-5">
            <span className="font-mono text-2xl font-semibold text-violet-300">{s.n}</span>
            <h3 className="mt-2 font-semibold text-white">{s.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{s.text}</p>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-center text-sm text-slate-500">
        อยากรู้ว่าเราจัดอันดับอย่างไร อ่าน{" "}
        <Link href="/methodology" className="text-violet-400 hover:underline">
          วิธีที่เราจัดอันดับและตรวจข้อมูล
        </Link>
      </p>
    </section>
  );
}
