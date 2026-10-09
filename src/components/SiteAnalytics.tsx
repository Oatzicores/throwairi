"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/**
 * Vercel Web Analytics wrapper. The results page keeps the visitor's request
 * text in the URL (/results?q=...), which can contain personal details, so
 * the query string and hash are stripped before any event leaves the browser.
 * Only the path is ever reported.
 */
function stripQuery(event: BeforeSendEvent): BeforeSendEvent | null {
  try {
    const url = new URL(event.url);
    return { ...event, url: `${url.origin}${url.pathname}` };
  } catch {
    // An unparseable URL might still hold a query; drop the event instead.
    return null;
  }
}

export function SiteAnalytics() {
  return <Analytics beforeSend={stripQuery} />;
}
