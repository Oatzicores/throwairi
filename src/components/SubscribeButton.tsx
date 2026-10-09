import Link from "next/link";
import { getSubscribeLink } from "@/lib/subscribe/subscribeLink";
import type { LinkableTool } from "@/lib/subscribe/subscribeLink";

const VARIANT_CLASS = {
  card: "px-3 py-1.5",
  page: "px-4 py-2",
  tab: "px-4 py-2",
} as const;

/**
 * "ดูแผนและสมัคร ↗": opens the vendor's own plans page in a new tab. The
 * visitor subscribes and pays there; ThrowAirI never handles money.
 *
 * No hooks and no "use client", so it works in server pages and inside the
 * client components alike. Returns null when the tool has nothing to subscribe
 * to (free tool, or no verified plans page yet).
 *
 * The button looks identical whether or not the link is an affiliate link
 * (ADR 0001); the only differences are the rel attribute, the href, and the
 * visible disclosure line underneath. Put it inside a flex-wrap container so
 * the disclosure (basis-full) drops onto its own line.
 */
export function SubscribeButton({
  tool,
  variant,
}: {
  tool: LinkableTool;
  variant: keyof typeof VARIANT_CLASS;
}) {
  const link = getSubscribeLink(tool);
  if (!link) return null;
  const noteId = `subscribe-note-${tool.id}-${variant}`;

  return (
    <>
      <a
        href={link.href}
        target="_blank"
        rel={link.rel}
        aria-describedby={link.isAffiliate ? noteId : undefined}
        className={`inline-flex items-center rounded-lg border border-emerald-500/60 bg-emerald-600/15 text-sm font-medium text-emerald-300 transition hover:bg-emerald-600/25 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${VARIANT_CLASS[variant]}`}
      >
        {link.label} ↗<span className="sr-only"> (เปิดในแท็บใหม่)</span>
      </a>
      {link.isAffiliate && (
        <p id={noteId} className="basis-full text-xs text-slate-400">
          ลิงก์นี้เป็นลิงก์พันธมิตร ThrowAirI อาจได้ค่าคอมมิชชันโดยคุณไม่จ่ายเพิ่ม และไม่มีผลต่ออันดับ{" "}
          <Link href="/methodology" className="underline hover:text-slate-200">
            ดูรายละเอียด
          </Link>
        </p>
      )}
    </>
  );
}
