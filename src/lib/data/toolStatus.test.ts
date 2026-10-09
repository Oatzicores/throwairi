import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { toolSchema } from "./catalogSchema";
import { activeTools, isActiveTool } from "./toolStatus";
import { matchTools } from "../match/score";
import { parsePromptIntent } from "../match/intent";
import { getSubscribeLink } from "../subscribe/subscribeLink";
import type { AITool } from "../types/ai-tool";

const read = (f: string) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "catalog", `${f}.json`), "utf8")).tools as AITool[];
const video = read("video");
const sora = video.find((t) => t.id === "sora")!;

const messages = (input: unknown) => {
  const r = toolSchema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
};

test("Sora is in the catalog, marked discontinued from a vendor page, and passes the schema", () => {
  assert.ok(sora, "sora entry missing");
  assert.ok(sora.discontinued);
  assert.deepEqual(messages(sora), []);
});

test("a discontinued notice citing a third-party page fails", () => {
  const bad = structuredClone(sora);
  bad.discontinued!.sourceUrl = "https://help.apiyi.com/en/openai-sora-2-policy-change-plus-pro-only-en.html";
  assert.ok(messages(bad).some((m) => m.startsWith("discontinued.sourceUrl")));
});

test("a discontinued tool cannot carry a plansUrl", () => {
  const bad = { ...structuredClone(sora), plansUrl: { url: "https://openai.com/pricing", lastVerified: "2026-09-21" } };
  assert.ok(messages(bad).some((m) => m.startsWith("discontinued")));
});

test("activeTools drops discontinued tools and keeps the rest", () => {
  const all = [...video];
  const active = activeTools(all);
  assert.ok(!active.some((t) => t.id === "sora"));
  assert.equal(active.length, all.length - all.filter((t) => !isActiveTool(t)).length);
  assert.ok(active.length > 0);
});

test("a discontinued tool is never ranked, whatever the prompt says", () => {
  const catalog = ["video", "chat", "image"].flatMap(read);
  for (const q of ["สร้างวิดีโอ sora", "sora video generator", "อยากทำคลิปโฆษณา"]) {
    const ids = matchTools(catalog, parsePromptIntent(q, {})).map((r) => r.tool.id);
    assert.ok(!ids.includes("sora"), `"${q}" ranked sora`);
  }
});

test("a discontinued tool has no subscribe button even if a plans page were present", () => {
  const withPlans = { ...sora, plansUrl: { url: "https://openai.com/pricing", lastVerified: "2026-09-21" } };
  assert.equal(getSubscribeLink(withPlans), null);
});
