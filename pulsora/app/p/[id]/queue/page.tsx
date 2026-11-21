import Link from "next/link";
import { DraftCard } from "@/components/DraftCard";
import { AGENT_META } from "@/lib/agents";
import { listDrafts } from "@/lib/db";
import type { DraftStatus } from "@/lib/types";

const TABS: DraftStatus[] = ["pending", "approved", "posted", "rejected"];

export default async function Queue({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; agent?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const status = (TABS.includes(sp.status as DraftStatus) ? sp.status : "pending") as DraftStatus;
  const all = await listDrafts(id);
  const drafts = all.filter((d) => d.status === status && (!sp.agent || d.agent === sp.agent));

  const href = (s: string, a?: string) => `/p/${id}/queue?status=${s}${a ? `&agent=${a}` : ""}`;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Approval queue</h1>
        <p className="muted">Review, edit and approve what your agents drafted. Copy approved items to post them.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link key={t} href={href(t, sp.agent)} className={`btn ${t === status ? "btn-primary" : "btn-ghost"} capitalize`}>
            {t} <span className="opacity-70">{all.filter((d) => d.status === t).length}</span>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href={href(status)} className={`chip ${!sp.agent ? "border-brand-500 text-brand-600" : ""}`}>All agents</Link>
        {Object.values(AGENT_META).map((a) => (
          <Link key={a.id} href={href(status, a.id)} className={`chip ${sp.agent === a.id ? "border-brand-500 text-brand-600" : ""}`}>{a.name}</Link>
        ))}
      </div>

      {drafts.length === 0 ? (
        <div className="panel p-10 text-center muted">
          Nothing here yet. <Link href={`/p/${id}/agents`} className="text-brand-600 underline">Run an agent</Link> to get drafts.
        </div>
      ) : (
        <div className="grid gap-4">{drafts.map((d) => <DraftCard key={d.id} draft={d} />)}</div>
      )}
    </div>
  );
}
