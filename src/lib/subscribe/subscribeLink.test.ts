import { test } from "node:test";
import assert from "node:assert/strict";
import { getSubscribeLink } from "./subscribeLink";

const base = {
  id: "acme",
  websiteUrl: "https://www.acme.ai",
  pricing: { tier: "freemium" as const },
  plansUrl: { url: "https://acme.ai/pricing", lastVerified: "2026-09-20" },
};
const affiliate = { url: "https://go.partner.example/acme?ref=throwairi", program: "PartnerStack", disclosedAt: "2026-09-01" };

test("free tools have nothing to subscribe to", () => {
  assert.equal(getSubscribeLink({ ...base, pricing: { tier: "free" } }), null);
});

test("no plansUrl means no button (never falls back to the home page)", () => {
  assert.equal(getSubscribeLink({ ...base, plansUrl: undefined }), null);
});

test("a plansUrl on a third-party domain is refused", () => {
  assert.equal(getSubscribeLink({ ...base, plansUrl: { url: "https://eesel.ai/blog/acme-pricing", lastVerified: "2026-09-20" } }), null);
});

test("non-https plans URLs are refused", () => {
  assert.equal(getSubscribeLink({ ...base, plansUrl: { url: "http://acme.ai/pricing", lastVerified: "2026-09-20" } }), null);
  assert.equal(getSubscribeLink({ ...base, plansUrl: { url: "javascript:alert(1)", lastVerified: "2026-09-20" } }), null);
});

test("vendor plans page without affiliate: plain link", () => {
  const l = getSubscribeLink(base, { affiliateEnabled: false });
  assert.deepEqual(l, {
    href: "https://acme.ai/pricing",
    isAffiliate: false,
    rel: "noopener noreferrer",
    label: "ดูแผนและสมัคร",
  });
});

test("affiliate present but switch off: still the plain plans page", () => {
  const l = getSubscribeLink({ ...base, affiliate }, { affiliateEnabled: false });
  assert.equal(l?.href, "https://acme.ai/pricing");
  assert.equal(l?.isAffiliate, false);
});

test("affiliate present and switch on: sponsored link", () => {
  const l = getSubscribeLink({ ...base, affiliate }, { affiliateEnabled: true });
  assert.equal(l?.href, affiliate.url);
  assert.equal(l?.isAffiliate, true);
  assert.match(l!.rel, /sponsored/);
});

test("switch on but no affiliate object: plain link", () => {
  const l = getSubscribeLink(base, { affiliateEnabled: true });
  assert.equal(l?.isAffiliate, false);
});

test("a non-https affiliate URL is ignored", () => {
  const l = getSubscribeLink(
    { ...base, affiliate: { ...affiliate, url: "http://go.partner.example/acme" } },
    { affiliateEnabled: true },
  );
  assert.equal(l?.isAffiliate, false);
});

test("usage-based tools get a different label", () => {
  const l = getSubscribeLink({ ...base, pricing: { tier: "usage-based" } });
  assert.equal(l?.label, "ดูราคาและเริ่มใช้งาน");
});

test("the switch is off when the env var is unset", () => {
  const before = process.env.NEXT_PUBLIC_AFFILIATE_ENABLED;
  delete process.env.NEXT_PUBLIC_AFFILIATE_ENABLED;
  try {
    assert.equal(getSubscribeLink({ ...base, affiliate })?.isAffiliate, false);
    process.env.NEXT_PUBLIC_AFFILIATE_ENABLED = "yes"; // only the exact string "true" enables it
    assert.equal(getSubscribeLink({ ...base, affiliate })?.isAffiliate, false);
    process.env.NEXT_PUBLIC_AFFILIATE_ENABLED = "true";
    assert.equal(getSubscribeLink({ ...base, affiliate })?.isAffiliate, true);
  } finally {
    if (before === undefined) delete process.env.NEXT_PUBLIC_AFFILIATE_ENABLED;
    else process.env.NEXT_PUBLIC_AFFILIATE_ENABLED = before;
  }
});
