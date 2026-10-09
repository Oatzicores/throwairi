"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { detectGenerativeCategories, type CategoryDetection } from "@/lib/match/categoryDetect";
import { buildQuestion, pickableList, type PickableCategory } from "@/lib/match/categoryRegistry";
import { buildResultsHref } from "@/lib/resultsUrl";
import { MAX_QUERY_LENGTH } from "@/lib/security/input";
import { EXAMPLE_PROMPTS } from "@/lib/prompts/examplePrompts";

type Budget = "" | "free-only" | "paid-ok";

// Each entry below was checked by fetching the cited page directly (not just
// trusting a search-result summary) on 2026-09-19. Several stats from an
// earlier pass turned out to be wrong or unverifiable when the source page
// was actually opened — those were dropped or corrected. See git history /
// conversation log for the list of what got removed and why.
// This list is static and does NOT poll a live feed — there's no API for
// "trending AI prompts". Refresh by re-researching AND re-fetching each
// source before editing this array.
// Last verified: 2026-09-19.
const ALL_TRENDING_PROMPTS = [
  // --- วิดีโอ (Fiverr Fall 2025 Business Trends Index — growth in searches
  // for these services ON FIVERR, May–Dec 2025; a freelance-demand signal,
  // not a Google search-volume or usage stat) ---
  {
    text: "อยากทำช่อง YouTube แบบไม่โชว์หน้า ให้ AI พากย์เสียงและตัดต่อให้ทั้งหมด",
    stat: "การค้นหาบริการ 'faceless YouTube video creator' บน Fiverr เพิ่มขึ้น 488% ในช่วง พ.ค.–ธ.ค. 2025",
    sourceName: "Fiverr Fall 2025 Business Trends Index",
    sourceUrl: "https://www.globenewswire.com/news-release/2025/12/10/3203122/0/en/Demand-for-AI-Video-Creators-Surges-66-As-Businesses-Race-to-Scale-Marketing-Campaigns.html",
  },
  {
    text: "อยากสร้างอินฟลูเอนเซอร์เสมือน (AI influencer) เป็นของตัวเอง",
    stat: "การค้นหาบริการ 'AI influencer' บน Fiverr เพิ่มขึ้น 43% ในช่วง พ.ค.–ธ.ค. 2025",
    sourceName: "Fiverr Fall 2025 Business Trends Index",
    sourceUrl: "https://www.globenewswire.com/news-release/2025/12/10/3203122/0/en/Demand-for-AI-Video-Creators-Surges-66-As-Businesses-Race-to-Scale-Marketing-Campaigns.html",
  },
  {
    text: "อยากจ้าง/ใช้ AI ช่วยสร้างวิดีโอการตลาดให้ธุรกิจของตัวเอง",
    stat: "ความต้องการนักสร้างวิดีโอ AI บน Fiverr โต 66% ในช่วง พ.ค.–ธ.ค. 2025",
    sourceName: "Fiverr Fall 2025 Business Trends Index",
    sourceUrl: "https://www.globenewswire.com/news-release/2025/12/10/3203122/0/en/Demand-for-AI-Video-Creators-Surges-66-As-Businesses-Race-to-Scale-Marketing-Campaigns.html",
  },
  // --- ภาพ ---
  {
    text: "อยากใช้ AI แต่งภาพสินค้าให้ดูมืออาชีพก่อนลงขายออนไลน์",
    stat: "ร้านค้าที่ใช้ AI ปรับภาพสินค้าอัตโนมัติ (เช่น บน Shopify/WooCommerce) รายงานอัตราปิดการขายดีขึ้น 73%",
    sourceName: "รายงานสถิติ AI Image Upscaler 2026",
    sourceUrl: "https://pixelpanda.ai/blog/2026/03/16/best-ai-image-upscaler-2026/",
  },
  // --- แชท/งานเขียน ---
  {
    text: "อยากได้ AI ช่วยอธิบายเรื่องที่เข้าใจยากให้ง่ายขึ้น เหมือนมีติวเตอร์ส่วนตัว",
    stat: "นักเรียน/นักศึกษาสหรัฐฯ ที่ใช้ AI ช่วยทำการบ้านเพิ่มจาก 48% เป็น 62% ในช่วง พ.ค.–ธ.ค. 2025",
    sourceName: "RAND American Youth Panel",
    sourceUrl: "https://www.rand.org/pubs/research_reports/RRA4742-1.html",
  },
  {
    text: "อยากทำสไลด์นำเสนองานให้สวยและเสร็จเร็ว ไม่ต้องนั่งจัดเลย์เอาต์เอง",
    stat: "Gen Z 57% และ Millennials 56% ใช้ AI สร้างงาน รวมถึงออกแบบสไลด์นำเสนอ ในการทำงานแล้ว",
    sourceName: "รายงานสถิติการนำเสนองาน 2026",
    sourceUrl: "https://www.presentations.ai/blog/presentation-statistics",
  },
  {
    text: "อยากได้แชทบอทตอบลูกค้าอัตโนมัติให้ร้านหรือธุรกิจของตัวเอง",
    stat: "52% ของศูนย์บริการลูกค้าลงทุนใน Conversational AI แล้ว และอีก 44% วางแผนจะใช้",
    sourceName: "สถิติ AI ในงานบริการลูกค้า 2026",
    sourceUrl: "https://masterofcode.com/blog/ai-in-customer-service-statistics",
  },
  // --- โค้ด ---
  {
    text: "อยากได้ AI ช่วยเขียนโค้ดตอนทำงานจริงทุกวัน ไม่ใช่แค่ลองเล่น",
    stat: "นักพัฒนา 84% ใช้หรือวางแผนจะใช้ AI ช่วยเขียนโค้ด และ 51% ใช้งานทุกวันแล้ว",
    sourceName: "Stack Overflow Developer Survey 2025",
    sourceUrl: "https://uvik.net/blog/ai-coding-assistant-statistics/",
  },
  {
    text: "อยากลองสร้างเว็บหรือแอปง่ายๆ เองโดยไม่ต้องเขียนโค้ดเป็นเลย",
    stat: "63% ของผู้ใช้เครื่องมือ 'vibe coding' สร้างแอปด้วย AI โดยไม่มีพื้นฐานเขียนโปรแกรมมาก่อน",
    sourceName: "ข้อมูลจาก Vercel",
    sourceUrl: "https://www.hostinger.com/blog/vibe-coding-statistics/",
  },
  // --- เสียง/เพลง ---
  {
    text: "อยากแปลงบทความเป็นเสียงพากย์ทำ podcast หรือ audiobook เอง",
    stat: "ตลาด AI พากย์เสียง/โคลนเสียงโต 23.9% ต่อปี จากดีมานด์ podcast และ audiobook เป็นหนึ่งในตัวขับเคลื่อนหลัก",
    sourceName: "AI Voice Cloning Market Report",
    sourceUrl: "https://www.researchandmarkets.com/reports/5948793/ai-voice-cloning-market-report",
  },
  {
    text: "อยากลองแต่งเพลงเป็นของตัวเอง ไม่ต้องเล่นดนตรีหรือร้องเพลงเป็น",
    stat: "เพลงที่สร้างด้วย Suno ครองสัดส่วนถึง 92.8% ของเพลง AI ที่ถูกปล่อยขึ้นสตรีมมิ่งจริงช่วง เม.ย.–ส.ค. 2026",
    sourceName: "Sonic Intelligence Academy Mid-Year 2026 Report",
    sourceUrl: "https://www.aimusicpreneur.com/ai-music-news/suno-92-percent-ai-music-market-share-mid-year-2026/",
  },
  {
    text: "อยากแปลบทความ/เนื้อหาเป็นภาษาอื่นด้วย AI ให้ลูกค้าต่างชาติเข้าใจ",
    stat: "87% ขององค์กรเพิ่มการใช้งาน AI แปลภาษา และ 85% เพิ่มการใช้ AI ทำซับไตเติลอัตโนมัติในปีที่ผ่านมา",
    sourceName: "State of AI Translation & Captions 2026",
    sourceUrl: "https://www.wordly.ai/research/state-of-ai-translation-2026",
  },
  // --- Agent/อัตโนมัติ ---
  {
    text: "อยากได้ AI agent ช่วยทำงานประจำแทนเรา เช่น จัดการอีเมลหรือนัดหมายให้อัตโนมัติ",
    stat: "79% ของผู้บริหารในสหรัฐฯ บอกว่าบริษัทเริ่มนำ AI agent มาใช้งานแล้ว",
    sourceName: "PwC AI Agent Survey (เม.ย. 2025)",
    sourceUrl: "https://www.pwc.com/us/en/tech-effect/ai-analytics/ai-agent-survey.html",
  },
  {
    text: "อยากรู้ว่าบริษัทใหญ่ๆ เอา AI agent ไปใช้งานจริงกันแค่ไหนแล้ว",
    stat: "80% ของแอปพลิเคชันองค์กรที่อัปเดตใน Q1 2026 ฝัง AI agent ไว้อย่างน้อย 1 ตัว แต่มีเพียง 31% ขององค์กรที่ใช้ agent ในงานจริงแล้ว",
    sourceName: "Gartner / S&P Global Market Intelligence (Q1 2026)",
    sourceUrl: "https://www.digitalapplied.com/blog/ai-agent-adoption-2026-enterprise-data-points",
  },
  {
    text: "อยากรู้จัก 'AI automation' ให้ช่วยจัดการงานที่ทำซ้ำๆ ทุกวันแทนเรา",
    stat: "การค้นหาบริการ 'AI automation' บน Fiverr เพิ่มขึ้น 136% ในช่วง พ.ค.–ธ.ค. 2025 มากที่สุดในหมวดบริการ AI",
    sourceName: "Fiverr Fall 2025 Business Trends Index",
    sourceUrl: "https://www.globenewswire.com/news-release/2025/12/10/3203122/0/en/Demand-for-AI-Video-Creators-Surges-66-As-Businesses-Race-to-Scale-Marketing-Campaigns.html",
  },
  {
    text: "อยากเชื่อมแอปต่างๆ ที่ใช้อยู่ให้ทำงานอัตโนมัติเอง โดยไม่ต้องเขียนโค้ด",
    stat: "ธุรกิจ SME ขยายการใช้ระบบอัตโนมัติแบบไม่ต้องเขียนโค้ด เติบโตเฉลี่ย 38.62% ต่อปี ไปจนถึงปี 2031",
    sourceName: "Mordor Intelligence",
    sourceUrl: "https://www.thisandthat.chat/blog/no-code-automation-adoption-statistics/",
  },
  {
    text: "อยากได้ AI ช่วยเขียนเรซูเม่และจดหมายสมัครงานให้ดูเป็นมืออาชีพ",
    stat: "ผู้หางานในสหรัฐฯ 74% ใช้ AI ในการหางาน และ 42.6% ใช้ AI ตอนอัปเดตเรซูเม่ล่าสุดของตัวเอง",
    sourceName: "Greenhouse (2025) / Novoresume 2026 Resume Report",
    sourceUrl: "https://novoresume.com/career-blog/resume-statistics",
  },
];

