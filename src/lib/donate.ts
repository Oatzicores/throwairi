/**
 * Donation details and the PromptPay QR payload. No network calls: the QR is
 * drawn from this payload on the server.
 *
 * Donations never influence ranking (docs/adr/0001) and promise no perks until a real
 * membership exists. Vercel's Fair Use page says asking for donations is not commercial use;
 * receiving subscription payments is.
 */

/**
 * The owner's mobile number for PromptPay and TrueMoney Wallet (the same number for both).
 *
 * Read from the DONATE_PHONE environment variable (Vercel project settings), never written in
 * the source: the code is meant to be published, and a fork must not ship the owner's number.
 * Dashes and spaces are allowed ("061-234-5678"). Returns null when unset or malformed, and the
 * support page then says donations are not open. Read at build time: changing it needs a redeploy.
 */
export function getDonatePhone(raw: string | undefined = process.env.DONATE_PHONE): string | null {
  const digits = (raw ?? "").replace(/[\s-]/g, "");
  return /^0\d{9}$/.test(digits) ? digits : null;
}

export const DONATE_METHODS = {
  promptpay: { id: "promptpay", name: "PromptPay", logo: "/brands/promptpay.png", logoWidth: 330, logoHeight: 111 },
  truemoney: { id: "truemoney", name: "TrueMoney Wallet", logo: "/brands/truemoney.png", logoWidth: 220, logoHeight: 43 },
} as const;

/** "0812345678" -> "081-234-5678" for reading by eye. */
export const formatPhone = (p: string): string => `${p.slice(0, 3)}-${p.slice(3, 6)}-${p.slice(6)}`;

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF), as EMVCo / PromptPay require. */
export function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

const tlv = (id: string, value: string) => `${id}${String(value.length).padStart(2, "0")}${value}`;

/**
 * Static PromptPay QR for a Thai mobile number (no amount: the donor types it).
 * Format: EMVCo merchant-presented QR, tag 29 with the PromptPay AID, phone as 0066 + 9 digits.
 */
export function promptPayPayload(phone: string): string {
  if (!/^0\d{9}$/.test(phone)) throw new Error("expected a 10-digit Thai mobile number starting with 0");
  const target = "0066" + phone.slice(1);
  const body =
    tlv("00", "01") +
    tlv("01", "11") + // 11 = static QR, reusable
    tlv("29", tlv("00", "A000000677010111") + tlv("01", target)) +
    tlv("58", "TH") +
    tlv("53", "764"); // THB
  const withCrcTag = body + "6304";
  return withCrcTag + crc16(withCrcTag);
}
