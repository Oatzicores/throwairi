/**
 * Core data model for the AI catalog.
 *
 * Every factual field that can go stale carries a `SourcedFact<T>` wrapper —
 * value + confidence + source + verification date — instead of a bare value.
 * This is what lets the UI show "last verified" badges and the QA pass catch
 * unsourced numbers instead of fabricated ones.
 */

export type Confidence = "verified" | "probable" | "inference" | "unknown";

export interface SourcedFact<T> {
  value: T;
  confidence: Confidence;
  sourceUrl: string | null;
  lastVerified: string | null; // ISO date, e.g. "2026-08-15"
  note?: string;
}

export type AICategory =
  | "chat"
  | "image"
  | "video"
  | "audio"
  | "code"
  | "agent"
  | "multimodal"
  | "search";

export type CapabilityDimension =
  | "chat"
  | "image"
  | "video"
  | "audio"
  | "code"
  | "reasoning"
  | "longContext"
  | "agentTools";

export interface CapabilityScore {
  dimension: CapabilityDimension;
  score: SourcedFact<number>; // 0-100
}

export type PricingTier = "free" | "freemium" | "paid" | "usage-based";

export interface PricingPlan {
  name: string;
  priceUsdPerMonth: number | null; // null = usage-based / contact sales / not priced in USD
  /**
   * Shown instead of the USD figure when set. Use it for vendors that price in
   * another currency (never convert with an unsourced exchange rate), e.g.
   * "600 บาท ต่อ 3 เดือน".
   */
  priceLabel?: string;
  quota: string; // human-readable e.g. "50 msgs / 3 hrs"
  commercialUseAllowed: SourcedFact<boolean>;
  notes?: string;
}

export interface PricingInfo {
  tier: PricingTier;
  plans: PricingPlan[];
  freeQuota: string | null;
  commercialUseSummary: SourcedFact<string>;
  sourceUrl: string;
  lastVerified: string; // ISO date
}

export interface ReviewSignal {
  positiveThemes: string[];
  negativeThemes: string[];
  paidVerifiedSummary: string | null; // synthesis, not a quote
  freeTierSummary: string | null;
  sourceUrls: string[];
  lastVerified: string;
  sampleSizeNote?: string; // e.g. "based on ~200 G2/Capterra verified reviews"
}

export interface UsageSignal {
  metric:
    | "arena-elo"
    | "openrouter-share"
    | "civitai-downloads"
    | "huggingface-downloads"
    | "similarweb-rank"
    | "github-stars";
  value: SourcedFact<number>;
  label: string; // human-readable, e.g. "LMArena Text ELO"
}

export interface VersionUpdate {
  version: string; // e.g. "GPT-5.2", "Gemini 3.7 Flash"
  releaseDate: SourcedFact<string>; // ISO date the vendor actually shipped this version
  summary: string; // Thai: what changed in this version

  /**
   * How real users reacted to this specific version, from actual reviews/
   * threads (Reddit, review sites, forums) — วิเคราะห์ข้อมูลจากผู้ใช้งานจริง,
   * never an invented quote. starRating is the editorial synthesis of that
   * sentiment (0-5, 0.5 steps), not a scraped review-site score unless one
   * was actually found and cited via sourceUrls.
   */
  userSentiment: {
    summary: string; // Thai
    starRating: number; // 0-5
    sourceUrls: string[];
  };
}

/**
 * Where the "subscribe" button sends a visitor: the vendor's OWN plans page
 * (never a third-party blog, never the pricing.sourceUrl citation). The
 * schema enforces a vendor-owned https URL.
 */
export interface PlansLink {
  url: string;
  lastVerified: string; // ISO date the page was opened and confirmed to list plans
}

/**
 * The newest model or version the vendor's own page names, e.g. "GPT-6 Astra".
 * releaseDate is null when the page gives none: we show the date we checked
 * instead, never a guessed release date. Must cite the vendor's domain.
 */
export interface LatestVersion {
  name: string;
  releaseDate: string | null; // ISO date, only when the vendor page states it
  sourceUrl: string;
  lastVerified: string; // ISO date the page was opened
  note?: string;
}

