import { z } from "zod";
import { isVendorUrl } from "./vendorDomains";

/**
 * Strict schema for catalog records — mirrors `src/lib/types/ai-tool.ts`.
 *
 * Used by `scripts/catalog-check.ts` (CI gate). The runtime loader in
 * `loadCatalog.ts` stays permissive on purpose so one bad record never takes
 * the site down; this schema is where data mistakes get caught before merge.
 */

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD")
  .refine((s) => !Number.isNaN(Date.parse(s)), "not a real calendar date");

const httpUrl = z
  .string()
  .url()
  .refine((s) => /^https?:\/\//i.test(s), "must be http(s)");

const httpsUrl = z
  .string()
  .url()
  .refine((s) => /^https:\/\//i.test(s), "must be https");

const confidence = z.enum(["verified", "probable", "inference", "unknown"]);

/**
 * Research-brief contract: a fact with any confidence above "unknown" must
 * carry a real value, the page it came from and the day it was checked. An
 * "unknown" fact is the only kind allowed to have a null value.
 */
function sourcedFact<T extends z.ZodType>(value: T) {
  return z
    .object({
      value: value.nullable(),
      confidence,
      sourceUrl: httpUrl.nullable(),
      lastVerified: isoDate.nullable(),
      note: z.string().optional(),
    })
    .superRefine((parsed, ctx) => {
      // Generic `T` hides `value` from inference; re-add it for the checks.
      const fact = parsed as typeof parsed & { value: unknown };
      if (fact.confidence === "unknown") return;
      if (fact.value === null) {
        ctx.addIssue({
          code: "custom",
          path: ["value"],
          message: `confidence "${fact.confidence}" requires a non-null value (use "unknown" if it is not known)`,
        });
      }
      if (fact.sourceUrl === null) {
        ctx.addIssue({
          code: "custom",
          path: ["sourceUrl"],
          message: `confidence "${fact.confidence}" requires a sourceUrl`,
        });
      }
      if (fact.lastVerified === null) {
        ctx.addIssue({
          code: "custom",
          path: ["lastVerified"],
          message: `confidence "${fact.confidence}" requires lastVerified`,
        });
      }
    });
}

const category = z.enum([
  "chat",
  "image",
  "video",
  "audio",
  "code",
  "agent",
  "multimodal",
  "search",
]);

const capabilityDimension = z.enum([
  "chat",
  "image",
  "video",
  "audio",
  "code",
  "reasoning",
  "longContext",
  "agentTools",
]);

const pricingPlan = z.object({
  name: z.string().min(1),
  priceUsdPerMonth: z.number().nonnegative().nullable(),
  priceLabel: z.string().min(1).optional(),
  quota: z.string(),
  commercialUseAllowed: sourcedFact(z.boolean()),
  notes: z.string().optional(),
});

const pricing = z.object({
  tier: z.enum(["free", "freemium", "paid", "usage-based"]),
  plans: z.array(pricingPlan),
  freeQuota: z.string().nullable(),
  commercialUseSummary: sourcedFact(z.string()),
  sourceUrl: httpUrl,
  lastVerified: isoDate,
});

const reviews = z.object({
  positiveThemes: z.array(z.string()),
  negativeThemes: z.array(z.string()),
  paidVerifiedSummary: z.string().nullable(),
  freeTierSummary: z.string().nullable(),
  sourceUrls: z.array(httpUrl),
  lastVerified: isoDate,
  sampleSizeNote: z.string().optional(),
});

const usageSignal = z.object({
  metric: z.enum([
    "arena-elo",
    "openrouter-share",
    "civitai-downloads",
    "huggingface-downloads",
    "similarweb-rank",
    "github-stars",
  ]),
  value: sourcedFact(z.number()),
  label: z.string(),
});

const versionUpdate = z.object({
  version: z.string().min(1),
  releaseDate: sourcedFact(isoDate),
  summary: z.string(),
  userSentiment: z.object({
    summary: z.string(),
    starRating: z.number().min(0).max(5),
    sourceUrls: z.array(httpUrl),
  }),
});

export const toolSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "id must be a kebab-case slug"),
  name: z.string().min(1),
  vendor: z.string().min(1),
  categories: z.array(category).min(1),
  logoUrl: z.string().nullable(),
  websiteUrl: httpUrl,
  shortDescription: z.string().min(1),
  longDescription: z.string().min(1),
  launchDate: sourcedFact(isoDate).nullable(),
  lastProductUpdate: sourcedFact(isoDate).optional(),
  capabilities: z.array(
    z.object({
      dimension: capabilityDimension,
      score: sourcedFact(z.number().min(0).max(100)),
    }),
  ),
  pricing,
  reviews,
  usageSignals: z.array(usageSignal),
  versionHistory: z.array(versionUpdate).optional(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  bestFor: z.array(z.string()),
  promptWorkflow: z.object({
    steps: z.array(z.string()),
    recommendedStructure: z.string(),
    example: z.string(),
  }),
  lastUpdated: isoDate,
  plansUrl: z.object({ url: httpsUrl, lastVerified: isoDate }).optional(),
  latestVersion: z
    .object({
      name: z.string().min(1),
      releaseDate: isoDate.nullable(),
      sourceUrl: httpsUrl,
      lastVerified: isoDate,
      note: z.string().optional(),
    })
    .optional(),
  roadmap: z
    .object({
      checkedAt: isoDate,
      note: z.string().optional(),
      items: z.array(
        z.object({
          kind: z.enum(["retirement", "announced", "intent"]),
          text: z.string().min(5),
          when: z.string().nullable(),
          sourceUrl: httpsUrl,
          lastVerified: isoDate,
        }),
      ),
    })
    .optional(),
  discontinued: z
    .object({ since: isoDate, note: z.string().min(10), sourceUrl: httpsUrl, lastVerified: isoDate })
    .optional(),
  affiliate: z
    .object({ url: httpsUrl, program: z.string().min(1), disclosedAt: isoDate })
    .optional(),
}).superRefine((tool, ctx) => {
  // The subscribe button must lead to the vendor itself.
  if (tool.plansUrl && !isVendorUrl(tool.id, tool.websiteUrl, tool.plansUrl.url)) {
    ctx.addIssue({
      code: "custom",
      path: ["plansUrl", "url"],
      message: "plansUrl must be on the vendor's own domain (not a third-party page)",
    });
  }
  if (tool.latestVersion && !isVendorUrl(tool.id, tool.websiteUrl, tool.latestVersion.sourceUrl)) {
    ctx.addIssue({
      code: "custom",
      path: ["latestVersion", "sourceUrl"],
      message: "latestVersion must cite the vendor's own page",
    });
  }
  for (const [i, item] of (tool.roadmap?.items ?? []).entries()) {
    if (!isVendorUrl(tool.id, tool.websiteUrl, item.sourceUrl)) {
      ctx.addIssue({
        code: "custom",
        path: ["roadmap", "items", i, "sourceUrl"],
        message: "a roadmap item must cite the vendor's own page",
      });
    }
  }
  if (tool.discontinued) {
    if (!isVendorUrl(tool.id, tool.websiteUrl, tool.discontinued.sourceUrl)) {
      ctx.addIssue({
        code: "custom",
        path: ["discontinued", "sourceUrl"],
        message: "discontinued must cite the vendor's own page",
      });
    }
    if (tool.plansUrl || tool.affiliate) {
      ctx.addIssue({
        code: "custom",
        path: ["discontinued"],
        message: "a discontinued tool cannot have plansUrl or affiliate (nothing to subscribe to)",
      });
    }
  }
  if (tool.affiliate) {
    if (!tool.plansUrl) {
      ctx.addIssue({
        code: "custom",
        path: ["affiliate"],
        message: "affiliate requires plansUrl (the fallback destination when affiliates are switched off)",
      });
    }
    if (Date.parse(tool.affiliate.disclosedAt) > Date.now()) {
      ctx.addIssue({
        code: "custom",
        path: ["affiliate", "disclosedAt"],
        message: "disclosedAt cannot be in the future",
      });
    }
  }
});

export const catalogFileSchema = z.object({
  tools: z.array(toolSchema),
});

export type ParsedTool = z.infer<typeof toolSchema>;
