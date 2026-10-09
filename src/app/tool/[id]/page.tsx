import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getToolById, loadCatalog } from "@/lib/data/loadCatalog";
import { CATEGORY_LABELS } from "@/lib/labels";
import type { AITool } from "@/lib/types/ai-tool";
import { isPickableCategory, PICKABLE_CATEGORIES } from "@/lib/match/categoryRegistry";
import { buildResultsHref } from "@/lib/resultsUrl";
import { PricingBadge } from "@/components/Badges";
import { DetailTabs } from "@/components/DetailTabs";
import { BookmarkButton } from "@/components/BookmarkButton";
import { ToolLogo } from "@/components/ToolLogo";
import { RoadmapSection } from "@/components/RoadmapSection";
import { SubscribeButton } from "@/components/SubscribeButton";
import { activeTools } from "@/lib/data/toolStatus";
import { UpdateStamp } from "@/components/UpdateStamp";

interface ToolPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return loadCatalog().map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { id } = await params;
  const tool = getToolById(id);
  if (!tool) return { title: "ไม่พบข้อมูล AI นี้ — ThrowAirI" };

  const title = tool.discontinued
    ? `${tool.name} ปิดให้บริการแล้ว — สถานะจากหน้าทางการ | ThrowAirI`
    : `${tool.name} — ราคา ความสามารถ และรีวิว | ThrowAirI`;
  const description = tool.shortDescription;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function ToolDetailPage({ params }: ToolPageProps) {
  const { id } = await params;
  const tool = getToolById(id);

  if (!tool) {
    notFound();
  }

  const productUpdate = tool.lastProductUpdate;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-300">
        ← กลับไปค้นหา
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <ToolLogo id={tool.id} name={tool.name} size={52} />
            <div>
              <h1 className="text-2xl font-bold text-white">{tool.name}</h1>
              <p className="text-sm text-slate-400">{tool.vendor}</p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {tool.discontinued ? (
              <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-300">
                ปิดให้บริการแล้ว
              </span>
            ) : (
              <PricingBadge tier={tool.pricing.tier} />
            )}
            {tool.categories.map((c) => (
              <span key={c} className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                {CATEGORY_LABELS[c]}
              </span>
            ))}
          </div>
          <UpdateStamp update={productUpdate} label={`${tool.vendor} อัปเดตล่าสุดเมื่อ`} showNote className="mt-2" />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <BookmarkButton toolId={tool.id} />
          <SubscribeButton tool={tool} variant="page" />
          <a
            href={tool.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            ไปที่เว็บไซต์ทางการ ↗
          </a>
        </div>
      </div>

      <p className="mt-4 text-slate-300">{tool.shortDescription}</p>

      {tool.discontinued ? (
        <DiscontinuedPanel tool={tool} alternativesCount={activeTools(loadCatalog()).filter((t) => t.categories.some((c) => tool.categories.includes(c))).length} />
      ) : (
        <div className="mt-6 rounded-2xl border border-violet-500/20 bg-slate-900/60 px-4 shadow-[0_0_28px_-16px_rgba(139,92,246,0.7)]">
          <DetailTabs tool={tool} />
        </div>
      )}

      {!tool.discontinued && <RoadmapSection tool={tool} />}

      <p className="mt-6 text-center text-xs text-slate-600">
        ทีมงานตรวจสอบ/บันทึกข้อมูลหน้านี้ล่าสุดเมื่อ {tool.lastUpdated} —
        โปรดตรวจสอบหน้าราคา/เงื่อนไขทางการอีกครั้งก่อนตัดสินใจ
      </p>
    </div>
  );
}

function DiscontinuedPanel({ tool, alternativesCount }: { tool: AITool; alternativesCount: number }) {
  const d = tool.discontinued!;
  const category = tool.categories[0];
  const pickable = isPickableCategory(category) ? category : undefined;
  const label = pickable ? PICKABLE_CATEGORIES[pickable].buttonLabel : CATEGORY_LABELS[category];
  return (
    <section
      role="alert"
      className="mt-6 rounded-xl border border-red-500/40 bg-red-500/5 p-5 text-sm leading-relaxed text-slate-300"
    >
      <h2 className="text-base font-semibold text-red-300">⚠️ {tool.name} ปิดให้บริการแล้ว</h2>
      <p className="mt-2">{d.note}</p>
      <p className="mt-2 text-xs text-slate-500">
        ข้อมูลจากหน้าทางการของ {tool.vendor} ตรวจเมื่อ {d.lastVerified}{" "}
        <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
          เปิดแหล่งที่มา ↗
        </a>
      </p>
      <p className="mt-3 text-slate-400">
        เราจึงไม่นำ {tool.name} มาจัดอันดับ ไม่ให้เลือกเปรียบเทียบ และไม่แสดงราคา/ปุ่มสมัคร
        หน้านี้เก็บไว้เพื่อให้คนที่ค้นหาชื่อนี้รู้สถานะที่แท้จริง
      </p>
      {pickable && alternativesCount > 0 && (
        <Link
          href={buildResultsHref({ q: `AI สร้าง${label}`, category: pickable })}
          className="mt-4 inline-flex min-h-[44px] items-center rounded-lg border border-violet-500/50 bg-violet-500/10 px-4 py-2 font-medium text-violet-200 hover:bg-violet-500/20"
        >
          ดู AI สำหรับ{label}ที่ยังใช้งานได้ →
        </Link>
      )}
    </section>
  );
}
