import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { pickableList, PICKABLE_CATEGORIES } from "@/lib/match/categoryRegistry";
import { loadPromptLibrary, promptsHref } from "@/lib/prompts/promptLibrary";
import type { Evidence, Pick, PromptLibrary } from "@/lib/prompts/promptLibrary";
import { getToolById, loadCatalog } from "@/lib/data/loadCatalog";
import { buildFinderPool } from "@/lib/prompts/finderPool";
import { ToolPoolProvider } from "@/components/ToolPoolProvider";
import { ToolFinder } from "@/components/ToolFinder";
import { UpdateStamp } from "@/components/UpdateStamp";
import { CopyPromptButton } from "@/components/CopyPromptButton";
import { ToolLogo } from "@/components/ToolLogo";

interface PromptsPageProps {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return pickableList().map((d) => ({ category: d.id }));
}

export async function generateMetadata({ params }: PromptsPageProps): Promise<Metadata> {
  const { category } = await params;
  const lib = loadPromptLibrary(category);
  if (!lib) return { title: "ไม่พบหน้านี้ — ThrowAirI" };
  const label = PICKABLE_CATEGORIES[lib.category].buttonLabel;
  const title = `Prompt สำหรับ${label} ภาษาไทยและอังกฤษ พร้อมบอกว่าใช้ AI ตัวไหน — ThrowAirI`;
  const description = `ชุด Prompt สำหรับ${label} ฉบับไทยและอังกฤษ บอกว่าเหมาะสร้างงานแบบไหน และควรใช้เครื่องมือตัวไหน พร้อมหลักฐานอ้างอิง`;
  return { title, description, openGraph: { title, description } };
}

const KIND_LABEL: Record<Evidence["kind"], string> = {
  "vendor-guide": "คู่มือของผู้ให้บริการ",
  leaderboard: "ตารางโหวตของบุคคลที่สาม",
};

function EvidenceList({ keys, lib }: { keys: string[]; lib: PromptLibrary }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {keys.map((k) => {
        const e = lib.evidence[k];
        return (
          <li key={k} className="text-xs leading-relaxed text-slate-500">
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
        );
      })}
    </ul>
  );
}

function rolesOf(picks: Pick[]): Record<string, "best" | "alt"> {
  const roles: Record<string, "best" | "alt"> = {};
  for (const p of picks) if (roles[p.toolId] !== "best") roles[p.toolId] = p.role;
  return roles;
}

