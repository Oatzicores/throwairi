import { NextResponse } from "next/server";
import { loadCatalog } from "@/lib/data/loadCatalog";

// Serves the full catalog as JSON for client components that can't call
// the filesystem-backed loadCatalog() directly (e.g. the favorites page,
// which resolves bookmarked ids from localStorage after mount).
//
// Built once at deploy time and served from the CDN: the catalog only changes
// with a deploy, and a static file costs nothing when someone hammers it.
export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ tools: loadCatalog() });
}
