"use client";

import { useEffect } from "react";
import Link from "next/link";

// Next.js 16 passes `retry` (not `reset`) to error boundaries.
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // No error-reporting service is wired up yet; at least leave a trace in
    // the browser console so a reproduced failure can be diagnosed.
    console.error("[ThrowAirI] unhandled page error", error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-white">เกิดข้อผิดพลาดบางอย่าง</h1>
      <p className="mt-2 text-sm text-slate-400">
        ขออภัย หน้านี้โหลดไม่สำเร็จ ลองใหม่อีกครั้ง ถ้ายังไม่หายให้กลับไปหน้าแรก
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500"
        >
          ลองใหม่
        </button>
        <Link href="/" className="text-sm text-slate-400 underline hover:text-slate-200">
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  );
}
