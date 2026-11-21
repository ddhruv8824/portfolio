import { RunAgentButton } from "@/components/RunAgentButton";
import { getProject } from "@/lib/db";

const ICON = { pass: "✅", warn: "⚠️", fail: "❌" } as const;

export default async function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = (await getProject(id))!;
  const audit = project.audit;
  const color = !audit ? "" : audit.score >= 80 ? "text-emerald-600" : audit.score >= 50 ? "text-amber-600" : "text-red-500";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Website audit</h1>
          <p className="muted">Technical SEO + GEO (AI-search readiness) for {project.url}</p>
        </div>
        <RunAgentButton projectId={id} endpoint={`/api/projects/${id}/audit`} label="Re-run audit" className="btn btn-ghost" />
      </header>

      {!audit ? (
        <div className="panel p-8 muted">No audit yet.</div>
      ) : (
        <>
          <div className="panel flex items-center gap-6 p-6">
            <div className={`text-5xl font-extrabold ${color}`}>{audit.score}</div>
            <div>
              <div className="font-semibold">out of 100</div>
              <div className="text-sm muted">Checked {new Date(audit.checkedAt).toLocaleString()}</div>
            </div>
          </div>

          <section className="panel p-5">
            <h2 className="mb-3 font-semibold">Checks</h2>
            <ul className="divide-y divide-[var(--border)]">
              {audit.checks.map((c) => (
                <li key={c.id} className="flex gap-3 py-2 text-sm">
                  <span>{ICON[c.status]}</span>
                  <span className="w-56 shrink-0 font-medium">{c.label}</span>
                  <span className="min-w-0 break-words muted">{c.detail}</span>
                </li>
              ))}
            </ul>
          </section>

          {audit.fixes.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-semibold">Recommended fixes</h2>
              {audit.fixes.map((f, i) => (
                <div key={i} className="panel p-5">
                  <div className="font-semibold">{f.issue}</div>
                  <p className="mt-1 text-sm">{f.fix}</p>
                  {f.snippet && (
                    <pre className="mt-3 overflow-x-auto rounded-lg bg-black/90 p-3 text-xs text-zinc-100"><code>{f.snippet}</code></pre>
                  )}
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
