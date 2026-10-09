import type { LinkableTool } from "../subscribe/subscribeLink";

/**
 * Client-safe pieces of the "find another AI" box on the prompt pages: the
 * slim tool record the browser receives and the typing-tolerant matcher.
 * No fs, no env: this file is imported by client components.
 */
export interface FinderEvidence {
  kind: "vendor-guide" | "leaderboard";
  text: string;
  sourceUrl: string;
  checkedAt: string;
}

export interface FinderTool {
  id: string;
  name: string;
  vendor: string;
  shortDescription: string;
  /** Just enough for getSubscribeLink; affiliate data was already stripped at load when the switch is off. */
  link: LinkableTool;
  /** Last product update with what the source said; null when the catalog has no sourced date. */
  lastUpdate?: { value: string; note: string | null; sourceUrl: string | null } | null;
  /** Evidence this library already holds about the tool (guides, leaderboard snapshots). */
  evidence: FinderEvidence[];
  /** The catalog's own leaderboard signal, only when it measures this page's category. */
  signal: { label: string; value: number; lastVerified: string | null; sourceUrl: string | null } | null;
}

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9฀-๿]/g, "");

function isSubsequence(needle: string, hay: string): boolean {
  let i = 0;
  for (const ch of hay) if (ch === needle[i]) i++;
  return i === needle.length;
}

export interface Named {
  id: string;
  name: string;
  vendor: string;
}

/** 0 = best. null = no match. */
function rank(tool: Named, q: string): number | null {
  const name = norm(tool.name);
  const id = norm(tool.id);
  const vendor = norm(tool.vendor);
  if (name.startsWith(q) || id.startsWith(q)) return 0;
  const words = [...tool.name.split(/[\s()/.-]+/), ...tool.vendor.split(/[\s()/.-]+/)].map(norm).filter(Boolean);
  if (words.some((w) => w.startsWith(q))) return 1;
  if (name.includes(q) || id.includes(q) || vendor.includes(q)) return 2;
  // "mj", "lnrd": letters in order, for people who type only part of a name.
  if (q.length >= 2 && (isSubsequence(q, name) || isSubsequence(q, id))) return 3;
  return null;
}

/** Empty query lists everyone alphabetically, so nobody has to type to see the options. */
export function matchFinder<T extends Named>(pool: T[], query: string): T[] {
  const q = norm(query);
  if (!q) return [...pool].sort((a, b) => a.name.localeCompare(b.name));
  return pool
    .map((t) => ({ t, r: rank(t, q) }))
    .filter((x): x is { t: T; r: number } => x.r !== null)
    .sort((a, b) => a.r - b.r || a.t.name.localeCompare(b.t.name))
    .map((x) => x.t);
}
