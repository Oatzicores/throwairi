"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { detectGenerativeCategories, type CategoryDetection } from "@/lib/match/categoryDetect";
import { buildQuestion, pickableList, type PickableCategory } from "@/lib/match/categoryRegistry";
import { buildResultsHref } from "@/lib/resultsUrl";
import { MAX_QUERY_LENGTH } from "@/lib/security/input";
import { ALL_PROMPT_IDEAS, buildFullPrompt, type PromptIdea } from "@/lib/prompts/promptIdeas";
import { CopyValueButton } from "@/components/CopyValueButton";

type Budget = "" | "free-only" | "paid-ok";

// Three chips per row, two rows.
const CHIP_COUNT = 6;

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
  // The idea whose full prompt is open under the chips (set when a chip is clicked).
  const [openIdea, setOpenIdea] = useState<PromptIdea | null>(null);
  const [chipIdeas, setChipIdeas] = useState(() => ALL_PROMPT_IDEAS.slice(0, CHIP_COUNT));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChipIdeas(pickRandom(ALL_PROMPT_IDEAS, CHIP_COUNT));
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

      {/* Chips show a short keyword phrase (also the search text). Clicking one opens the long, ready-to-paste
          Thai prompt underneath. Centered, three per row on sm+, one per line on phones. */}
      <div className="mt-6 flex flex-col items-center gap-3 text-xs">
        <div className="flex items-center justify-center gap-3">
          <span className="text-slate-500">ลองดู:</span>
          <button
            type="button"
            onClick={() => setChipIdeas((current) => pickRandom(ALL_PROMPT_IDEAS, CHIP_COUNT, current))}
            className="flex min-h-[44px] items-center gap-1 text-violet-400 hover:text-violet-300 hover:underline sm:min-h-0"
          >
            ↻ สุ่มใหม่
          </button>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
          {chipIdeas.map((item) => (
            <button
              type="button"
              key={item.kw}
              onClick={() => {
                setPrompt(item.kw);
                setPending(null);
                setOpenIdea(item);
              }}
              aria-pressed={openIdea?.kw === item.kw}
              title={item.kw}
              className={`truncate rounded-full border px-3 py-2.5 text-center sm:py-1.5 ${
                openIdea?.kw === item.kw
                  ? "border-violet-400 bg-violet-500/15 text-violet-200"
                  : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-violet-500 hover:text-violet-300"
              }`}
            >
              {item.kw}
            </button>
          ))}
        </div>

        {openIdea && (
          <div className="w-full rounded-2xl border border-violet-500/30 bg-slate-900/70 p-4 text-left">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-white">Prompt ตัวเต็ม: {openIdea.kw}</p>
              <div className="flex items-center gap-2">
                <CopyValueButton value={buildFullPrompt(openIdea)} label="Prompt ตัวเต็ม" />
                <button
                  type="button"
                  onClick={() => setOpenIdea(null)}
                  className="min-h-[44px] rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-400 hover:text-white sm:min-h-[36px]"
                >
                  ปิด
                </button>
              </div>
            </div>
            <p className="mt-1 text-slate-400">
              คัดลอกไปวางในเครื่องมือ AI ได้เลย แล้วแทนที่ข้อความในวงเล็บเหลี่ยม [ ] ด้วยข้อมูลของคุณ
              หรือกด &quot;ค้นหา AI&quot; ด้านบนเพื่อดูว่าตัวไหนเหมาะกับงานนี้
            </p>
            <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-950/70 p-3 font-sans text-xs leading-relaxed text-slate-300">
              {buildFullPrompt(openIdea)}
            </pre>
          </div>
        )}
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
