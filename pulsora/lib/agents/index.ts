import { z } from "zod";
import { generateObject, isDemoMode } from "../llm";
import { demoDrafts } from "../demo";
import { findThreads, type Thread } from "../sources";
import type { AgentId, Draft, Project } from "../types";

export type DraftInput = Pick<Draft, "channel" | "title" | "body" | "targetUrl" | "reason">;

export type AgentMeta = {
  id: AgentId;
  name: string;
  tagline: string;
  icon: string;
};

export const AGENT_META: Record<AgentId, AgentMeta> = {
  content: { id: "content", name: "Content Writer", tagline: "SEO blog articles that rank", icon: "✍️" },
  x: { id: "x", name: "X / Twitter", tagline: "Posts & threads in your voice", icon: "𝕏" },
  linkedin: { id: "linkedin", name: "LinkedIn", tagline: "Founder-led thought leadership", icon: "in" },
  reddit: { id: "reddit", name: "Reddit Scout", tagline: "Finds threads, drafts helpful replies", icon: "👽" },
  hackernews: { id: "hackernews", name: "Hacker News", tagline: "Joins relevant HN discussions", icon: "Y" },
  geo: { id: "geo", name: "GEO (AI Search)", tagline: "Get cited by ChatGPT, Claude & Gemini", icon: "✦" },
};

function context(p: Project): string {
  const s = p.strategy;
  return `<company>
Name: ${s.companyName}
Website: ${p.url}
What it does: ${s.oneLiner}
Category: ${s.category}
Target audience: ${s.targetAudience}
Personas: ${s.personas.map((x) => `${x.name} (${x.role}) — pains: ${x.painPoints.join("; ")}`).join(" | ")}
Value props: ${s.valueProps.join("; ")}
Competitors: ${s.competitors.join(", ")}
Brand voice: ${s.brandVoice}
Keywords: ${s.keywords.join(", ")}
Content pillars: ${s.contentPillars.join(", ")}
</company>`;
}

const PostsSchema = z.object({
  posts: z.array(z.object({ title: z.string().describe("Internal label for the draft"), body: z.string() })),
});

const ArticleSchema = z.object({
  title: z.string(),
  metaDescription: z.string(),
  targetKeyword: z.string(),
  markdown: z.string().describe("Full article in Markdown, 1000-1500 words, with H2/H3 headings and a CTA"),
});

const RepliesSchema = z.object({
  replies: z.array(
    z.object({
      threadIndex: z.number().describe("Index of the thread from the list"),
      reason: z.string().describe("Why this thread is a good fit"),
      reply: z.string(),
    }),
  ),
  newPostIdeas: z.array(z.object({ community: z.string(), title: z.string(), body: z.string() })),
});

const GeoSchema = z.object({
  questions: z.array(z.object({ question: z.string(), answer: z.string() })),
  llmsTxt: z.string().describe("A complete llms.txt file for the site"),
});

async function runContent(p: Project): Promise<DraftInput[]> {
  const a = await generateObject({
    schema: ArticleSchema,
    effort: "medium",
    system: "You are Pulsora's Content Writer agent. Write one SEO article targeting a keyword with real buying intent.",
    prompt: `${context(p)}\n\nPick the best keyword we have NOT obviously covered yet and write the article.`,
  });
  return [
    {
      channel: "Blog",
      title: a.title,
      body: `**Meta description:** ${a.metaDescription}\n\n${a.markdown}`,
      reason: `Targets keyword “${a.targetKeyword}”.`,
    },
  ];
}

