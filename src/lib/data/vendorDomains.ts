/**
 * Which URLs count as "the vendor's own page" for a tool.
 *
 * Shared by the zod schema (plansUrl), scripts/catalog-check.ts (the rule that
 * a "verified" fact must cite the vendor) and the runtime subscribe-link
 * resolver, so all three agree. Pure and dependency-free.
 */

// Extra vendor-owned domains for tools whose product site differs from the
// company's own domains. Matched on the registrable root (last two labels).
export const VENDOR_DOMAINS: Record<string, string[]> = {
  chatgpt: ["openai.com"],
  "claude-ai": ["anthropic.com", "claude.com"],
  "claude-code": ["anthropic.com", "claude.com"],
  gemini: ["blog.google", "google.com", "deepmind.google", "google.dev", "gemini.google"],
  // Veo is sold through the Google AI subscriptions page.
  "google-veo": ["blog.google", "google.com", "google.dev", "gemini.google"],
  // xAI documents Grok on docs.x.ai, separate from the grok.com product site.
  grok: ["x.ai"],
  // runwayml.com now redirects to runway.com.
  runway: ["runway.com"],
};

// Public leaderboards / registries that are themselves the source of a usage
// metric. Only accepted for usage signals, never for prices or rights.
export const METRIC_SOURCES = ["artificialanalysis.ai", "lmarena.ai", "huggingface.co", "civitai.com", "github.com"];

export const hostOf = (u: string): string => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

// Naive registrable root: last two labels. Wrong for .co.uk style suffixes,
// which no catalog tool uses today.
export const rootOf = (h: string): string => h.split(".").slice(-2).join(".");

export function isVendorUrl(
  toolId: string,
  websiteUrl: unknown,
  url: string,
  opts: { isUsageSignal?: boolean } = {},
): boolean {
  const src = rootOf(hostOf(url));
  if (!src) return false;
  const own = typeof websiteUrl === "string" ? rootOf(hostOf(websiteUrl)) : "";
  const extra = (VENDOR_DOMAINS[toolId] ?? []).map(rootOf);
  if (src === own || extra.includes(src)) return true;
  return opts.isUsageSignal === true && METRIC_SOURCES.includes(src);
}
