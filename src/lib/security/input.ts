/**
 * Guards for anything that arrives from outside: URL query strings typed or
 * hand-edited by a visitor, and links inside third-party RSS feeds.
 */

/**
 * Longest prompt the results page will score. Real prompts are a sentence or
 * two; the cap keeps a hand-made multi-megabyte URL from tying up the server
 * function and from being echoed back into the page title.
 */
export const MAX_QUERY_LENGTH = 500;

/**
 * One query-string value as a trimmed, length-capped string. Next passes a
 * repeated parameter (?q=a&q=b) as an array, which would otherwise crash
 * `.trim()`; the first value wins.
 */
export function readQueryParam(value: string | string[] | undefined, max: number = MAX_QUERY_LENGTH): string {
  const first = Array.isArray(value) ? value[0] : value;
  return (first ?? "").trim().slice(0, max).trim();
}

/**
 * True only for absolute http(s) URLs. Feed links are rendered as <a href>, so
 * a `javascript:` or `data:` link from a compromised feed must never get there.
 */
export function isSafeHttpUrl(url: string | undefined | null): url is string {
  if (!url) return false;
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}
