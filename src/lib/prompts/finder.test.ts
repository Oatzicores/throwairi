import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { matchFinder } from "./finder";
import type { FinderTool } from "./finder";
import { buildFinderPool } from "./finderPool";
import { loadPromptLibrary } from "./promptLibrary";
import type { AITool } from "../types/ai-tool";

const catalog: AITool[] = ["agent", "audio", "chat", "code", "image", "video"].flatMap(
  (f) => JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "catalog", `${f}.json`), "utf8")).tools,
);

const pool = (cat: string) => buildFinderPool(loadPromptLibrary(cat)!, catalog);
const ids = (r: FinderTool[]) => r.map((t) => t.id);

test("typing part of a name finds the tool", () => {
  const v = pool("video");
  assert.equal(ids(matchFinder(v, "kl"))[0], "kling-ai");
  assert.ok(ids(matchFinder(v, "veo")).includes("google-veo"));
  assert.ok(ids(matchFinder(v, "RUN")).includes("runway"));
  assert.ok(ids(matchFinder(v, "google")).includes("google-veo"));
});

test("an empty query lists everyone, alphabetically, so no typing is needed", () => {
  const v = pool("video");
  const all = matchFinder(v, "");
  assert.equal(all.length, v.length);
  const names = all.map((t) => t.name);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)));
});

test("a query with no match returns nothing", () => {
  assert.deepEqual(matchFinder(pool("image"), "zzzzqq"), []);
});

test("the video pool has video tools and the tools recommended on the page, but not Sora", () => {
  const v = ids(pool("video"));
  for (const id of ["kling-ai", "google-veo", "runway", "vidu", "heygen", "gemini", "grok"]) {
    assert.ok(v.includes(id), `${id} missing`);
  }
  assert.ok(!v.includes("sora"), "discontinued tool offered");
  assert.ok(!v.includes("elevenlabs"), "audio tool offered on the video page");
});

test("chat tools recommended for images are searchable, but carry no chat ELO as an image signal", () => {
  const img = pool("image");
  const chatgpt = img.find((t) => t.id === "chatgpt")!;
  assert.ok(chatgpt, "chatgpt missing from image pool");
  assert.equal(chatgpt.signal, null);
  assert.ok(chatgpt.evidence.length > 0);
});

test("every tool in a pool either has sourced evidence or is honestly empty (no invented fields)", () => {
  for (const cat of ["image", "video"]) {
    for (const t of pool(cat)) {
      for (const e of t.evidence) assert.ok(e.sourceUrl.startsWith("https://") && e.checkedAt);
      if (t.signal) assert.ok(typeof t.signal.value === "number");
    }
  }
});

test("the finder never hands the browser an affiliate link while the switch is off", () => {
  process.env.NEXT_PUBLIC_AFFILIATE_ENABLED = "";
  for (const cat of ["image", "video"]) {
    for (const t of pool(cat)) assert.equal(t.link.affiliate, undefined, t.id);
  }
});
