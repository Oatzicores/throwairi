import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { toolSchema } from "./catalogSchema";

// A real, currently valid catalog entry is the fixture.
const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "catalog", "audio.json"), "utf8"));
const real = raw.tools.find((t: { id: string }) => t.id === "elevenlabs");

// The catalog entry now carries a plansUrl; the fixture starts without either
// new field so each test decides exactly what is present.
const elevenlabs = (() => {
  const copy = structuredClone(real);
  delete copy.plansUrl;
  delete copy.affiliate;
  return copy;
})();

const withFields = (extra: Record<string, unknown>) => ({ ...structuredClone(elevenlabs), ...extra });
const okPlans = { url: "https://elevenlabs.io/pricing", lastVerified: "2026-09-20" };
const okAffiliate = { url: "https://try.elevenlabs.io/example", program: "PartnerStack", disclosedAt: "2026-09-01" };

const messages = (input: unknown) => {
  const r = toolSchema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
};

test("a tool with neither new field still passes (backward compatible)", () => {
  assert.deepEqual(messages(elevenlabs), []);
});

test("the real catalog entry, with its plansUrl, passes", () => {
  assert.deepEqual(messages(real), []);
});

test("a vendor-domain plansUrl passes", () => {
  assert.deepEqual(messages(withFields({ plansUrl: okPlans })), []);
});

test("a third-party plansUrl fails", () => {
  const m = messages(withFields({ plansUrl: { url: "https://eesel.ai/blog/elevenlabs-pricing", lastVerified: "2026-09-20" } }));
  assert.ok(m.some((x) => x.startsWith("plansUrl.url")), m.join(" | "));
});

test("an http plansUrl fails", () => {
  const m = messages(withFields({ plansUrl: { url: "http://elevenlabs.io/pricing", lastVerified: "2026-09-20" } }));
  assert.ok(m.length > 0);
});

test("affiliate without plansUrl fails", () => {
  const m = messages(withFields({ affiliate: okAffiliate }));
  assert.ok(m.some((x) => x.startsWith("affiliate")), m.join(" | "));
});

test("affiliate with plansUrl passes", () => {
  assert.deepEqual(messages(withFields({ plansUrl: okPlans, affiliate: okAffiliate })), []);
});

test("a disclosedAt in the future fails", () => {
  const m = messages(withFields({ plansUrl: okPlans, affiliate: { ...okAffiliate, disclosedAt: "2999-01-01" } }));
  assert.ok(m.some((x) => x.includes("disclosedAt")), m.join(" | "));
});
