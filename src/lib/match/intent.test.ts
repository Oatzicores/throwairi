import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePromptIntent } from "./intent";

test("no override keeps the old behaviour", () => {
  assert.deepEqual(parsePromptIntent("อยากได้ AI").categories, ["chat"]);
  assert.equal(parsePromptIntent("ทำคลิปและวาดรูป").categories[0], "image"); // tie: registry order
});

test("a chosen category goes first and the unchosen sibling is dropped", () => {
  const both = "ทำคลิปและวาดรูป";
  const video = parsePromptIntent(both, { category: "video" }).categories;
  assert.equal(video[0], "video");
  assert.ok(!video.includes("image"));
  const image = parsePromptIntent(both, { category: "image" }).categories;
  assert.equal(image[0], "image");
  assert.ok(!image.includes("video"));
});

test("a chosen category with nothing detected does not add chat", () => {
  assert.deepEqual(parsePromptIntent("อยากได้ AI", { category: "image" }).categories, ["image"]);
});

test("other detected categories stay as the secondary", () => {
  const c = parsePromptIntent("เขียนโค้ดสร้างภาพ", { category: "image" }).categories;
  assert.equal(c[0], "image");
  assert.ok(c.includes("code"));
});

test("budget and skill overrides still work with a category", () => {
  const i = parsePromptIntent("วาดรูป", { category: "image", budget: "free-only", skillLevel: "advanced" });
  assert.equal(i.budget, "free-only");
  assert.equal(i.skillLevel, "advanced");
});
