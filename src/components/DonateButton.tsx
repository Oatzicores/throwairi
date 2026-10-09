import Link from "next/link";

/** Link to /support. `bar` is the wide variant used in the mobile bottom bar and page footer. */
export function DonateButton({ variant = "header" }: { variant?: "header" | "bar" }) {
  const size = variant === "bar" ? "min-h-[44px] px-5 py-2.5 text-sm" : "px-3 py-1.5 text-xs";
  return (
    <Link
      href="/support"
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-pink-400/50 bg-pink-500/10 font-medium text-pink-200 transition hover:bg-pink-500/20 focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:outline-none ${size}`}
    >
      <span aria-hidden>♥</span>
      สนับสนุนเรา
    </Link>
  );
}
