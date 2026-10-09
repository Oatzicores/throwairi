import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { toolSchema } from "./catalogSchema";
import type { AITool } from "../types/ai-tool";

const catalog: AITool[] = ["agent", "audio", "chat", "code", "image", "video"].flatMap(
  (f) => JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "catalog", `${f}.json`), "utf8")).tools,
);
const withRoadmap = catalog.filter((t) => t.roadmap);
const messages = (input: unknown) => {
  const r = toolSchema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
};

test("tools with a roadmap pass the schema", () => {
  assert.ok(withRoadmap.length >= 5);
  for (const t of withRoadmap) assert.deepEqual(messages(t), [], t.id);
});

test("a roadmap item citing a third-party page fails", () => {
  const t = structuredClone(withRoadmap.find((x) => x.roadmap!.items.length > 0)!);
  t.roadmap!.items[0].sourceUrl = "https://www.aitoolsdigest.com/blog/anything";
  assert.ok(messages(t).some((m) => m.startsWith("roadmap.items.0.sourceUrl")));
});

test("the check date is never in the future and items are not newer than the check", () => {
  const today = new Date().toISOString().slice(0, 10);
  for (const t of withRoadmap) {
    assert.ok(t.roadmap!.checkedAt <= today, t.id);
    for (const i of t.roadmap!.items) assert.ok(i.lastVerified <= today, t.id);
  }
});