function PickCard({ pick, lib }: { pick: Pick; lib: PromptLibrary }) {
  const tool = getToolById(pick.toolId);
  return (
    <div className="rounded-xl border border-violet-500/15 bg-slate-950/40 p-3">
      {pick.headline && <p className="text-xs font-medium text-slate-400">{pick.headline}</p>}
      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            pick.role === "best" ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-800 text-slate-300"
          }`}
        >
          {pick.role === "best" ? "แนะนำที่สุด" : "ตัวเลือกรอง"}
        </span>
        {tool ? (
          <span className="inline-flex items-center gap-2">
            <ToolLogo id={tool.id} name={tool.name} size={26} />
            <Link href={`/tool/${tool.id}`} className="font-semibold text-white hover:text-violet-300">
              {tool.name}
            </Link>
          </span>
        ) : (
          <span className="font-semibold text-white">{pick.toolId}</span>
        )}
        <span className="text-slate-400">โมเดล: {pick.model}</span>
      </p>
      <p className="mt-1.5 text-sm text-slate-300">{pick.reason}</p>
      <UpdateStamp update={tool?.lastProductUpdate} showNote className="mt-1.5" />
      {pick.caveat && <p className="mt-1.5 text-xs text-amber-400">⚠️ {pick.caveat}</p>}
      <EvidenceList keys={pick.evidence} lib={lib} />
    </div>
  );
}

function PromptBlock({ lang, title, text, label }: { lang: string; title: string; text: string; label: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-3 py-2">
        <span className="text-xs font-semibold text-slate-300">
          {lang} <span className="font-normal text-slate-500">· {title}</span>
        </span>
        <CopyPromptButton text={text} label={label} />
      </div>
      <p className="whitespace-pre-wrap break-words px-3 py-3 text-sm leading-relaxed text-slate-200">{text}</p>
    </div>
  );
}

export default async function PromptsPage({ params }: PromptsPageProps) {
  const { category } = await params;
  const lib = loadPromptLibrary(category);
  if (!lib) notFound();

  const def = PICKABLE_CATEGORIES[lib.category];
  const others = pickableList().filter((d) => d.id !== lib.category);
  const pool = buildFinderPool(lib, loadCatalog());

  return (
    <ToolPoolProvider pool={pool}>
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-300">
        ← กลับไปค้นหา
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
        Prompt สำหรับ<span className="bg-gradient-to-r from-violet-300 to-blue-400 bg-clip-text text-transparent">{def.buttonLabel}</span>
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{lib.intro}</p>
      <p className="mt-2 text-sm text-slate-500">
        ดูหมวดอื่น:{" "}
        {others.map((d) => (
          <Link key={d.id} href={promptsHref(d.id)} className="text-violet-400 hover:underline">
            Prompt สำหรับ{d.buttonLabel}
          </Link>
        ))}
      </p>

      <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-relaxed text-amber-200/90">
        <p className="font-medium">อ่านก่อนใช้</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-amber-200/80">
          <li>
            Prompt ทุกชุดเป็นแม่แบบที่ทีมงานเขียนตามโครงสร้างในคู่มือทางการ <strong>ยังไม่ได้ทดสอบสร้างจริงบนทุกเครื่องมือ</strong> ผลลัพธ์แต่ละครั้งไม่เหมือนกัน ให้แก้รายละเอียดเป็นของคุณ
          </li>
          <li>
            คู่มือส่วนใหญ่ไม่ได้ระบุว่ารองรับ Prompt ภาษาไทยหรือไม่ ลองฉบับไทยก่อน ถ้าผลคลาดเคลื่อนให้ใช้ฉบับอังกฤษ
          </li>
          <li>
            การแนะนำเครื่องมืออิงหลักฐานที่แสดงใต้แต่ละข้อ (คู่มือทางการ หรือตารางโหวต ณ วันที่ระบุ) ไม่เกี่ยวกับค่าตอบแทนใดๆ ดู{" "}
            <Link href="/methodology" className="underline">
              วิธีที่เราจัดอันดับ
            </Link>
          </li>
        </ul>
      </div>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-white">ใช้ AI ตัวไหนดี</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {lib.overview.map((p) => (
            <PickCard key={`${p.toolId}-${p.headline}`} pick={p} lib={lib} />
          ))}
        </div>
        <ToolFinder recommended={rolesOf(lib.overview)} categoryLabel={def.buttonLabel} />
      </section>

      <section className="mt-8 space-y-6">
        <h2 className="text-lg font-semibold text-white">ชุด Prompt ({lib.prompts.length} ชุด)</h2>
        {lib.prompts.map((p, i) => (
          <article
            key={p.id}
            id={p.id}
            className="scroll-mt-20 rounded-2xl border border-violet-500/20 bg-slate-900/60 p-4 shadow-[0_0_28px_-16px_rgba(139,92,246,0.7)] sm:p-5"
          >
            <h3 className="flex items-baseline gap-2 text-base font-semibold text-white">
              <span className="font-mono text-sm text-violet-300">{String(i + 1).padStart(2, "0")}</span>
              {p.title}
            </h3>
            <p className="mt-1 text-sm text-emerald-300">เหมาะสำหรับสร้าง: {p.suitableFor}</p>

            <div className="mt-3 space-y-3">
              <PromptBlock lang="ภาษาไทย" title={p.title} text={p.thai} label={`ภาษาไทย ${p.title}`} />
              <PromptBlock lang="English" title={p.title} text={p.english} label={`English ${p.title}`} />
            </div>

            <h4 className="mt-4 text-sm font-semibold text-slate-200">ควรใช้กับ AI ตัวไหน</h4>
            <div className="mt-2 space-y-2">
              {p.picks.map((k) => (
                <PickCard key={`${p.id}-${k.toolId}-${k.model}`} pick={k} lib={lib} />
              ))}
            </div>

            <ToolFinder recommended={rolesOf(p.picks)} categoryLabel={def.buttonLabel} />

            {p.tips.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-400">
                {p.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
            {p.caveats.map((c) => (
              <p key={c} className="mt-2 text-xs text-amber-400">
                ⚠️ {c}
              </p>
            ))}
          </article>
        ))}
      </section>

      <section className="mt-8 text-sm text-slate-400">
        <h2 className="text-base font-semibold text-white">คู่มือและแหล่งข้อมูลที่ใช้</h2>
        <ul className="mt-2 space-y-1">
          {lib.guides.map((g) => (
            <li key={g.url}>
              <a href={g.url} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
                {g.title} ↗
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">ข้อมูลชุดนี้ตรวจล่าสุด {lib.updatedAt}</p>
      </section>
    </div>
    </ToolPoolProvider>
  );
}
