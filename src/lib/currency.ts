/**
 * USD -> THB for display. Vendors price in dollars; Thai readers think in baht, so every dollar price
 * is shown as "$20 (≈ ฿671)". The baht figure is an ESTIMATE from one dated mid-market rate, never a price
 * the vendor quotes (card fees, VAT and the bank's own rate change the real charge).
 *
 * Update THB_PER_USD and RATE_DATE together (source: open.er-api.com/v6/latest/USD, "Rates By
 * Exchange Rate API"). scripts/catalog-check.ts warns when the date gets old.
 */
export const THB_PER_USD = 33.573288;
export const RATE_DATE = "2026-09-30";
export const RATE_SOURCE_NAME = "ExchangeRate-API";
export const RATE_SOURCE_URL = "https://www.exchangerate-api.com";

export const usdToThb = (usd: number): number => Math.round(usd * THB_PER_USD);

const fmt = (n: number) => n.toLocaleString("en-US");

/** 20 -> "$20 (≈ ฿671)"; 4.99 -> "$4.99 (≈ ฿168)". */
export function usdWithThb(usd: number): string {
  return `$${fmt(usd)} (≈ ฿${fmt(usdToThb(usd))})`;
}

/**
 * Adds the baht estimate to monthly dollar amounts written inside free text, e.g.
 * "$17/เดือนหากจ่ายรายปี" -> "$17 (≈ ฿571)/เดือนหากจ่ายรายปี". Only amounts followed by a per-month
 * marker are touched: per-million-token API prices and one-off amounts stay as written.
 */
export function addThbToMonthlyUsd(text: string): string {
  return text.replace(
    /\$(\d[\d,]*(?:\.\d+)?)(?=\s*(?:\/\s*เดือน|\/\s*mo\b|ต่อเดือน|รายเดือน))/g,
    (_m, num: string) => usdWithThb(Number(num.replace(/,/g, ""))),
  );
}

export const daysOld = (isoDate: string, now: Date = new Date()): number =>
  Math.floor((now.getTime() - Date.parse(isoDate)) / 86_400_000);