const TRENDING_COUNT = 4;

// "สุ่มใหม่" draws from the sourced ideas above plus our own plain example requests.
const ALL_PROMPT_CHIPS: { text: string }[] = [
  ...ALL_TRENDING_PROMPTS,
  ...EXAMPLE_PROMPTS.map((text) => ({ text })),
];

function pickRandom<T>(pool: T[], count: number, exclude: T[] = []): T[] {
  // "Shuffle" must change every chip, so anything already on screen is left out
  // (as long as the rest of the pool can still fill the slots).
  const fresh = pool.filter((item) => !exclude.includes(item));
  const copy = fresh.length >= count ? fresh : [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

export function PromptForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [budget, setBudget] = useState<Budget>("");
  // Budget is optional, so it stays folded away until asked for.
  const [showOptions, setShowOptions] = useState(false);

  // Set when the prompt looks like an image/video prompt: the visitor is asked
  // which one before the results page opens (see categoryDetect.ts).
  const [pending, setPending] = useState<CategoryDetection[] | null>(null);
  const [isNavigating, startNavigation] = useTransition();
  const pickerRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  // Server-rendered markup must be deterministic, so start with a fixed
  // slice and only randomize after mount (real refresh = fresh mount).
  const [trendingPrompts, setTrendingPrompts] = useState(() => ALL_PROMPT_CHIPS.slice(0, TRENDING_COUNT));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTrendingPrompts(pickRandom(ALL_PROMPT_CHIPS, TRENDING_COUNT));
  }, []);

  // Move focus to the question when it appears (not to a button, so Enter
  // cannot pick one by accident).
  useEffect(() => {
    if (pending) {
      pickerRef.current?.focus();
      pickerRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [pending]);

  function go(category?: PickableCategory) {
    const q = prompt.trim();
    if (!q) return;
    startNavigation(() => {
      router.push(buildResultsHref({ q, budget, category }));
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = prompt.trim();
    if (!q) return;
    const found = detectGenerativeCategories(q);
    if (found.length === 0) go();
    else setPending(found);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl">
      <textarea
        value={prompt}
        onChange={(e) => {
          setPrompt(e.target.value);
          setPending(null);
        }}
        placeholder="พิมพ์สิ่งที่อยากทำ เช่น 'อยากสร้างภาพโปรไฟล์การ์ตูนฟรีๆ ไม่เอาลายน้ำ'"
        rows={4}
        maxLength={MAX_QUERY_LENGTH}
        className="w-full resize-none rounded-2xl border border-violet-400/30 bg-slate-900/80 p-5 text-lg text-white shadow-[0_0_44px_-12px_rgba(124,58,237,0.65)] placeholder:text-slate-500 focus:border-violet-400 focus:outline-none"
      />

      <div className="mt-3 flex flex-col gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <button
          type="button"
          onClick={() => setShowOptions((v) => !v)}
          aria-expanded={showOptions}
          aria-controls="prompt-options"
          className="order-2 flex min-h-[44px] items-center gap-1 self-start text-sm sm:self-center sm:order-1 sm:col-start-1 text-violet-400 hover:text-violet-300 hover:underline sm:min-h-0"
        >
          ตัวเลือกเพิ่มเติม (งบ) {showOptions ? "▴" : "▾"}
        </button>
        {showOptions && (
          <div id="prompt-options" className="order-3 w-full sm:order-2 sm:col-start-2 sm:w-64">
            <ToggleGroup
              label="งบประมาณ"
              value={budget}
              onChange={(v) => {
                setBudget(v as Budget);
                setPending(null);
              }}
              options={[
                { value: "", label: "ไม่ระบุ" },
                { value: "free-only", label: "ฟรี" },
                { value: "paid-ok", label: "เสียเงิน" },
              ]}
            />
          </div>
        )}
        <button
          ref={submitRef}
          type="submit"
          disabled={!prompt.trim()}
          className="order-1 w-full sm:order-3 sm:col-start-3 sm:justify-self-end rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 text-base font-semibold sm:w-auto text-white transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ค้นหา AI
        </button>
      </div>

      {pending && (
        <div
          ref={pickerRef}
          tabIndex={-1}
          role="group"
          aria-labelledby="category-question"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setPending(null);
              submitRef.current?.focus();
            }
          }}
          className="mt-4 scroll-mt-4 rounded-xl border border-violet-500/40 bg-violet-500/10 p-4 focus:outline-none"
        >
          <p id="category-question" className="text-sm font-medium text-white">
            {buildQuestion()}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {pickableList().map((def) => (
              <button
                type="button"
                key={def.id}
                disabled={isNavigating}
                onClick={() => go(def.id)}
                className="min-h-11 rounded-lg border border-violet-500 bg-violet-600/20 px-4 text-sm font-medium text-white transition hover:bg-violet-600/40 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none disabled:opacity-50"
              >
                {def.buttonLabel}
                {pending.some((d) => d.category === def.id) && (
                  <span className="ml-1.5 text-[11px] font-normal text-violet-300">(แนะนำ)</span>
                )}
              </button>
            ))}
            <button
              type="button"
              disabled={isNavigating}
              onClick={() => go()}
              className="col-span-2 min-h-11 rounded-lg border border-slate-700 px-4 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none disabled:opacity-50 sm:col-span-1"
            >
              ข้าม / ไม่แน่ใจ
            </button>
          </div>
        </div>
      )}

      {/* Two rows on sm+ and never a third: label + shuffle sit in the first grid column, the four chips fill
          the other two columns and are cut off with "…" when too long (the full text still goes into the
          box on click, and the tooltip carries the source). The layout no longer depends on how long the
          picked prompts are, so "สุ่มใหม่" cannot move. On phones the chips stack one per line. */}
      <div className="mt-5 grid grid-cols-1 items-center gap-2 text-xs sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex items-center gap-3 sm:row-span-2 sm:self-start sm:pt-1.5">
          <button
            type="button"
            onClick={() => setTrendingPrompts((current) => pickRandom(ALL_PROMPT_CHIPS, TRENDING_COUNT, current))}
            className="flex min-h-[44px] items-center gap-1 text-violet-400 hover:text-violet-300 hover:underline sm:min-h-0"
          >
            ↻ สุ่มใหม่
          </button>
          <span className="text-slate-500">ลองดู:</span>
        </div>
        {trendingPrompts.map((item) => (
          <button
            type="button"
            key={item.text}
            onClick={() => {
              setPrompt(item.text);
              setPending(null);
            }}
            title={item.text}
            className="truncate rounded-full border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-left text-slate-300 sm:py-1.5 hover:border-violet-500 hover:text-violet-300"
          >
            {item.text}
          </button>
        ))}
      </div>
    </form>
  );
}

function ToggleGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <div className="mb-1.5 text-center text-xs text-slate-400">{label}</div>
      <div className="flex overflow-hidden rounded-lg border border-slate-700">
        {options.map((opt) => (
          <button
            type="button"
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`min-h-[44px] flex-1 px-2 py-1.5 text-xs transition sm:min-h-0 ${
              value === opt.value
                ? "bg-violet-600 text-white"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
