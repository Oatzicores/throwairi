const RAINBOW_WINDOW_DAYS = 7;

/** Day / month / year in Thai (e.g. "9 ต.ค. 2569"); falls back to the raw string if it is not a date. */
export function formatUpdateDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" });
}

/**
 * A date counts as "freshly updated" for RAINBOW_WINDOW_DAYS days after it —
 * computed relative to render time, not stored as a flag, so the effect
 * appears and disappears on its own as tool.lastUpdated moves in/out of the
 * window on future data edits. No per-update bookkeeping needed.
 */
export function isRecentlyUpdated(
  dateStr: string,
  now: Date = new Date(),
): boolean {
  const updated = new Date(dateStr);
  if (Number.isNaN(updated.getTime())) return false;
  const diffDays = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= RAINBOW_WINDOW_DAYS;
}
