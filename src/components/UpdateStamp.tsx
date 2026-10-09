import { formatUpdateDate, isRecentlyUpdated } from "@/lib/freshness";

export interface UpdateInfo {
  value: string;
  note?: string | null;
  sourceUrl?: string | null;
}

/**
 * The tool's last product update (day / month / year) plus what was actually
 * found at the source. Used on every surface that shows an AI so none of them
 * is blank; a tool with no sourced date says so instead of guessing.
 */
export function UpdateStamp({
  update,
  label = "อัปเดตล่าสุด",
  showNote = false,
  className = "",
}: {
  update?: UpdateInfo | null;
  label?: string;
  showNote?: boolean;
  className?: string;
}) {
  if (!update) {
    return (
      <div className={`text-xs text-slate-500 ${className}`}>
        {label} ยังไม่มีวันที่ที่ยืนยันจากผู้ให้บริการได้
      </div>
    );
  }
  const fresh = isRecentlyUpdated(update.value);
  return (
    <div className={`text-xs ${className}`}>
      <span className="text-slate-500">{label} </span>
      <span className={fresh ? "rainbow-text" : "text-slate-300"}>{formatUpdateDate(update.value)}</span>
      {fresh && <span className="ml-1 text-slate-500">(เพิ่งอัปเดต)</span>}
      {update.sourceUrl && (
        <a
          href={update.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1.5 whitespace-nowrap text-violet-400 hover:underline"
        >
          แหล่งที่มา ↗
        </a>
      )}
      {showNote && update.note && <p className="mt-0.5 leading-relaxed text-slate-500">{update.note}</p>}
    </div>
  );
}
