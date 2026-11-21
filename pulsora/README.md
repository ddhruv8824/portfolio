# Pulsora — your AI CMO (MVP)

Enter a website. Pulsora learns the business, builds a marketing strategy, audits the
site for SEO and AI-search (GEO) readiness, and runs a team of AI agents that draft
marketing work into an approval queue. Nothing is published without a human.

## What the MVP does

| Area | What happens |
|---|---|
| **Onboarding** | Crawls the homepage + key pages (about, pricing, features…) |
| **Strategy (CMO brain)** | ICP, 3 personas, value props, competitors, keywords, subreddits, channel plan, content pillars, a 7-day plan |
| **Website audit** | 14 technical SEO + GEO checks (title, meta, H1, alt text, OG, JSON-LD, robots, sitemap, llms.txt…) with a score and AI-written fixes + ready-to-paste snippets |
| **Content Writer** | Full SEO blog article for a high-intent keyword |
| **X / LinkedIn** | Batches of posts in the brand voice |
| **Reddit Scout** | Searches recent Reddit threads for your keywords/subreddits, drafts helpful replies (with affiliation disclosure) + post ideas |
| **Hacker News** | Same, using the HN Algolia API, + Show HN ideas |
| **GEO agent** | Questions buyers ask AI assistants, quotable FAQ answers, and an `llms.txt` file |
| **Approval queue** | Approve / edit / reject / copy / mark as posted |

## Run it

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Without an API key the app runs in **demo mode**: the crawl and audit checks are real,
while the strategy and drafts are sample output, so you can click through everything for free.

## Tech

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4
- Claude via `@anthropic-ai/sdk` with structured outputs (Zod schemas) — `lib/llm.ts`
- Storage: one JSON file (`data/pulsora.json`) behind `lib/db.ts` — swap for Postgres later
- Cheerio for crawling/auditing; Reddit public search + HN Algolia API for community listening

## Layout

```
app/                 pages (landing, /p/[id] dashboard, agents, queue, audit, strategy) + API routes
lib/llm.ts           Claude client, structured output helper, demo-mode switch
lib/strategy.ts      website → marketing strategy
lib/seo.ts           SEO/GEO checks + AI fixes
lib/agents/          the marketing agents
lib/sources.ts       Reddit + Hacker News search
lib/demo.ts          sample outputs for demo mode
lib/db.ts            JSON-file storage
```

## Next steps (roadmap)

1. Auth + multi-user (Supabase), Postgres storage
2. Scheduled agent runs (daily) + email digest
3. One-click publishing (X API, LinkedIn API, WordPress/Webflow)
4. Our differentiators: lead discovery + enrichment, email outreach, AI voice calling, CRM & revenue tracking
