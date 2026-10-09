"use client";

import { useState } from "react";

export function CopyPromptButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`คัดลอก Prompt ${label}`}
      className="min-h-[44px] sm:min-h-[36px] rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
    >
      <span aria-live="polite">
        {state === "copied" ? "คัดลอกแล้ว ✓" : state === "failed" ? "คัดลอกไม่สำเร็จ ลองเลือกข้อความเอง" : "คัดลอก"}
      </span>
    </button>
  );
}
