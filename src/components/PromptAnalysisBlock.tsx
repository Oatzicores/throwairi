"use client";

import { useEffect, useRef, useState } from "react";
import type { AnnotatedSegment } from "@/lib/match/promptAnalysis";

export function PromptAnalysisBlock({ segments }: { segments: AnnotatedSegment[] }) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    // clamped to 2 lines via CSS — only offer "read more" when the text
    // actually overflows that clamp, not on every card regardless of length
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [segments]);

  return (
    <div className="mt-3">
      <div className="text-xs font-semibold text-violet-300">🔍 จากการวิเคราะห์ Prompt ของคุณ</div>
      <p
        ref={textRef}
        className={`mt-1.5 text-sm text-slate-300 ${expanded ? "" : "line-clamp-2"}`}
      >
        {segments.map((seg, i) => (
          <span key={i}>
            {seg.explanations.length > 0 ? (
              <u
                className="decoration-violet-400 decoration-2 underline-offset-2"
                title={seg.explanations.join(" / ")}
              >
                {seg.text}
              </u>
            ) : (
              seg.text
            )}
            {i < segments.length - 1 ? " " : ""}
          </span>
        ))}
      </p>

      {overflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-medium text-violet-400 hover:text-violet-300 hover:underline"
        >
          {expanded ? "ย่อกลับ" : "ดูเพิ่มเติม"}
        </button>
      )}
    </div>
  );
}
