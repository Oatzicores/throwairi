const RAINBOW_WINDOW_DAYS = 7;

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
