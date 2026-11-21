// Sample outputs used when no ANTHROPIC_API_KEY is set, so the whole product can be
// clicked through without spending tokens. Built from the real crawl where possible.
import type { DraftInput } from "./agents";
import type { AgentId, Project, SiteSnapshot, Strategy } from "./types";

function brandFrom(site: SiteSnapshot): string {
  const parts = site.title.split(/[|\\\-–—:·]/).map((x) => x.trim()).filter((x) => x && !/^home$/i.test(x));
  const fromTitle = parts.sort((a, b) => a.length - b.length)[0];
  if (fromTitle && fromTitle.length <= 30) return fromTitle;
  return new URL(site.url).hostname.replace(/^www\./, "").split(".")[0].replace(/^\w/, (c) => c.toUpperCase());
}

export function demoStrategy(site: SiteSnapshot): Strategy {
  const name = brandFrom(site);
  const what = site.description || `${name} helps teams work faster.`;
  return {
    companyName: name,
    oneLiner: what,
    category: "B2B Software (demo guess)",
    targetAudience: "Founders and small teams at early-stage companies",
    personas: [
      { name: "Busy founder", role: "CEO / Co-founder", painPoints: ["No time for marketing", "Unsure which channel works"], whereTheyHangOut: ["X", "r/startups", "Hacker News"] },
      { name: "First marketing hire", role: "Growth Marketer", painPoints: ["Too many channels, one person", "Needs to show results fast"], whereTheyHangOut: ["LinkedIn", "r/marketing"] },
      { name: "Agency owner", role: "Founder, marketing agency", painPoints: ["Scaling content across clients"], whereTheyHangOut: ["LinkedIn", "r/agency"] },
    ],
    valueProps: [what, "Saves hours every week", "Works out of the box"],
    competitors: ["Competitor A", "Competitor B"],
    brandVoice: "Friendly, direct, practical",
    keywords: [`${name.toLowerCase()} alternative`, "ai marketing tool", "marketing automation for startups", "how to get first customers"],
    subreddits: ["startups", "SaaS", "marketing", "Entrepreneur"],
    channelPlan: [
      { channel: "SEO / Blog", priority: "high", why: "Compounding inbound traffic." },
      { channel: "GEO (AI search)", priority: "high", why: "Buyers increasingly ask AI assistants for tool recommendations." },
      { channel: "Reddit", priority: "medium", why: "Your audience asks for advice there daily." },
      { channel: "LinkedIn", priority: "medium", why: "Founder-led content builds trust." },
      { channel: "X", priority: "low", why: "Good for building in public." },
    ],
    contentPillars: ["How-to guides", "Founder lessons", "Industry trends", "Product use cases"],
    firstWeekPlan: [
      { day: "Day 1", task: "Fix the top 3 SEO issues from the audit" },
      { day: "Day 2", task: "Publish llms.txt and an FAQ section" },
      { day: "Day 3", task: "Publish first blog article" },
      { day: "Day 4", task: "Reply to 3 relevant Reddit threads" },
      { day: "Day 5", task: "Post 2 LinkedIn posts" },
      { day: "Day 6", task: "Post an X thread" },
      { day: "Day 7", task: "Review results and adjust" },
    ],
  };
}

const NOTE = "\n\n_(Demo output — add ANTHROPIC_API_KEY for real, tailored drafts.)_";

export function demoDrafts(agent: AgentId, p: Project): DraftInput[] {
  const n = p.strategy.companyName;
  const kw = p.strategy.keywords[0] ?? "your category";
  switch (agent) {
    case "content":
      return [{ channel: "Blog", title: `The complete guide to ${kw}`, reason: `Targets “${kw}”.`,
        body: `**Meta description:** Everything you need to know about ${kw} in 2026.\n\n## Why ${kw} matters\nLorem ipsum…\n\n## How ${n} helps\n…${NOTE}` }];
    case "x":
      return [1, 2, 3].map((i) => ({ channel: "X", title: `Post ${i}`, body: `Most teams overthink ${kw}. Here's what actually works (#${i})…${NOTE}` }));
    case "linkedin":
      return [{ channel: "LinkedIn", title: "Story post", body: `A year ago we almost gave up on ${n}.\n\nHere's what changed…${NOTE}` }];
    case "reddit":
      return [{ channel: "Reddit", title: "Reply: What tools do you use for marketing as a solo founder?", targetUrl: "https://www.reddit.com/r/startups/",
        reason: "Founder asking for exactly what you solve.", body: `Honestly the biggest unlock for me was picking ONE channel… (I work on ${n}.)${NOTE}` }];
    case "hackernews":
      return [{ channel: "Hacker News", title: `New post (Show HN): Show HN: ${n}`, reason: "Original post idea", body: `Hi HN, we built ${n} because…${NOTE}` }];
    case "geo":
      return [{ channel: "Website (llms.txt)", title: "llms.txt file", reason: "Upload to your site root",
        body: `# ${n}\n\n> ${p.strategy.oneLiner}\n\n## Key pages\n- [Home](${p.url})${NOTE}` }];
  }
}
