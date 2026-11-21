import Link from "next/link";
import { RunAgentButton } from "@/components/RunAgentButton";
import { AGENT_META } from "@/lib/agents";
import { getProject, listDrafts, listRuns } from "@/lib/db";

const PRIORITY = { high: "text-emerald-600", medium: "text-amber-600", low: "muted" } as const;

export default async function Overview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = (await getProject(id))!;
  const [drafts, runs] = await Promise.all([listDrafts(id), listRuns(id)]);
  const s = project.strategy;
  const count = (st: string) => drafts.filter((d) => d.status === st).length;

  const stats = [
    { label: "Awaiting approval", value: count("pending"), href: `/p/${id}/queue` },
    { label: "Approved", value: count("approved"), href: `/p/${id}/queue?status=approved` },
    { label: "Posted", value: count("posted"), href: `/p/${id}/queue?status=posted` },
    { label: "Website score", value: project.audit ? `${project.audit.score}` : "—", href: `/p/${id}/audit` },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Good to see you 👋</h1>
        <p className="muted">{s.oneLiner}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((st) => (
          <Link key={st.label} href={st.href} className="panel p-4 hover:border-brand-500">
            <div className="text-3xl font-bold">{st.value}</div>
            <div className="text-sm muted">{st.label}</div>
          </Link>
        ))}
      </div>

      <section className="panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Quick actions</h2>
          <Link href={`/p/${id}/agents`} className="text-sm text-brand-600">All agents →</Link>
        </div>
        <div className="flex flex-wrap gap-3">
          {(["content", "linkedin", "reddit", "geo"] as const).map((a) => (
            <RunAgentButton key={a} projectId={id} agent={a} label={`${AGENT_META[a].icon}  ${AGENT_META[a].name}`} className="btn btn-ghost" />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-3 font-semibold">Channel plan</h2>
          <ul className="space-y-3">
            {s.channelPlan.map((c) => (
              <li key={c.channel} className="text-sm">
                <span className="font-semibold">{c.channel}</span>{" "}
                <span className={`text-xs font-semibold uppercase ${PRIORITY[c.priority]}`}>{c.priority}</span>
                <div className="muted">{c.why}</div>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel p-5">
          <h2 className="mb-3 font-semibold">Your first week</h2>
          <ol className="space-y-2">
            {s.firstWeekPlan.map((d) => (
              <li key={d.day} className="flex gap-3 text-sm">
                <span className="w-14 shrink-0 font-semibold text-brand-600">{d.day}</span>
                <span>{d.task}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="panel p-5">
        <h2 className="mb-3 font-semibold">Activity</h2>
        {runs.length === 0 ? (
          <p className="text-sm muted">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {runs.slice(0, 12).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                <span className={r.status === "success" ? "text-emerald-600" : "text-red-500"}>{r.status === "success" ? "●" : "✕"}</span>
                <span className="font-medium capitalize">{r.agent in AGENT_META ? AGENT_META[r.agent as keyof typeof AGENT_META].name : r.agent}</span>
                <span className="muted">{r.message}</span>
                {r.demo && <span className="chip">demo</span>}
                <span className="ml-auto text-xs muted">{new Date(r.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
