# 0001 — Ranking is not for sale

Status: accepted (2026-09-19)

## Context

The site earns money from Affiliate links to AI tools (later possibly ads). Its only real advantage over larger directories is that a visitor can trust what it says: every fact carries a source, and the order of results reflects fit for the visitor's request. Tool vendors, and affiliate programs with different commission rates, create a standing temptation to let money influence which Tool appears first.

## Decision

- **Ranking** is computed only from the Tool's own data and the visitor's request. Commission rate, the existence of an affiliate programme, sponsorship, or any payment must never be an input to it.
- **Affiliate links** are allowed, but always disclosed to the visitor.
- Paid placement of any kind, including a separate labelled "sponsored" slot, is **not adopted now**. Introducing one requires a new ADR that supersedes this one.
- Which Tools enter the Catalog is decided by relevance to Creators, not by whether an affiliate programme exists.

## Alternatives considered

- **Sell rank positions.** Highest short-term revenue; destroys the reason to use the site once noticed.
- **Separate labelled sponsored slot next to the real ranking.** Common and defensible; deferred because the site has no audience yet to sell, and it can be added later without undoing this decision.

## Consequences

- Lower and slower revenue: only visitors who click a disclosed link and buy a paid plan earn anything.
- Vendors cannot buy visibility, so some partnership offers will be declined.
- The ranking code must stay free of any commercial field. Reviewers should reject any change that reads affiliate or sponsorship data inside the scoring path.
- Affiliate disclosure must be visible wherever an affiliate link appears.
