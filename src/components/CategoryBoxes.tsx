import Link from "next/link";
import type { AICategory, AITool } from "@/lib/types/ai-tool";
import { CATEGORY_LABELS } from "@/lib/labels";
import { activeTools } from "@/lib/data/toolStatus";
import { ToolLogo } from "./ToolLogo";

// Creator categories first.
const ORDER: AICategory[] = ["video", "image", "audio", "chat", "code", "agent"];
const SHOWN_PER_BOX = 8;

/**
 * One glowing box per category with the tools inside it. A tool appears in the box of its first
 * category only. The order inside a box is alphabetical on purpose: this is a browsing index, not a
 * ranking, so nothing here can be influenced by money (docs/adr/0001).
 */
export function CategoryBoxes({ catalog }: { catalog: AITool[] }) {
  const tools = activeTools(catalog);
  const groups = ORDER.map((cat) => ({
    cat,
    tools: tools.filter((t) => t.categories[0] === cat).sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.tools.length > 0);

  return (
    <section aria-labelledby="browse-heading" className="mx-auto w-full max-w-6xl px-4 pb-16">
      <h2 id="browse-heading" className="text-center text-xl font-semibold text-white">
        หรือเลือกดูตามประเภทงาน
      </h2>
      <p className="mt-1 text-center text-sm text-slate-500">เรียงตามตัวอักษร ไม่ใช่การจัดอันดับ</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map(({ cat, tools: list }) => (
          <div
            key={cat}
            className="rounded-2xl border border-violet-500/20 bg-slate-900/60 p-4 shadow-[0_0_28px_-16px_rgba(139,92,246,0.7)]"
          >
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold text-white">{CATEGORY_LABELS[cat]}</h3>
              <span className="text-xs text-slate-500">{list.length} ตัว</span>
            </div>
            <ul className="mt-3 grid grid-cols-1 gap-1">
              {list.slice(0, SHOWN_PER_BOX).map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/tool/${t.id}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-slate-200 transition hover:bg-slate-800/80"
                  >
                    <ToolLogo id={t.id} name={t.name} size={28} />
                    <span className="truncate">{t.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {list.length > SHOWN_PER_BOX && (
              <Link href="/compare" className="mt-2 block px-2 text-xs text-violet-400 hover:underline">
                ดูอีก {list.length - SHOWN_PER_BOX} ตัวในหน้าเปรียบเทียบ →
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
