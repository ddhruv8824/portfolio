import { z } from "zod";

// ---------- Marketing strategy (produced by the "CMO brain") ----------

export const StrategySchema = z.object({
  companyName: z.string(),
  oneLiner: z.string().describe("One sentence: what the company does and for whom"),
  category: z.string(),
  targetAudience: z.string(),
  personas: z.array(
    z.object({
      name: z.string().describe("Short persona label, e.g. 'Bootstrapped SaaS founder'"),
      role: z.string(),
      painPoints: z.array(z.string()),
      whereTheyHangOut: z.array(z.string()),
    }),
  ),
  valueProps: z.array(z.string()),
  competitors: z.array(z.string()),
  brandVoice: z.string(),
  keywords: z.array(z.string()).describe("SEO / search keywords buyers would use"),
  subreddits: z.array(z.string()).describe("Subreddit names without the r/ prefix"),
  channelPlan: z.array(
    z.object({
      channel: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      why: z.string(),
    }),
  ),
  contentPillars: z.array(z.string()),
  firstWeekPlan: z.array(z.object({ day: z.string(), task: z.string() })),
});
export type Strategy = z.infer<typeof StrategySchema>;

// ---------- Website snapshot + SEO audit ----------

export type PageSnapshot = {
  url: string;
  title: string;
  description: string;
  headings: string[];
  text: string;
};

export type SiteSnapshot = {
  url: string;
  title: string;
  description: string;
  pages: PageSnapshot[];
};

export type AuditCheck = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

export type AuditFix = { issue: string; fix: string; snippet?: string };

export type Audit = {
  score: number;
  checkedAt: string;
  checks: AuditCheck[];
  fixes: AuditFix[];
};

// ---------- Agents, drafts and runs ----------

export const AGENTS = ["content", "x", "linkedin", "reddit", "hackernews", "geo"] as const;
export type AgentId = (typeof AGENTS)[number];

export type DraftStatus = "pending" | "approved" | "rejected" | "posted";

export type Draft = {
  id: string;
  projectId: string;
  agent: AgentId;
  channel: string;
  title: string;
  body: string;
  targetUrl?: string;
  reason?: string;
  status: DraftStatus;
  createdAt: string;
  updatedAt: string;
};

export type AgentRun = {
  id: string;
  projectId: string;
  agent: AgentId | "strategy" | "seo";
  status: "success" | "error";
  message: string;
  draftCount: number;
  demo: boolean;
  createdAt: string;
};

export type Project = {
  id: string;
  url: string;
  createdAt: string;
  site: SiteSnapshot;
  strategy: Strategy;
  audit?: Audit;
  demo: boolean;
};

export type DB = {
  projects: Project[];
  drafts: Draft[];
  runs: AgentRun[];
};
