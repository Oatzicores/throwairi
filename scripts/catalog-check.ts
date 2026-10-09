/**
 * Catalog QA gate:  npm run catalog:check [-- --links] [-- --strict] [-- --max-age-days=90]
 *
 * Errors (exit 1): schema violations, duplicate ids, unreadable/invalid JSON,
 *   "verified" facts that do not cite the vendor's own site.
 * Warnings: facts with no sourceUrl, lastVerified older than --max-age-days,
 *           and (with --links) source pages that no longer open.
 * --strict turns warnings into failures; --fail-on-broken-links does so for
 * broken links only (used by the weekly link-check workflow).
 *
 * Link checks are opt-in: they need network access and many sites answer bots
 * with 403/429, which is reported as "blocked", not "broken".
 */
import fs from "node:fs";
import path from "node:path";
import { catalogFileSchema } from "../src/lib/data/catalogSchema";
import { hostOf, isVendorUrl } from "../src/lib/data/vendorDomains";
import { RATE_DATE, daysOld } from "../src/lib/currency";

const CATALOG_DIR = path.join(process.cwd(), "data", "catalog");
const args = process.argv.slice(2);
const checkLinks = args.includes("--links");
const strict = args.includes("--strict");
const failOnBrokenLinks = args.includes("--fail-on-broken-links");
const maxAgeDays = Number(
  args.find((a) => a.startsWith("--max-age-days="))?.split("=")[1] ?? 90,
);

const errors: string[] = [];
const warnings: string[] = [];

type Json = unknown;
const isRecord = (v: Json): v is Record<string, Json> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Depth-first walk that hands every (path, key, value) to `visit`. */
function walk(node: Json, at: string, visit: (at: string, key: string, value: Json, parent: Record<string, Json>) => void) {
  if (Array.isArray(node)) {
    node.forEach((item, i) => walk(item, `${at}[${i}]`, visit));
  } else if (isRecord(node)) {
    for (const [key, value] of Object.entries(node)) {
      visit(`${at}.${key}`, key, value, node);
      walk(value, `${at}.${key}`, visit);
    }
  }
}

const today = Date.now();
const urls = new Map<string, string[]>(); // url -> where it is used
const seenIds = new Map<string, string>();
let toolCount = 0;
const noPlansUrl: string[] = [];
const withAffiliate: string[] = [];

const files = fs.readdirSync(CATALOG_DIR).filter((f) => f.endsWith(".json")).sort();
for (const file of files) {
  let raw: Json;
  try {
    raw = JSON.parse(fs.readFileSync(path.join(CATALOG_DIR, file), "utf-8"));
  } catch (err) {
    errors.push(`${file}: cannot read/parse JSON — ${(err as Error).message}`);
    continue;
  }

  const result = catalogFileSchema.safeParse(raw);
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push(`${file}: ${issue.path.join(".")} — ${issue.message}`);
    }
  }

  const tools = isRecord(raw) && Array.isArray(raw.tools) ? raw.tools : [];
  tools.forEach((tool, i) => {
    toolCount++;
    const id = isRecord(tool) && typeof tool.id === "string" ? tool.id : `#${i}`;
    const where = `${file}:${id}`;

    if (isRecord(tool) && isRecord(tool.pricing) && tool.pricing.tier !== "free" && !tool.plansUrl && !tool.discontinued) {
      noPlansUrl.push(id);
    }
    if (isRecord(tool) && tool.affiliate) withAffiliate.push(id);

    const prev = seenIds.get(id);
    if (prev) errors.push(`${where}: duplicate id (also in ${prev})`);
    else seenIds.set(id, file);

    walk(tool, where, (at, key, value, parent) => {
      // A SourcedFact that names no source.
      if (key === "sourceUrl" && value === null) {
        const level = parent.confidence === "unknown" ? "unknown" : "unsourced";
        warnings.push(`${at}: ${level} — no sourceUrl`);
      }
      // "verified" must cite the vendor's own page (rule and domain lists: src/lib/data/vendorDomains.ts).
      if (
        key === "sourceUrl" &&
        typeof value === "string" &&
        parent.confidence === "verified" &&
        !isVendorUrl(id, isRecord(tool) ? tool.websiteUrl : null, value, { isUsageSignal: at.includes(".usageSignals[") })
      ) {
        errors.push(
          `${at}: "verified" but the source is ${hostOf(value)}, not the vendor's own site — use "probable" or cite the vendor page`,
        );
      }
      // Stale verification date.
      if (key === "lastVerified" && typeof value === "string") {
        const ageDays = (today - Date.parse(value)) / 86_400_000;
        if (ageDays > maxAgeDays) {
          warnings.push(`${at}: lastVerified ${value} is ${Math.floor(ageDays)} days old (> ${maxAgeDays})`);
        }
      }
      // plansUrl / affiliate carry their URL in a nested `url` field.
      if ((key === "plansUrl" || key === "affiliate") && isRecord(value) && typeof value.url === "string") {
        urls.set(value.url, [...(urls.get(value.url) ?? []), at]);
      }
      // URLs for the optional link check.
      const urlList =
        key === "sourceUrl" || key === "websiteUrl"
          ? [value]
          : key === "sourceUrls" && Array.isArray(value)
            ? value
            : [];
      for (const u of urlList) {
        if (typeof u === "string" && /^https?:\/\//i.test(u)) {
          urls.set(u, [...(urls.get(u) ?? []), at]);
        }
      }
    });
  });
}

