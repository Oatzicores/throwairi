import fs from "node:fs";
import path from "node:path";
import type { AITool } from "@/lib/types/ai-tool";
import { stripAffiliate } from "./affiliateGate";

const CATALOG_DIR = path.join(process.cwd(), "data", "catalog");
const CATEGORY_FILES = [
  "chat.json",
  "code.json",
  "image.json",
  "video.json",
  "audio.json",
  "agent.json",
];

/**
 * Minimal structural validation — this is the load-time QA gate. A record
 * missing required fields is dropped (with a console warning) rather than
 * rendered half-broken. This is deliberately permissive on *content*
 * (we don't re-verify sources here) and strict on *shape*.
 */
function isValidTool(candidate: unknown): candidate is AITool {
  if (typeof candidate !== "object" || candidate === null) return false;
  const t = candidate as Record<string, unknown>;
  return (
    typeof t.id === "string" &&
    typeof t.name === "string" &&
    typeof t.vendor === "string" &&
    Array.isArray(t.categories) &&
    typeof t.websiteUrl === "string" &&
    typeof t.shortDescription === "string" &&
    typeof t.pricing === "object" &&
    t.pricing !== null &&
    Array.isArray(t.capabilities) &&
    Array.isArray(t.strengths) &&
    Array.isArray(t.weaknesses) &&
    Array.isArray(t.bestFor)
  );
}

let cachedCatalog: AITool[] | null = null;
let cachedIssues: string[] = [];

export function loadCatalogWithDiagnostics(): {
  tools: AITool[];
  issues: string[];
} {
  if (cachedCatalog) return { tools: cachedCatalog, issues: cachedIssues };

  const tools: AITool[] = [];
  const issues: string[] = [];
  const seenIds = new Set<string>();

  for (const file of CATEGORY_FILES) {
    const filePath = path.join(CATALOG_DIR, file);
    if (!fs.existsSync(filePath)) {
      issues.push(`missing catalog file: ${file}`);
      continue;
    }
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed?.tools) ? parsed.tools : [];
      for (const candidate of list) {
        if (!isValidTool(candidate)) {
          issues.push(
            `${file}: dropped invalid entry (${
              typeof candidate === "object" && candidate && "id" in candidate
                ? (candidate as { id: unknown }).id
                : "unknown id"
            })`,
          );
          continue;
        }
        if (seenIds.has(candidate.id)) {
          issues.push(`${file}: duplicate id "${candidate.id}", skipped`);
          continue;
        }
        seenIds.add(candidate.id);
        // Affiliate URLs never leave the server while the switch is off.
        tools.push(stripAffiliate(candidate));
      }
    } catch (err) {
      issues.push(`${file}: JSON parse error — ${(err as Error).message}`);
    }
  }

  cachedCatalog = tools;
  cachedIssues = issues;
  return { tools, issues };
}

export function loadCatalog(): AITool[] {
  return loadCatalogWithDiagnostics().tools;
}

export function getToolById(id: string): AITool | undefined {
  return loadCatalog().find((t) => t.id === id);
}

export function clearCatalogCache(): void {
  cachedCatalog = null;
  cachedIssues = [];
}