async function runSocial(p: Project, channel: "X" | "LinkedIn"): Promise<DraftInput[]> {
  const rules =
    channel === "X"
      ? "Write 5 X posts: mix of insight posts, a contrarian take, a mini-thread (separate tweets with blank lines and 1/, 2/...), and a soft product mention. Under 280 chars per tweet. No hashtag spam."
      : "Write 3 LinkedIn posts from the founder's perspective: a story post, a practical how-to list, and a lesson learned. Strong first line hook, short paragraphs, 120-250 words each, one subtle CTA.";
  const out = await generateObject({
    schema: PostsSchema,
    effort: "low",
    system: `You are Pulsora's ${channel} agent. ${rules}`,
    prompt: context(p),
  });
  return out.posts.map((x) => ({ channel, title: x.title, body: x.body }));
}

async function runCommunity(p: Project, source: "reddit" | "hackernews"): Promise<DraftInput[]> {
  const threads: Thread[] = await findThreads(source, p.strategy.keywords, p.strategy.subreddits);
  const label = source === "reddit" ? "Reddit" : "Hacker News";
  const list = threads.length
    ? threads
        .map((t, i) => `[${i}] ${t.community} — "${t.title}" (${t.score} pts, ${t.comments} comments)\n${t.snippet}`)
        .join("\n\n")
    : "(No live threads could be fetched right now.)";

  const out = await generateObject({
    schema: RepliesSchema,
    effort: "medium",
    system: `You are Pulsora's ${label} agent. From the threads below, pick ONLY the ones where ${p.strategy.companyName} can genuinely help (max 5).
Write replies that answer the question first. Mention the product only if truly relevant, and then disclose "(I work on ${p.strategy.companyName})".
Match the community's tone: no marketing speak, no emojis, no links unless asked.
Also suggest 2 original posts the company could make in relevant ${label === "Reddit" ? "subreddits" : "HN formats (Show HN / Ask HN)"}.`,
    prompt: `${context(p)}\n\n<threads>\n${list}\n</threads>`,
  });

  const replies = out.replies
    .filter((r) => threads[r.threadIndex])
    .map((r) => {
      const t = threads[r.threadIndex];
      return { channel: label, title: `Reply: ${t.title}`, body: r.reply, targetUrl: t.url, reason: r.reason };
    });
  const ideas = out.newPostIdeas.map((x) => ({
    channel: label,
    title: `New post (${x.community}): ${x.title}`,
    body: x.body,
    reason: "Original post idea",
  }));
  return [...replies, ...ideas];
}

async function runGeo(p: Project): Promise<DraftInput[]> {
  const out = await generateObject({
    schema: GeoSchema,
    effort: "medium",
    system: `You are Pulsora's GEO (Generative Engine Optimization) agent. Your goal: make AI assistants (ChatGPT, Claude, Gemini, Perplexity)
understand and recommend this company. Produce 8 questions buyers ask AI assistants in this category, each with a concise, factual,
quotable answer for an FAQ page, plus a complete llms.txt file.`,
    prompt: context(p),
  });
  return [
    {
      channel: "Website (FAQ)",
      title: "FAQ section for AI search",
      body: out.questions.map((q) => `### ${q.question}\n${q.answer}`).join("\n\n"),
      reason: "Publish on your site so AI engines can quote you.",
    },
    { channel: "Website (llms.txt)", title: "llms.txt file", body: out.llmsTxt, reason: `Upload to ${new URL(p.url).origin}/llms.txt` },
  ];
}

export async function runAgent(agent: AgentId, project: Project): Promise<{ drafts: DraftInput[]; demo: boolean }> {
  if (isDemoMode()) return { drafts: demoDrafts(agent, project), demo: true };
  switch (agent) {
    case "content":
      return { drafts: await runContent(project), demo: false };
    case "x":
      return { drafts: await runSocial(project, "X"), demo: false };
    case "linkedin":
      return { drafts: await runSocial(project, "LinkedIn"), demo: false };
    case "reddit":
      return { drafts: await runCommunity(project, "reddit"), demo: false };
    case "hackernews":
      return { drafts: await runCommunity(project, "hackernews"), demo: false };
    case "geo":
      return { drafts: await runGeo(project), demo: false };
  }
}