async function probe(url: string): Promise<"ok" | "blocked" | "broken"> {
  const attempt = async (method: "HEAD" | "GET") => {
    const res = await fetch(url, {
      method,
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
      // Browser-like UA: some sites (e.g. gemini.google.com) reject obvious bots.
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36 ThrowAirI-catalog-check",
      },
    });
    return res.status;
  };
  try {
    let status = await attempt("HEAD");
    if (status >= 400) status = await attempt("GET"); // some servers reject HEAD
    if (status < 400) return "ok";
    if (status === 401 || status === 403 || status === 429 || status === 999) return "blocked";
    return "broken";
  } catch (err) {
    // The server answered but its headers exceed Node's size limit (gemini.google.com
    // does this): the host is alive, we just cannot read a status — not "broken".
    if ((err as { cause?: { code?: string } }).cause?.code === "UND_ERR_HEADERS_OVERFLOW") {
      return "blocked";
    }
    return "broken";
  }
}

async function runLinkCheck() {
  const list = [...urls.keys()];
  console.log(`Checking ${list.length} unique URLs…`);
  let next = 0;
  const counts = { ok: 0, blocked: 0, broken: 0 };
  const worker = async () => {
    while (next < list.length) {
      const url = list[next++];
      const outcome = await probe(url);
      counts[outcome]++;
      if (outcome === "broken") {
        const msg = `broken link ${url} (used at ${urls.get(url)!.slice(0, 2).join(", ")})`;
        (failOnBrokenLinks ? errors : warnings).push(msg);
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  console.log(`Links: ${counts.ok} ok, ${counts.blocked} blocked-by-site (not counted as broken), ${counts.broken} broken`);
}

async function main() {
  if (checkLinks) await runLinkCheck();

  if (noPlansUrl.length > 0) {
    warnings.push(
      `${noPlansUrl.length} non-free tool(s) have no plansUrl, so they show no subscribe button: ${noPlansUrl.join(", ")}`,
    );
  }
  if (daysOld(RATE_DATE) > 14) {
    warnings.push(`the USD->THB rate in src/lib/currency.ts is ${daysOld(RATE_DATE)} days old (${RATE_DATE}): update THB_PER_USD and RATE_DATE`);
  }
  if (withAffiliate.length > 0) {
    warnings.push(
      `${withAffiliate.length} tool(s) carry affiliate links (${withAffiliate.join(", ")}): keep NEXT_PUBLIC_AFFILIATE_ENABLED off until the site is on Vercel Pro and the disclosure pages are live`,
    );
  }

  console.log(`\nChecked ${toolCount} tools in ${files.length} files.`);
  if (warnings.length) {
    console.log(`\n${warnings.length} warning(s):`);
    warnings.forEach((w) => console.log(`  ⚠ ${w}`));
  }
  if (errors.length) {
    console.log(`\n${errors.length} error(s):`);
    errors.forEach((e) => console.log(`  ✖ ${e}`));
  }

  const failed = errors.length > 0 || (strict && warnings.length > 0);
  console.log(failed ? "\nFAILED" : "\nOK");
  process.exit(failed ? 1 : 0);
}

main();
