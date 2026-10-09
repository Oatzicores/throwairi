/**
 * Site-wide constants read from the environment so the public URL and the
 * contact channel are set in one place (Vercel project settings), never
 * hard-coded in pages.
 */

// Canonical public URL, used for metadataBase, sitemap and robots. Until the
// real domain is chosen this falls back to the planned Vercel project URL.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://throwairi.vercel.app"
).replace(/\/$/, "");

// Where readers send corrections. Unset means "no channel published yet";
// pages must say so honestly instead of showing a placeholder address.
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? null;
