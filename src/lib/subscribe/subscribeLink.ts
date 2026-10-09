import type { AITool } from "../types/ai-tool";
import { isAffiliateEnabled } from "../data/affiliateGate";
import { isVendorUrl } from "../data/vendorDomains";

export interface SubscribeLink {
  href: string;
  isAffiliate: boolean;
  rel: string;
  label: string;
}

export type LinkableTool = Pick<AITool, "id" | "websiteUrl" | "plansUrl" | "affiliate"> & {
  discontinued?: AITool["discontinued"];
  pricing: Pick<AITool["pricing"], "tier">;
};

const isHttps = (u: string): boolean => {
  try {
    return new URL(u).protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Where the "subscribe" button sends a visitor, or null when there is nothing
 * to subscribe to. The visitor pays the vendor directly; ThrowAirI only earns
 * a commission when an affiliate link is used, and never lets that influence
 * ranking (docs/adr/0001).
 *
 * Deliberately no fallback to websiteUrl or to pricing.sourceUrl: the first is
 * a home page, the second is often a third-party blog.
 */
export function getSubscribeLink(
  tool: LinkableTool,
  opts: { affiliateEnabled?: boolean } = {},
): SubscribeLink | null {
  if (tool.discontinued) return null; // the vendor has shut it down
  if (tool.pricing.tier === "free") return null; // nothing to subscribe to
  const plans = tool.plansUrl?.url;
  if (!plans) return null;
  // Defence in depth: the schema enforces these, the runtime loader does not.
  if (!isHttps(plans) || !isVendorUrl(tool.id, tool.websiteUrl, plans)) return null;

  const label = tool.pricing.tier === "usage-based" ? "ดูราคาและเริ่มใช้งาน" : "ดูแผนและสมัคร";
  const enabled = opts.affiliateEnabled ?? isAffiliateEnabled();

  if (enabled && tool.affiliate && isHttps(tool.affiliate.url)) {
    return { href: tool.affiliate.url, isAffiliate: true, rel: "sponsored nofollow noopener", label };
  }
  return { href: plans, isAffiliate: false, rel: "noopener noreferrer", label };
}
