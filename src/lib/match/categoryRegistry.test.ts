import { test } from "node:test";
import assert from "node:assert/strict";
import { buildQuestion, isPickableCategory, parseCategoryParam, pickableList } from "./categoryRegistry";

test("parseCategoryParam accepts only registered categories", () => {
  assert.equal(parseCategoryParam("image"), "image");
  assert.equal(parseCategoryParam("video"), "video");
  assert.equal(parseCategoryParam("audio"), undefined); // until audio is registered
  assert.equal(parseCategoryParam(["image", "video"]), undefined);
  assert.equal(parseCategoryParam(""), undefined);
  assert.equal(parseCategoryParam("IMAGE"), undefined);
  assert.equal(parseCategoryParam("__proto__"), undefined);
  assert.equal(parseCategoryParam("constructor"), undefined);
  assert.equal(parseCategoryParam(undefined), undefined);
});

test("isPickableCategory rejects non-strings", () => {
  assert.equal(isPickableCategory(null), false);
  assert.equal(isPickableCategory(1), false);
});

test("the default question is exactly the agreed sentence", () => {
  assert.equal(buildQuestion(), "คุณจะนำ Prompt นี้ไปใช้ในวีดีโอหรือวาดภาพ?");
});

test("three categories read as a list", () => {
  const [video, image] = pickableList();
  const third = { ...image, id: "image" as const, buttonLabel: "เสียง" };
  assert.equal(buildQuestion([video, image, third]), "คุณจะนำ Prompt นี้ไปใช้ในวีดีโอ, วาดภาพ หรือเสียง?");
});

test("buttons are ordered video then image", () => {
  assert.deepEqual(pickableList().map((d) => d.id), ["video", "image"]);
});
