import { test } from "node:test";
import assert from "node:assert/strict";
import { crc16, promptPayPayload, formatPhone, getDonatePhone } from "./donate";

// A made-up number: the owner's real one lives only in the DONATE_PHONE env var.
const SAMPLE_PHONE = "0812345678";

test("crc16 matches the standard CCITT-FALSE check value", () => {
  assert.equal(crc16("123456789"), "29B1");
});

test("PromptPay payload has the required structure and a valid checksum", () => {
  const p = promptPayPayload(SAMPLE_PHONE);
  assert.ok(p.startsWith("000201010211")); // format 01, static QR
  assert.ok(p.includes("0016A000000677010111")); // PromptPay AID
  assert.ok(p.includes("01130066812345678")); // 13 chars: 0066 + number without the leading 0
  assert.ok(p.includes("5802TH"));
  assert.ok(p.includes("5303764"));
  assert.ok(p.includes("6304"));
  // The last 4 characters are the CRC of everything before them.
  assert.equal(p.slice(-4), crc16(p.slice(0, -4)));
});

test("payload stays byte-identical to the known-good vector", () => {
  // Recorded 2026-10-09 from this function after it matched the widely used promptpay-qr
  // library byte for byte on the owner's real number (checked 2026-09-21).
  assert.equal(promptPayPayload(SAMPLE_PHONE), "00020101021129370016A000000677010111011300668123456785802TH530376463045D82");
});

test("tag 29 length field matches its content", () => {
  const p = promptPayPayload(SAMPLE_PHONE);
  const at = p.indexOf("29");
  const len = Number(p.slice(at + 2, at + 4));
  const inner = p.slice(at + 4, at + 4 + len);
  assert.ok(inner.startsWith("0016A000000677010111"));
  assert.ok(inner.endsWith("812345678"));
});

test("a malformed phone number is refused", () => {
  for (const bad of ["", "812345678", "08123456789", "abcdefghij", "+66812345678"]) {
    assert.throws(() => promptPayPayload(bad), bad);
  }
});

test("formatPhone groups the digits", () => {
  assert.equal(formatPhone(SAMPLE_PHONE), "081-234-5678");
});

test("getDonatePhone reads the env value, with or without dashes and spaces", () => {
  assert.equal(getDonatePhone("0812345678"), SAMPLE_PHONE);
  assert.equal(getDonatePhone("081-234-5678"), SAMPLE_PHONE);
  assert.equal(getDonatePhone(" 081 234 5678 "), SAMPLE_PHONE);
});

test("getDonatePhone returns null when the env var is missing or malformed", () => {
  for (const bad of [undefined, "", "12345", "+66812345678", "0812345678x"]) {
    assert.equal(getDonatePhone(bad), null, String(bad));
  }
});
