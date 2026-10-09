"use client";

import { useState } from "react";
import type { AITool, VersionUpdate } from "@/lib/types/ai-tool";
import { ConfidenceBadge, PricingBadge } from "./Badges";
import { SubscribeButton } from "./SubscribeButton";
import { isVendorUrl } from "@/lib/data/vendorDomains";
import { addThbToMonthlyUsd, usdWithThb } from "@/lib/currency";

const TABS = [
  { id: "overview", label: "ภาพรวม" },
  { id: "capabilities", label: "ความสามารถ" },
  { id: "reviews", label: "รีวิวผู้ใช้จริง" },
  { id: "pricing", label: "ราคา & สิทธิ์" },
  { id: "updates", label: "ข้อมูลการอัพเดท" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const DIMENSION_LABELS: Record<string, string> = {
  chat: "แชท",
  image: "สร้างภาพ",
  video: "สร้างวิดีโอ",
  audio: "สร้างเสียง",
  code: "เขียนโค้ด",
  reasoning: "การให้เหตุผล",
  longContext: "อ่านเอกสารยาว",
  agentTools: "ทำงานอัตโนมัติ",
};

export function DetailTabs({ tool }: { tool: AITool }) {
  const [active, setActive] = useState<TabId>("overview");

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-slate-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition ${
              active === tab.id
                ? "border-b-2 border-violet-500 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="py-5">
        {active === "overview" && <OverviewTab tool={tool} />}
        {active === "capabilities" && <CapabilitiesTab tool={tool} />}
        {active === "reviews" && <ReviewsTab tool={tool} />}
        {active === "pricing" && <PricingTab tool={tool} />}
        {active === "updates" && <UpdatesTab tool={tool} />}
      </div>
    </div>
  );
}

function OverviewTab({ tool }: { tool: AITool }) {
  return (
    <div className="space-y-5">
      <p className="text-slate-300">{tool.longDescription}</p>
      <p className="flex flex-wrap items-center gap-1.5 text-sm text-slate-400">
        <span className="text-slate-500">สิทธิ์การใช้งานเชิงพาณิชย์:</span>
        <span>{tool.pricing.commercialUseSummary.value}</span>
        <ConfidenceBadge confidence={tool.pricing.commercialUseSummary.confidence} source={{ url: tool.pricing.commercialUseSummary.sourceUrl, topic: "สิทธิ์เชิงพาณิชย์" }} />
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-emerald-400">จุดแข็ง</h3>
          <ul className="space-y-1 text-sm text-slate-300">
            {tool.strengths.map((s, i) => (
              <li key={i}>+ {s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-rose-400">จุดอ่อน</h3>
          <ul className="space-y-1 text-sm text-slate-300">
            {tool.weaknesses.map((s, i) => (
              <li key={i}>− {s}</li>
            ))}
          </ul>
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-200">เหมาะกับ</h3>
        <div className="flex flex-wrap gap-2">
          {tool.bestFor.map((b, i) => (
            <span key={i} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
              {b}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CapabilitiesTab({ tool }: { tool: AITool }) {
  return (
    <div>
      {tool.capabilities.length === 0 ? (
        <CapabilityNarrative tool={tool} />
      ) : (
        <div className="space-y-4">
          {tool.capabilities.map((cap) => (
            <div key={cap.dimension}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-slate-200">{DIMENSION_LABELS[cap.dimension] ?? cap.dimension}</span>
                <span className="flex items-center gap-2">
                  <span className="text-slate-400">{cap.score.value}/100</span>
                  <ConfidenceBadge
                    confidence={cap.score.confidence}
                    source={{ url: cap.score.sourceUrl, topic: `คะแนนด้าน${DIMENSION_LABELS[cap.dimension] ?? cap.dimension}` }}
                  />
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                  style={{ width: `${cap.score.value}%` }}
                />
              </div>
              {cap.score.note && <p className="mt-1 text-xs text-slate-500">{cap.score.note}</p>}
              {cap.score.sourceUrl && (
                <a
                  href={cap.score.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-violet-400 hover:underline"
                >
                  แหล่งอ้างอิง ↗
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <PromptWorkflowSection tool={tool} />
    </div>
  );
}

// Tools without a sourced numeric capability score still have real,
// already-verified text data (description/strengths/weaknesses/bestFor) —
// this recombines it into a written summary instead of leaving a blank
// "no data" placeholder. Nothing here is new/fabricated content.
function CapabilityNarrative({ tool }: { tool: AITool }) {
  return (
    <div className="space-y-2 text-sm text-slate-300">
      <p>{tool.longDescription}</p>
      <p>จุดแข็งที่โดดเด่นของ {tool.name}: {tool.strengths.join("; ")}</p>
      <p>ข้อจำกัดที่ควรรู้ก่อนใช้งาน: {tool.weaknesses.join("; ")}</p>
      <p>เหมาะกับการใช้งานลักษณะ: {tool.bestFor.join(", ")}</p>
    </div>
  );
}

function PromptWorkflowSection({ tool }: { tool: AITool }) {
  const wf = tool.promptWorkflow;
  return (
    <div className="mt-6 border-t border-slate-800 pt-5">
      <h3 className="mb-2 text-sm font-semibold text-slate-200">🔄 Flow การทำงานของ {tool.name}</h3>
      <ol className="space-y-1.5 text-sm text-slate-300">
        {wf.steps.map((step, i) => (
          <li key={i} className="flex gap-2">
            <span className="flex-none text-violet-400">{i + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-800/40 p-3">
        <h4 className="text-xs font-semibold text-slate-300">โครงสร้าง Prompt ที่แนะนำ</h4>
        <p className="mt-1 text-sm text-violet-300">{wf.recommendedStructure}</p>
        <h4 className="mt-3 text-xs font-semibold text-slate-300">ตัวอย่าง</h4>
        <p className="mt-1 whitespace-pre-line rounded-md bg-slate-950/60 p-2 font-mono text-xs text-slate-300">
          {wf.example}
        </p>
      </div>
    </div>
  );
}

function ReviewsTab({ tool }: { tool: AITool }) {
  const { reviews } = tool;
  return (
    <div className="space-y-5">
      {/* Entries researched from pricing/terms pages only have no review
          themes; showing two empty headings would look like "no problems". */}
      {(reviews.positiveThemes.length > 0 || reviews.negativeThemes.length > 0) && (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-emerald-400">รีวิวเชิงบวก</h3>
          <ul className="space-y-1 text-sm text-slate-300">
            {reviews.positiveThemes.map((t, i) => (
              <li key={i}>+ {t}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-rose-400">รีวิวเชิงลบ</h3>
          <ul className="space-y-1 text-sm text-slate-300">
            {reviews.negativeThemes.map((t, i) => (
              <li key={i}>− {t}</li>
            ))}
          </ul>
        </div>
      </div>
      )}
      {reviews.paidVerifiedSummary && (
        <div className="rounded-lg bg-slate-800/60 p-3">
          <h4 className="text-xs font-semibold text-slate-300">สรุปจากผู้ใช้ที่จ่ายเงินจริง</h4>
          <p className="mt-1 text-sm text-slate-300">{reviews.paidVerifiedSummary}</p>
        </div>
      )}
      {reviews.freeTierSummary && (
        <div className="rounded-lg bg-slate-800/60 p-3">
          <h4 className="text-xs font-semibold text-slate-300">สรุปจากผู้ใช้แผนฟรี</h4>
          <p className="mt-1 text-sm text-slate-300">{reviews.freeTierSummary}</p>
        </div>
      )}
      {reviews.sampleSizeNote && (
        <p className="text-xs text-slate-500">หมายเหตุแหล่งข้อมูล: {reviews.sampleSizeNote}</p>
      )}
      {reviews.sourceUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {reviews.sourceUrls.map((u) => (
            <a
              key={u}
              href={u}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-violet-400 hover:underline"
            >
              แหล่งข้อมูล ↗
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function PricingTab({ tool }: { tool: AITool }) {
  const { pricing } = tool;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <PricingBadge tier={pricing.tier} />
        <span className="text-xs text-slate-500">ตรวจสอบล่าสุด {pricing.lastVerified}</span>
      </div>

      <div className="space-y-3">
        {pricing.plans.map((plan) => (
          <div key={plan.name} className="rounded-lg border border-slate-800 p-3">
            <div className="flex items-baseline justify-between">
              <span className="font-medium text-white">{plan.name}</span>
              <span className="text-slate-300">
                {plan.priceLabel ??
                  (plan.priceUsdPerMonth === null ? "จ่ายตามการใช้งาน" : plan.priceUsdPerMonth === 0 ? "ฟรี" : `${usdWithThb(plan.priceUsdPerMonth)}/เดือน`)}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">{addThbToMonthlyUsd(plan.quota)}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
              <span className="text-slate-500">ใช้เชิงพาณิชย์:</span>
              <span
                className={
                  plan.commercialUseAllowed.value === true
                    ? "text-emerald-400"
                    : plan.commercialUseAllowed.value === false
                      ? "text-rose-400"
                      : "text-slate-500"
                }
              >
                {plan.commercialUseAllowed.value === true
                  ? "ได้"
                  : plan.commercialUseAllowed.value === false
                    ? "ไม่ได้"
                    : "ยังไม่มีข้อมูล"}
              </span>
              <ConfidenceBadge
                confidence={plan.commercialUseAllowed.confidence}
                source={{ url: plan.commercialUseAllowed.sourceUrl, topic: `สิทธิ์เชิงพาณิชย์ของแผน ${plan.name}` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-slate-800/60 p-3">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold text-slate-300">สรุปสิทธิ์การใช้งานเชิงพาณิชย์</h4>
          <ConfidenceBadge confidence={pricing.commercialUseSummary.confidence} source={{ url: pricing.commercialUseSummary.sourceUrl, topic: "สิทธิ์เชิงพาณิชย์" }} />
        </div>
        <p className="mt-1 text-sm text-slate-300">{pricing.commercialUseSummary.value}</p>
        {pricing.commercialUseSummary.sourceUrl && (
          <a
            href={pricing.commercialUseSummary.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs text-violet-400 hover:underline"
          >
            แหล่งอ้างอิง ↗
          </a>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <SubscribeButton tool={tool} variant="tab" />
        <a
          href={pricing.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs text-slate-500 hover:text-slate-300"
        >
          {/* Only call it official when it is: many pricing.sourceUrl values
              are third-party pages, which this label used to misdescribe. */}
          {isVendorUrl(tool.id, tool.websiteUrl, pricing.sourceUrl) ? "หน้าราคาทางการ ↗" : "แหล่งข้อมูลราคา ↗"}
        </a>
      </div>
    </div>
  );
}

const VERSIONS_PAGE_SIZE = 3;

function UpdatesTab({ tool }: { tool: AITool }) {
  const [visibleCount, setVisibleCount] = useState(VERSIONS_PAGE_SIZE);
  const versions = tool.versionHistory ?? [];

  if (versions.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        ยังไม่มีข้อมูลประวัติอัปเดตที่ยืนยันแหล่งที่มาได้สำหรับ {tool.name} ในรอบการค้นคว้านี้
      </p>
    );
  }

  const visible = versions.slice(0, visibleCount);

  return (
    <div className="space-y-4">
      {visible.map((v, i) => (
        <VersionCard key={`${v.version}-${i}`} v={v} isLatest={i === 0} />
      ))}
      {visibleCount < versions.length && (
        <button
          type="button"
          onClick={() => setVisibleCount((c) => c + VERSIONS_PAGE_SIZE)}
          className="text-sm text-violet-400 hover:underline"
        >
          ดูเวอร์ชั่นก่อนหน้า ({versions.length - visibleCount} เวอร์ชั่น)
        </button>
      )}
    </div>
  );
}

const SUMMARY_TRUNCATE_LENGTH = 220;

function VersionCard({ v, isLatest }: { v: VersionUpdate; isLatest: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = v.summary.length > SUMMARY_TRUNCATE_LENGTH;
  const shownSummary = !isLong || expanded ? v.summary : `${v.summary.slice(0, SUMMARY_TRUNCATE_LENGTH)}…`;

  return (
    <div className="rounded-lg border border-slate-800 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-white">{v.version}</span>
        {isLatest && (
          <span className="rounded-full bg-violet-600/20 px-2 py-0.5 text-xs font-medium text-violet-300">
            ล่าสุด
          </span>
        )}
        <span className="text-xs text-slate-500">
          {v.releaseDate.value ? `เปิดตัว ${v.releaseDate.value}` : "ไม่มีวันที่ที่ชัดเจน"}
          {v.releaseDate.value && v.releaseDate.confidence !== "verified" && ` (วันที่ระดับ ${v.releaseDate.confidence})`}
          {v.releaseDate.sourceUrl && (
            <>
              {" "}
              ·{" "}
              <a
                href={v.releaseDate.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:underline"
              >
                แหล่งอ้างอิง ↗
              </a>
            </>
          )}
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-300">{shownSummary}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-1 text-xs text-violet-400 hover:underline"
        >
          {expanded ? "ย่อลง" : "อ่านเพิ่มเติม"}
        </button>
      )}

      {!v.userSentiment && (
        <p className="mt-3 text-xs text-slate-500">
          ยังไม่ได้ค้นคว้าปฏิกิริยาของผู้ใช้จริงต่อเวอร์ชั่นนี้ จึงไม่แสดงคะแนนความรู้สึก
        </p>
      )}
      {v.userSentiment && (
      <div className="mt-3 rounded-lg bg-slate-800/60 p-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-slate-300">ผู้ใช้รู้สึกอย่างไรกับเวอร์ชั่นนี้</h4>
          <StarRating rating={v.userSentiment.starRating} />
        </div>
        <p className="mt-1.5 text-sm text-slate-300">{v.userSentiment.summary}</p>
        {v.userSentiment.sourceUrls.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {v.userSentiment.sourceUrls.map((u) => (
              <a
                key={u}
                href={u}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-violet-400 hover:underline"
              >
                แหล่งข้อมูล ↗
              </a>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <span className="flex items-center gap-1 text-xs" title={`${rating}/5`}>
      <span className="tracking-tight text-amber-400">
        {"★".repeat(filled)}
        <span className="text-slate-700">{"★".repeat(5 - filled)}</span>
      </span>
      <span className="text-slate-500">{rating}/5</span>
    </span>
  );
}
