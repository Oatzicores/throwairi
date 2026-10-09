import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { applyView, countBy, cheapestMonthly } from "./viewFilter";
import { matchTools } from "../match/score";
import { parsePromptIntent } from "../match/intent";
import type { AITool } from "../types/ai-tool";

const catalog: AITool[] = ["agent", "audio", "chat", "code", "image", "video"].flatMap(
  (f) => JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "catalog", `${f}.json`), "utf8")).tools,
);
const results = matchTools(catalog, parsePromptIntent("อยากทำวิดีโอโปรโมทร้านกาแฟ", { category: "video" }));
const base = { sortKey: "match" as const, tiers: [], categories: [] };

test("no filter keeps everyone in match order with their real rank", () => {
  const v = applyView(results, base);
  assert.equal(v.length, results.length);
  assert.deepEqual(v.map((x) => x.result.tool.id), results.map((r) => r.tool.id));
  assert.deepEqual(v.map((x) => x.originalRank), results.map((_, i) => i + 1));
});

test("a price filter keeps only those tiers and keeps the original rank numbers", () => {
  const v = applyView(results, { ...base, tiers: ["free", "freemium"] });
  assert.ok(v.length > 0 && v.length < results.length);
  for (const x of v) assert.ok(["free", "freemium"].includes(x.result.tool.pricing.tier));
  for (const x of v) assert.equal(results[x.originalRank - 1].tool.id, x.result.tool.id);
});

test("a category filter matches tools that have ANY selected category", () => {
  const v = applyView(results, { ...base, categories: ["video"] });
  for (const x of v) assert.ok(x.result.tool.categories.includes("video"));
  assert.ok(v.length > 0);
});

test("name sort is alphabetical and price sort puts unpriced tools last", () => {
  const names = applyView(results, { ...base, sortKey: "name" }).map((x) => x.result.tool.name);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })));
  const prices = applyView(results, { ...base, sortKey: "price" }).map((x) => cheapestMonthly(x.result));
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
});

test("filtering never changes any score", () => {
  const before = JSON.stringify(results.map((r) => r.breakdown));
  applyView(results, { sortKey: "popularity", tiers: ["paid"], categories: ["image"] });
  assert.equal(JSON.stringify(results.map((r) => r.breakdown)), before);
});

test("countBy counts each tool once per key", () => {
  const c = countBy(results, (r) => [r.tool.pricing.tier, r.tool.pricing.tier]);
  assert.equal([...c.values()].reduce((a, b) => a + b, 0), results.length);
});
