import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { loadCatalogWithDiagnostics } from "@/lib/data/loadCatalog";
import { parsePromptIntent, findKeywordHits } from "@/lib/match/intent";
import type { BudgetPreference, SkillLevel } from "@/lib/match/intent";
import { matchTools } from "@/lib/match/score";
import { ResultsList } from "@/components/ResultsList";
import { NewsPanel } from "@/components/NewsPanel";
import { CATEGORY_LABELS } from "@/lib/labels";
import { parseCategoryParam, pickableList, PICKABLE_CATEGORIES } from "@/lib/match/categoryRegistry";
import { promptsHref } from "@/lib/prompts/promptLibrary";
import { buildResultsHref } from "@/lib/resultsUrl";
import { readQueryParam } from "@/lib/security/input";

export const dynamic = "force-dynamic";

interface ResultsPageProps {
  // string[] when a parameter is repeated in a hand-edited URL.
  searchParams: Promise<{
    q?: string | string[];
    budget?: string | string[];
    skill?: string | string[];
    category?: string | string[];
  }>;
}

export async function generateMetadata({ searchParams }: ResultsPageProps): Promise<Metadata> {
  const trimmed = readQueryParam((await searchParams).q);
  // Never indexed: the title echoes whatever was typed into the URL.
  const robots = { index: false, follow: false };
  if (!trimmed) return { title: "ค้นหา AI — ThrowAirI", robots };
  const title = `ผลลัพธ์ "${trimmed}" — ThrowAirI`;
  const description = `AI ที่เหมาะกับ "${trimmed}" เรียงตามความเหมาะสม พร้อมเหตุผล ราคา และรีวิวจากแหล่งข้อมูลจริง`;
  return { title, description, openGraph: { title, description }, robots };
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams;
  const q = readQueryParam(params.q);
  const budgetParam = readQueryParam(params.budget);
  const skillParam = readQueryParam(params.skill);

  if (!q) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-slate-400">กรุณาพิมพ์ Prompt ก่อนค้นหา</p>
        <Link href="/" className="mt-4 inline-block text-violet-400 hover:underline">
          ← กลับไปหน้าค้นหา
        </Link>
      </div>
    );
  }

  const budget: BudgetPreference | undefined =
    budgetParam === "free-only" || budgetParam === "paid-ok" ? budgetParam : undefined;
  const skillLevel: SkillLevel | undefined =
    skillParam === "beginner" || skillParam === "intermediate" || skillParam === "advanced"
      ? skillParam
      : undefined;

  // Chosen in the post-search picker. Validated against the registry; any
  // other value (hand-edited URL, repeated param) is ignored.
  const category = parseCategoryParam(params.category);

  const { tools: catalog, issues } = loadCatalogWithDiagnostics();
  const intent = parsePromptIntent(q, { budget, skillLevel, category });
  const results = matchTools(catalog, intent);
  const keywordHits = findKeywordHits(q);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-400 hover:bg-slate-700 hover:text-white"
        >
          ← ค้นหาใหม่
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-white">
          ผลลัพธ์สำหรับ: <span className="text-violet-400">&ldquo;{q}&rdquo;</span>
        </h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <IntentChip
            label={`ประเภทงาน: ${intent.categories.map((c) => CATEGORY_LABELS[c]).join(", ")}${category ? " (คุณเลือก)" : ""}`}
          />
          {category && (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 py-1 text-slate-400">
              เปลี่ยนเป็น:
              {pickableList()
                .filter((d) => d.id !== category)
                .map((d) => (
                  <Link
                    key={d.id}
                    href={buildResultsHref({ q, budget, skill: skillLevel, category: d.id })}
                    className="text-violet-400 hover:underline"
                  >
                    {d.buttonLabel}
                  </Link>
                ))}
              <Link
                href={buildResultsHref({ q, budget, skill: skillLevel })}
                className="text-violet-400 hover:underline"
              >
                ไม่ระบุประเภท
              </Link>
            </span>
          )}
          {intent.budget !== "unspecified" && (
            <IntentChip label={`งบ: ${intent.budget === "free-only" ? "ฟรี" : "เสียเงิน"}`} />
          )}
          {intent.skillLevel !== "beginner" && (
            <IntentChip
              label={`ระดับผู้ใช้: ${intent.skillLevel === "intermediate" ? "พอใช้เป็น" : "มืออาชีพ"}`}
            />
          )}
        </div>
        {category && (
          <Link
            href={promptsHref(category)}
            className="mt-3 inline-flex min-h-[44px] items-center rounded-lg border border-violet-500/50 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 transition hover:border-violet-400 hover:bg-violet-500/20"
          >
            ✨ กดเพื่อหา Prompt สำหรับ{PICKABLE_CATEGORIES[category].buttonLabel} →
          </Link>
        )}
        {catalog.length === 0 && (
          <p className="mt-3 text-sm text-amber-400">
            ยังไม่มีข้อมูล AI ในระบบ — กรุณาตรวจสอบว่าไฟล์ catalog ถูกสร้างแล้ว
          </p>
        )}
        {issues.length > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            หมายเหตุ: มี {issues.length} รายการที่ถูกข้ามเพราะข้อมูลไม่ครบตามมาตรฐานคุณภาพของระบบ
          </p>
        )}
      </div>

      <ResultsList
        results={results}
        rawPrompt={q}
        keywordHits={keywordHits}
        sidebarExtra={
          <>
            <Link
              href={`/compare?ids=${results.slice(0, 4).map((r) => r.tool.id).join(",")}`}
              className="block rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center text-sm font-medium text-violet-400 hover:border-violet-500"
            >
              เปรียบเทียบ 4 อันดับแรก →
            </Link>
            <Suspense fallback={<NewsPanelSkeleton />}>
              <NewsPanel keywords={[...intent.keywords, ...intent.categories]} />
            </Suspense>
          </>
        }
      />
    </div>
  );
}

function IntentChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">{label}</span>
  );
}

function NewsPanelSkeleton() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-slate-800" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-slate-800" />
      </div>
    </div>
  );
}
