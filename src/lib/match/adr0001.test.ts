/**
 * ADR 0001 ("ranking is not for sale") turned into checks a machine can run.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { loadCatalogWithDiagnostics } from "../data/loadCatalog";
import { parsePromptIntent } from "./intent";
import { matchTools } from "./score";
import type { AITool } from "../types/ai-tool";

const FIXED_TODAY = "2026-09-20";

const INTENTS = [
  { prompt: "อยากวาดรูปโลโก้ร้านกาแฟ", opts: {} },
  { prompt: "ทำคลิปสั้น tiktok", opts: {} },
  { prompt: "อยากได้ AI ช่วยเขียนโค้ด", opts: {} },
  { prompt: "อยากลองแต่งเพลงฟรี", opts: { budget: "free-only" as const } },
  { prompt: "อยากทำวิดีโอโฆษณา", opts: { budget: "paid-ok" as const } },
  { prompt: "วาดรูป", opts: { category: "image" as const } },
  { prompt: "ทำคลิปและวาดรูป", opts: { category: "video" as const } },
  { prompt: "แปลภาษา สรุปเอกสาร", opts: { skillLevel: "advanced" as const } },
];

const project = (tools: AITool[]) =>
  INTENTS.map(({ prompt, opts }) =>
    matchTools(tools, parsePromptIntent(prompt, opts), FIXED_TODAY).map((r) => ({
      id: r.tool.id,
      breakdown: r.breakdown,
      reasons: r.reasons,
      warnings: r.warnings,
    })),
  );

test("adding plansUrl and affiliate links to tools does not change any ranking", () => {
  const plain = loadCatalogWithDiagnostics().tools;

  // Decorate adversarially: every other tool, plus the three that rank last
  // for the first intent (where a paid boost would matter most).
  const lastThree = matchTools(plain, parsePromptIntent(INTENTS[0].prompt), FIXED_TODAY)
    .slice(-3)
    .map((r) => r.tool.id);
  const decorated = plain.map((t, i) =>
    i % 2 === 0 || lastThree.includes(t.id)
      ? {
          ...structuredClone(t),
          plansUrl: { url: "https://example.com/pricing", lastVerified: FIXED_TODAY },
          affiliate: { url: "https://go.partner.example/x", program: "PartnerStack", disclosedAt: "2026-09-01" },
        }
      : structuredClone(t),
  );

  assert.deepEqual(project(decorated as AITool[]), project(plain));
});

test("nothing under src/lib/match reads commercial fields", () => {
  const dir = path.join(process.cwd(), "src", "lib", "match");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
  assert.ok(files.length > 0);
  for (const f of files) {
    const text = fs.readFileSync(path.join(dir, f), "utf8");
    assert.doesNotMatch(text, /affiliate|sponsor|commission|plansUrl/i, `${f} must not touch commercial fields`);
  }
});