/**
 * One forward-looking item the vendor itself published: a scheduled model retirement, an announced release,
 * or a stated intention. `when` is the timeframe exactly as the vendor gives it (null if none). Never our
 * guess about what a company "will probably" do.
 */
export interface RoadmapItem {
  kind: "retirement" | "announced" | "intent";
  text: string; // Thai
  when: string | null;
  sourceUrl: string; // must be on the vendor's domain
  lastVerified: string; // ISO date
}

/** `items` empty + `checkedAt` set means "we looked and the vendor published nothing forward-looking". */
export interface Roadmap {
  checkedAt: string; // ISO date
  note?: string; // what we looked at / what the vendor says about not publishing one
  items: RoadmapItem[];
}

/**
 * The vendor's own statement that the product has been shut down. The schema
 * requires a page on the vendor's domain: we never mark a tool discontinued
 * (or leave one running) on a third party's word.
 */
export interface DiscontinuedNotice {
  since: string; // ISO date the vendor gave for the shutdown
  note: string; // Thai, only what the vendor page says
  sourceUrl: string;
  lastVerified: string;
}

/**
 * Affiliate tracking link for the same tool. Absent from the data until the
 * site goes live with affiliates (ADR 0001); ignored unless
 * NEXT_PUBLIC_AFFILIATE_ENABLED is "true". It must never influence ranking.
 */
export interface AffiliateLink {
  url: string;
  program: string; // e.g. "PartnerStack"
  disclosedAt: string; // ISO date the on-site disclosure for it was published
}

export interface NewsItem {
  title: string;
  url: string;
  publishedAt: string; // ISO datetime
  source: string;
  summary: string;
}

export interface AITool {
  id: string; // kebab-case slug
  name: string;
  vendor: string;
  categories: AICategory[];
  logoUrl: string | null;
  websiteUrl: string;
  shortDescription: string;
  longDescription: string;
  launchDate: SourcedFact<string> | null;

  /**
   * When the AI vendor itself last shipped a verified, dated change (new
   * model, pricing/access change, major feature) — distinct from
   * `lastUpdated`, which just tracks when we last edited this catalog
   * record. Omit entirely when no specific dated vendor change is sourced;
   * never approximate a day to fill this in, since the freshness banner
   * depends on exact-day precision.
   */
  lastProductUpdate?: SourcedFact<string>;

  capabilities: CapabilityScore[];
  pricing: PricingInfo;
  reviews: ReviewSignal;
  usageSignals: UsageSignal[];

  /**
   * Real, sourced version/update history, newest first. UI always opens on
   * versionHistory[0] as "the latest version" — keep this array in
   * newest-first order rather than relying on releaseDate sorting at render
   * time. Omitted (or empty) means not yet researched for this tool — never
   * pad it with a guess.
   */
  versionHistory?: VersionUpdate[];

  strengths: string[];
  weaknesses: string[];
  bestFor: string[]; // short phrases: "มือใหม่หัดเขียนโค้ด", "ตัดต่อวิดีโอสั้น"

  /**
   * How this specific AI actually reads and prioritizes a prompt, plus a
   * recommended structure/example — editorial "how to prompt this tool"
   * guidance, not a sourced factual claim, so (like strengths/bestFor) it
   * carries no SourcedFact wrapper.
   */
  promptWorkflow: {
    steps: string[]; // ordered: what it parses first, second, third...
    recommendedStructure: string; // short template description
    example: string; // a concrete prompt following that template
  };

  lastUpdated: string; // ISO date - when this record was last edited

  plansUrl?: PlansLink;
  /** Newest model/version the vendor itself names (shown on the compare page hover card). */
  latestVersion?: LatestVersion;
  /** What the vendor has itself published about the future. Absent = we have not checked yet. */
  roadmap?: Roadmap;
  /** Set when the vendor has shut the product down. Such a tool keeps its page but is never ranked or offered for comparison. */
  discontinued?: DiscontinuedNotice;
  affiliate?: AffiliateLink;
}

export interface AICatalog {
  tools: AITool[];
  generatedAt: string;
}
