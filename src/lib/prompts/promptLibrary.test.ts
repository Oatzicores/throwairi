import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { promptLibrarySchema, missingEvidenceKeys, loadPromptLibrary } from "./promptLibrary";
import type { PromptLibrary } from "./promptLibrary";
import { PICKABLE_CATEGORIES } from "@/lib/match/categoryRegistry";

const catalogIds = new Set<string>();
for (const f of ["agent", "audio", "chat", "code", "image", "video"]) {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "catalog", `${f}.json`), "utf8"));
  for (const t of raw.tools) catalogIds.add(t.id);
}

const THAI = /[฀-๿]/;
const today = new Date().toISOString().slice(0, 10);

const libraries = Object.keys(PICKABLE_CATEGORIES).map((cat) => {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "prompts", `${cat}.json`), "utf8"));
  return { cat, raw };
});

test("every pickable category has a prompt library that loads", () => {
  for (const { cat } of libraries) {
    const lib = loadPromptLibrary(cat);
    assert.ok(lib, `${cat} library failed to load`);
    assert.equal(lib.category, cat);
  }
});

test("unknown or hostile category names load nothing", () => {
  for (const bad of ["audio", "__proto__", "../catalog/chat", ""]) {
    assert.equal(loadPromptLibrary(bad), null, bad);
  }
});

for (const { cat, raw } of libraries) {
  const parsed = promptLibrarySchema.safeParse(raw);

  test(`${cat}: matches the schema`, () => {
    assert.ok(parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.issues));
  });
  if (!parsed.success) continue;
  const lib: PromptLibrary = parsed.data;
  const picks = [...lib.overview, ...lib.prompts.flatMap((p) => p.picks)];

  test(`${cat}: every evidence key a pick cites exists`, () => {
    assert.deepEqual(missingEvidenceKeys(lib), []);
  });

  test(`${cat}: every recommended tool is in the catalog`, () => {
    for (const p of picks) assert.ok(catalogIds.has(p.toolId), `unknown toolId ${p.toolId}`);
  });

  test(`${cat}: no evidence is dated in the future`, () => {
    for (const [key, e] of Object.entries(lib.evidence)) {
      assert.ok(e.checkedAt <= today, `${key} checkedAt ${e.checkedAt}`);
    }
    assert.ok(lib.updatedAt <= today);
  });

  test(`${cat}: prompt ids are unique`, () => {
    const ids = lib.prompts.map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  test(`${cat}: Thai prompt is Thai, English prompt has no Thai`, () => {
    for (const p of lib.prompts) {
      assert.ok(THAI.test(p.thai), `${p.id}: thai block has no Thai characters`);
      assert.ok(!THAI.test(p.english), `${p.id}: english block contains Thai characters`);
    }
  });

  test(`${cat}: the overview names at least one best pick`, () => {
    assert.ok(lib.overview.some((p) => p.role === "best"));
  });

  test(`${cat}: every prompt has a best pick`, () => {
    for (const p of lib.prompts) {
      assert.ok(p.picks.some((k) => k.role === "best"), `${p.id}: no best pick`);
    }
  });

  test(`${cat}: leaderboard evidence states its snapshot date in the text`, () => {
    for (const [key, e] of Object.entries(lib.evidence)) {
      if (e.kind !== "leaderboard") continue;
      assert.ok(e.text.includes(e.checkedAt), `${key}: text must say the snapshot date`);
    }
  });
}

test("the library never mentions money-driven fields", () => {
  const text = libraries.map((l) => JSON.stringify(l.raw)).join("\n").toLowerCase();
  for (const word of ["affiliate", "sponsor", "commission", "referral", "utm_"]) {
    assert.ok(!text.includes(word), `library data contains "${word}"`);
  }
});
