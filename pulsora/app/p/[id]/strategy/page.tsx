import { getProject } from "@/lib/db";

function Chips({ items, prefix = "" }: { items: string[]; prefix?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => <span key={i} className="chip">{prefix}{i}</span>)}
    </div>
  );
}

export default async function StrategyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = (await getProject(id))!.strategy;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Marketing strategy</h1>
        <p className="muted">What your AI CMO learned about {s.companyName}.</p>
      </header>

      <section className="panel grid gap-4 p-5 sm:grid-cols-2">
        <div><div className="text-xs uppercase muted">Category</div><div className="font-medium">{s.category}</div></div>
        <div><div className="text-xs uppercase muted">Brand voice</div><div className="font-medium">{s.brandVoice}</div></div>
        <div className="sm:col-span-2"><div className="text-xs uppercase muted">Target audience</div><div className="font-medium">{s.targetAudience}</div></div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Buyer personas</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {s.personas.map((p) => (
            <div key={p.name} className="panel p-5">
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm muted">{p.role}</div>
              <div className="mt-3 text-xs uppercase muted">Pain points</div>
              <ul className="list-disc pl-5 text-sm">{p.painPoints.map((x) => <li key={x}>{x}</li>)}</ul>
              <div className="mt-3 text-xs uppercase muted">Where they hang out</div>
              <Chips items={p.whereTheyHangOut} />
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-3 font-semibold">Value propositions</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">{s.valueProps.map((v) => <li key={v}>{v}</li>)}</ul>
        </section>
        <section className="panel p-5">
          <h2 className="mb-3 font-semibold">Content pillars</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">{s.contentPillars.map((v) => <li key={v}>{v}</li>)}</ul>
        </section>
        <section className="panel p-5">
          <h2 className="mb-3 font-semibold">Target keywords</h2>
          <Chips items={s.keywords} />
        </section>
        <section className="panel p-5">
          <h2 className="mb-3 font-semibold">Communities</h2>
          <Chips items={s.subreddits} prefix="r/" />
        </section>
        <section className="panel p-5 md:col-span-2">
          <h2 className="mb-3 font-semibold">Competitors</h2>
          <Chips items={s.competitors} />
        </section>
      </div>
    </div>
  );
}
