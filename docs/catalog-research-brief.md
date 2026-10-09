# Catalog Research Brief

Shared contract for every research pass that populates `data/catalog/*.json`.
Read `src/lib/types/ai-tool.ts` first — this file is the human-readable version
of that schema plus the rules for filling it in.

## Hard rules (do not violate)

1. **Never invent a number.** If you cannot find a real, citable value for a
   `SourcedFact<T>`, set `value: null`-equivalent for that field (or omit the
   optional field) and `confidence: "unknown"`, `sourceUrl: null`,
   `lastVerified: null`. A wrong-but-plausible number is worse than a missing
   one — it fails QA and gets deleted.
2. **Every `SourcedFact` needs a real `sourceUrl`** you actually opened via
   WebSearch/WebFetch — the tool's own pricing page, an official blog post, a
   leaderboard (LMArena, Artificial Analysis), OpenRouter rankings, Civitai/
   HuggingFace model pages, or a reputable review aggregator (G2, Capterra).
   No sourceUrl → confidence must be `"unknown"`.
3. **Confidence levels:**
   - `verified` — read directly off the vendor's own pricing/docs page today.
   - `probable` — from a reputable third party (G2, a tech outlet) not the
     vendor itself, or a vendor page that's ambiguous/US-only/etc.
   - `inference` — you reasoned it from adjacent facts (e.g. "likely still
     free tier because no deprecation notice found").
   - `unknown` — could not find it. This is a valid, expected outcome.
4. **No download-count fabrication.** "จำนวน Download" was explicitly ruled
   out as unavailable — use `usageSignals` instead: LMArena ELO, OpenRouter
   usage share, Civitai/HuggingFace download counts (these ARE real public
   API numbers for *models*, not proprietary apps), GitHub stars, or
   SimilarWeb rank. Only include a usage signal if you have a real source.
5. **Reviews are syntheses, not fabricated quotes.** Read several real
   reviews (G2/Capterra/TrustRadius/Reddit threads), then write a short
   synthesis of recurring themes. Never invent a quote attributed to "a
   user". List `sourceUrls` for where you actually read reviews.
6. **`lastVerified` = the date you (the agent) actually checked the source**,
   in `YYYY-MM-DD`, using today's real date.

## Output format

One JSON file per category in `data/catalog/`, named `<category>.json`,
containing `{ "tools": AITool[] }`. Use kebab-case `id`s (e.g. `"chatgpt"`,
`"claude"`, `"midjourney-v7"`). Keep descriptions in Thai for
`shortDescription`/`longDescription`/`strengths`/`weaknesses`/`bestFor` (this
app's UI is Thai-first) but keep `name`, `vendor`, URLs in their original
form.

Aim for **quality over quota** — a smaller set of fully-sourced, honest
entries beats a padded list with guessed numbers. Target 10-15 solid entries
per category, real and currently operating products only.

## Categories in scope

- `chat` — general LLM chat assistants (ChatGPT, Claude, Gemini, Copilot
  Chat, Grok, DeepSeek, Perplexity, Mistral Le Chat, etc.)
- `code` — coding assistants/IDEs (GitHub Copilot, Cursor, Windsurf,
  Claude Code, Codeium/Windsurf, Amazon Q Developer, Tabnine, etc.)
- `image` — image generation (Midjourney, DALL-E 3, Stable Diffusion /
  SD3/Flux via services, Adobe Firefly, Ideogram, Leonardo.Ai, Recraft, etc.)
- `video` — video generation (Runway Gen, Kling, Pika, Luma Dream
  Machine, Google Veo, etc.)
- `audio` — voice/music generation (ElevenLabs, Suno, Udio, Adobe Podcast,
  Murf, etc.)
- `agent` — agentic/automation tools (Manus, AutoGPT-style products, n8n AI
  nodes, Zapier AI, browser-use agents, etc.) — include only if genuinely
  real and operating.

Every entry must set `capabilities[]` covering at least the dimensions that
apply to its category, and must fill `pricing` with a real, sourced tier
breakdown.
