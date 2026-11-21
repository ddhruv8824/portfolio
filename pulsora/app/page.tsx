import Link from "next/link";
import { Logo } from "@/components/Logo";
import { OnboardForm } from "@/components/OnboardForm";
import { AGENT_META } from "@/lib/agents";
import { listProjects } from "@/lib/db";
import { isDemoMode } from "@/lib/llm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const projects = await listProjects();
  const demo = isDemoMode();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <nav className="flex items-center justify-between">
        <Logo />
        {demo && <span className="chip">Demo mode — no API key set</span>}
      </nav>

      <section className="mx-auto mt-16 max-w-2xl text-center">
        <span className="chip">Your AI Chief Marketing Officer</span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Put your marketing on <span className="text-brand-600">autopilot</span>.
        </h1>
        <p className="mt-4 text-lg muted">
          Enter your website. Pulsora learns your business, builds a strategy, and runs a team of AI agents —
          SEO, AI search, content, X, LinkedIn, Reddit and Hacker News. You just approve.
        </p>
        <div className="mt-8 text-left">
          <OnboardForm />
        </div>
      </section>

      <section className="mt-14 grid gap-3 sm:grid-cols-3">
        {Object.values(AGENT_META).map((a) => (
          <div key={a.id} className="panel flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-100">{a.icon}</span>
            <div>
              <div className="font-semibold">{a.name}</div>
              <div className="text-sm muted">{a.tagline}</div>
            </div>
          </div>
        ))}
      </section>

      {projects.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide muted">Your companies</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.map((p) => (
              <Link key={p.id} href={`/p/${p.id}`} className="panel block p-4 hover:border-brand-500">
                <div className="font-semibold">{p.strategy.companyName}</div>
                <div className="truncate text-sm muted">{p.url}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
