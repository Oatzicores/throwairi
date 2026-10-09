import { test } from "node:test";
import assert from "node:assert/strict";
import { usdWithThb, addThbToMonthlyUsd, usdToThb, THB_PER_USD } from "./currency";

test("the rate is a plausible THB per USD", () => {
  assert.ok(THB_PER_USD > 25 && THB_PER_USD < 45);
});

test("$20 is shown with its baht estimate (the owner's example)", () => {
  assert.equal(usdWithThb(20), "$20 (≈ ฿671)");
  assert.equal(usdToThb(20), 671);
});

test("decimals and thousands are formatted", () => {
  assert.equal(usdWithThb(4.99), "$4.99 (≈ ฿168)");
  assert.match(usdWithThb(1000), /^\$1,000 \(≈ ฿33,\d{3}\)$/);
});

test("only per-month dollar amounts in free text are converted", () => {
  assert.equal(addThbToMonthlyUsd("$17/เดือนหากจ่ายรายปี"), "$17 (≈ ฿571)/เดือนหากจ่ายรายปี");
  assert.equal(addThbToMonthlyUsd("รายเดือน ~$10 ต่อเดือน"), "รายเดือน ~$10 (≈ ฿336) ต่อเดือน");
  assert.equal(addThbToMonthlyUsd("Sonnet 5.5 $2/$10 ต่อล้าน token"), "Sonnet 5.5 $2/$10 ต่อล้าน token");
  assert.equal(addThbToMonthlyUsd("ไม่มีราคา"), "ไม่มีราคา");
});
