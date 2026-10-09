import { test } from "node:test";
import assert from "node:assert/strict";
import { detectGenerativeCategories, stripFalsePositives } from "./categoryDetect";

const cats = (s: string) => detectGenerativeCategories(s).map((d) => d.category);

test("explicit Thai image prompt", () => {
  assert.deepEqual(cats("อยากสร้างภาพโปรไฟล์การ์ตูน"), ["image"]);
});

test("explicit video prompt, both Thai spellings", () => {
  assert.deepEqual(cats("ทำคลิปสั้น tiktok"), ["video"]);
  assert.deepEqual(cats("ช่วยตัดต่อวีดีโอ"), ["video"]);
  assert.deepEqual(cats("ช่วยตัดต่อวิดีโอ"), ["video"]);
});

test("Thai words that merely contain a keyword do not trigger the picker", () => {
  assert.deepEqual(cats("ขอภาพรวมตลาด AI"), []);
  assert.deepEqual(cats("สภาพอากาศวันนี้"), []);
  assert.deepEqual(cats("ขอรูปแบบรายงานประจำปี"), []);
  assert.deepEqual(cats("ภาพลักษณ์แบรนด์"), []);
});

test("ภาพยนตร์ (film) counts as video, not image", () => {
  assert.deepEqual(cats("อยากทำภาพยนตร์สั้น"), ["video"]);
});

test("stripping removes only the false part", () => {
  assert.deepEqual(cats("สภาพแวดล้อมและภาพประกอบหนังสือ"), ["image"]);
});

test("ASCII keywords need word boundaries", () => {
  assert.deepEqual(cats("logout button"), []);
  assert.deepEqual(cats("analogous colors"), []);
  assert.deepEqual(cats("solar eclipse facts"), []);
  assert.deepEqual(cats("Create a logo for my cafe"), ["image"]);
  assert.deepEqual(cats("PHOTO of a cat"), ["image"]);
  assert.deepEqual(cats("make two logos"), ["image"]);
});

test("generation-style prompt with no medium word offers both categories", () => {
  const found = cats("cinematic shot of a cat astronaut, 4k, highly detailed --ar 16:9");
  assert.ok(found.includes("image") && found.includes("video"), `got ${found.join(",")}`);
});

test("a lone weak style token is not enough", () => {
  assert.deepEqual(cats("4k"), []);
  assert.deepEqual(cats("cinematic"), []);
});

test("Midjourney-style tag list ranks image first", () => {
  assert.equal(cats("masterpiece, best quality, 1girl, watercolor --v 6")[0], "image");
});

test("camera-move vocabulary ranks video first", () => {
  assert.equal(cats("camera pan left, slow motion, 24fps, drone shot of a beach")[0], "video");
});

test("ordinary tasks do not trigger the picker", () => {
  assert.deepEqual(cats("เขียนอีเมลลาป่วย"), []);
  assert.deepEqual(cats("อยากได้ AI ช่วยเขียนโค้ด"), []);
  assert.deepEqual(cats("a runway fashion show review"), []);
});

test("empty and whitespace input", () => {
  assert.deepEqual(cats(""), []);
  assert.deepEqual(cats("   \n "), []);
});

test("detection is deterministic and side-effect free", () => {
  const a = detectGenerativeCategories("ทำคลิปและวาดรูป");
  const b = detectGenerativeCategories("ทำคลิปและวาดรูป");
  assert.deepEqual(a, b);
});

test("stripFalsePositives leaves other text alone", () => {
  assert.equal(stripFalsePositives("ภาพรวมและรูป", ["ภาพรวม"]), " และรูป");
});
