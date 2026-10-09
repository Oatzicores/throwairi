import type { AITool } from "../types/ai-tool";

/**
 * Global kill switch for affiliate links. Off unless the env var is exactly
 * "true". NEXT_PUBLIC_ so the same value is inlined into client bundles.
 *
 * Vercel's Hobby plan forbids commercial sites (affiliate links included), so
 * this stays off until the project is on Pro and the disclosure pages are live.
 */
export const isAffiliateEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_AFFILIATE_ENABLED === "true";

/**
 * Removes the affiliate object from a tool while the switch is off.
 *
 * This is not just a UI check: ResultsList and DetailTabs are client
 * components, so the whole tool object is serialised into the page. If the
 * affiliate URL were left on it, it would ship to every visitor even with the
 * switch "off". Stripping at load time keeps it out of the HTML entirely.
 */
export function stripAffiliate(tool: AITool, enabled: boolean = isAffiliateEnabled()): AITool {
  if (enabled || !tool.affiliate) return tool;
  const copy = { ...tool };
  delete copy.affiliate;
  return copy;
}
