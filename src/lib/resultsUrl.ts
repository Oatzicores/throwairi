/**
 * The one place that builds a /results URL, so the search form and the
 * "change type" links on the results page cannot drift apart.
 * Empty values are left out.
 */
export function buildResultsHref(p: {
  q: string;
  budget?: string;
  category?: string;
}): string {
  const params = new URLSearchParams();
  params.set("q", p.q);
  if (p.budget) params.set("budget", p.budget);
  if (p.category) params.set("category", p.category);
  return `/results?${params.toString()}`;
}
