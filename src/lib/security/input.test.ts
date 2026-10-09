import { test } from "node:test";
import assert from "node:assert/strict";
import { isSafeHttpUrl, MAX_QUERY_LENGTH, readQueryParam } from "./input";

test("readQueryParam trims and keeps a normal prompt", () => {
  assert.equal(readQueryParam("  ทำคลิป TikTok  "), "ทำคลิป TikTok");
});

test("readQueryParam treats a missing value as empty", () => {
  assert.equal(readQueryParam(undefined), "");
});

test("readQueryParam takes the first value of a repeated parameter instead of crashing", () => {
  assert.equal(readQueryParam(["first", "second"]), "first");
  assert.equal(readQueryParam([]), "");
});

test("readQueryParam caps the length", () => {
  const long = "ก".repeat(MAX_QUERY_LENGTH * 4);
  assert.equal(readQueryParam(long).length, MAX_QUERY_LENGTH);
});

test("isSafeHttpUrl accepts http and https links", () => {
  assert.ok(isSafeHttpUrl("https://techcrunch.com/2026/10/01/story/"));
  assert.ok(isSafeHttpUrl("http://example.com/"));
});

test("isSafeHttpUrl refuses script, data and relative links", () => {
  for (const bad of ["javascript:alert(1)", "JAVASCRIPT:alert(1)", " javascript:alert(1)", "data:text/html,<b>x</b>", "/relative", "", null, undefined]) {
    assert.equal(isSafeHttpUrl(bad), false, String(bad));
  }
});
