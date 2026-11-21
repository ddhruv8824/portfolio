import { siteToPrompt } from "./crawl";
import { demoStrategy } from "./demo";
import { generateObject, isDemoMode } from "./llm";
import { StrategySchema, type SiteSnapshot, type Strategy } from "./types";

/** The "CMO brain": read the website and produce a full go-to-market strategy. */
export async function buildStrategy(site: SiteSnapshot, notes?: string): Promise<Strategy> {
  if (isDemoMode()) return demoStrategy(site);

  return generateObject({
    schema: StrategySchema,
    effort: "high",
    system: `Task: build the company's marketing strategy from its website.
- personas: 3 distinct, specific buyer personas.
- keywords: 10–15 search phrases real buyers type (mix of problem- and solution-aware).
- subreddits: 5–8 real, active subreddits where these personas discuss their problems.
- channelPlan: rank SEO, GEO (AI search), Blog content, X, LinkedIn, Reddit, Hacker News, Email by fit for THIS company.
- contentPillars: 4–6 themes.
- firstWeekPlan: 7 entries, Day 1..Day 7, each a concrete task.`,
    prompt: `Website crawl of ${site.url}:\n\n${siteToPrompt(site)}${
      notes ? `\n\nExtra notes from the founder:\n${notes}` : ""
    }`,
  });
}
