"use client";

import { useState } from "react";

export function CopyValueButton({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
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
      aria-label={`คัดลอก${label}`}
      className="min-h-[44px] sm:min-h-[36px] rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-400 hover:text-white"
    >
      <span aria-live="polite">
        {state === "copied" ? "คัดลอกแล้ว ✓" : state === "failed" ? "คัดลอกไม่สำเร็จ" : "คัดลอก"}
      </span>
    </button>
  );
}
