import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { toolSchema } from "./catalogSchema";
import type { AITool } from "../types/ai-tool";

const catalog: AITool[] = ["agent", "audio", "chat", "code", "image", "video"].flatMap(
  (f) => JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "catalog", `${f}.json`), "utf8")).tools,
);
const withVersion = catalog.filter((t) => t.latestVersion);

const messages = (input: unknown) => {
  const r = toolSchema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
};

test("the catalog names a latest version for the tools we verified, and each passes the schema", () => {
  assert.ok(withVersion.length >= 10, `only ${withVersion.length} tools have latestVersion`);
  for (const t of withVersion) assert.deepEqual(messages(t), [], t.id);
});

test("a latestVersion citing a third-party page fails", () => {
  const bad = structuredClone(withVersion[0]);
  bad.latestVersion!.sourceUrl = "https://www.aitoolsdigest.com/blog/latest-pika-ai-video-model-version-2026";
  assert.ok(messages(bad).some((m) => m.startsWith("latestVersion.sourceUrl")));
});

test("a release date is only present when the vendor page gave one (never invented)", () => {
  for (const t of withVersion) {
    const d = t.latestVersion!.releaseDate;
    if (d) assert.ok(d <= t.latestVersion!.lastVerified, `${t.id}: release date after the check date`);
  }
  // Only these vendor pages state a date; every other entry must be null.
  const dated = withVersion.filter((t) => t.latestVersion!.releaseDate).map((t) => t.id).sort();
  assert.deepEqual(dated, ["claude-ai", "claude-code", "deepseek-chat", "microsoft-copilot", "midjourney", "murf-ai", "n8n", "suno", "tabnine"]);
});
