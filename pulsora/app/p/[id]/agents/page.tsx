import { RunAgentButton } from "@/components/RunAgentButton";
import { AGENT_META } from "@/lib/agents";
import { listDrafts, listRuns } from "@/lib/db";

const HOW: Record<string, string> = {
  content: "Picks a high-intent keyword from your strategy and writes a full SEO article with meta description.",
  x: "Writes a batch of posts and a mini-thread in your brand voice.",
  linkedin: "Writes founder-style posts: a story, a how-to and a lesson learned.",
  reddit: "Searches Reddit for recent threads matching your keywords and subreddits, then drafts genuinely helpful replies.",
  hackernews: "Searches recent Hacker News stories and Ask HN posts, drafts replies and Show HN ideas.",
  geo: "Generates the questions buyers ask AI assistants, quotable FAQ answers, and an llms.txt file.",
};

export default async function Agents({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [drafts, runs] = await Promise.all([listDrafts(id), listRuns(id)]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Your marketing team</h1>
        <p className="muted">Each agent drafts work into your approval queue. Nothing is published without you.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {Object.values(AGENT_META).map((a) => {
          const last = runs.find((r) => r.agent === a.id);
          const n = drafts.filter((d) => d.agent === a.id).length;
          return (
            <div key={a.id} className="panel flex flex-col p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-lg font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-100">{a.icon}</span>
                <div>
                  <h2 className="font-semibold">{a.name}</h2>
                  <p className="text-sm muted">{a.tagline}</p>
                </div>
              </div>
              <p className="mt-3 flex-1 text-sm">{HOW[a.id]}</p>
              <div className="mt-3 text-xs muted">
                {n} draft(s) so far{last ? ` · last run ${new Date(last.createdAt).toLocaleString()}` : ""}
              </div>
              <div className="mt-4">
                <RunAgentButton projectId={id} agent={a.id} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
