import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCatalogWithDiagnostics } from "./loadCatalog";
import { stripAffiliate } from "./affiliateGate";
import type { AITool } from "../types/ai-tool";

const tool = (loadCatalogWithDiagnostics().tools[0]) as AITool;
const withAffiliate: AITool = {
  ...tool,
  plansUrl: { url: "https://example.com/pricing", lastVerified: "2026-09-20" },
  affiliate: { url: "https://go.partner.example/x", program: "PartnerStack", disclosedAt: "2026-09-01" },
};

test("switch off: the affiliate object is removed and the input is untouched", () => {
  const out = stripAffiliate(withAffiliate, false);
  assert.equal("affiliate" in out, false);
  assert.equal(out.plansUrl?.url, "https://example.com/pricing");
  assert.ok(withAffiliate.affiliate, "original must not be mutated");
});

test("switch on: the tool is returned unchanged", () => {
  assert.equal(stripAffiliate(withAffiliate, true), withAffiliate);
});

test("nothing to strip: same object back", () => {
  assert.equal(stripAffiliate(tool, false), tool);
});

test("the serialised page data cannot contain the affiliate URL while off", () => {
  const json = JSON.stringify(stripAffiliate(withAffiliate, false));
  assert.equal(json.includes("go.partner.example"), false);
});

test("the loader output has no affiliate key when the switch is off", () => {
  // Real catalog + env unset (the default): nothing may carry an affiliate object.
  assert.ok(!process.env.NEXT_PUBLIC_AFFILIATE_ENABLED, "run tests without NEXT_PUBLIC_AFFILIATE_ENABLED");
  for (const t of loadCatalogWithDiagnostics().tools) assert.equal("affiliate" in t, false, t.id);
});
