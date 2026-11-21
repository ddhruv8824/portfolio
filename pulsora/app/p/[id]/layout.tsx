import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteProjectButton } from "@/components/DeleteProjectButton";
import { Logo } from "@/components/Logo";
import { getProject, listDrafts } from "@/lib/db";
import { isDemoMode } from "@/lib/llm";

export const dynamic = "force-dynamic";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  const pending = (await listDrafts(id)).filter((d) => d.status === "pending").length;

  const nav = [
    { href: `/p/${id}`, label: "Overview" },
    { href: `/p/${id}/agents`, label: "Agents" },
    { href: `/p/${id}/queue`, label: "Approval queue", badge: pending },
    { href: `/p/${id}/audit`, label: "Website audit" },
    { href: `/p/${id}/strategy`, label: "Strategy" },
  ];

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-app border-b p-4 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <Logo />
        <div className="mt-6 hidden md:block">
          <div className="text-xs uppercase tracking-wide muted">Company</div>
          <div className="mt-1 font-semibold">{project.strategy.companyName}</div>
          <a href={project.url} target="_blank" rel="noreferrer" className="block truncate text-xs muted underline">{project.url}</a>
        </div>
        <nav className="mt-4 flex gap-1 overflow-x-auto md:mt-6 md:flex-col">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="flex items-center justify-between whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-50 dark:hover:bg-brand-500/10">
              {n.label}
              {!!n.badge && <span className="ml-2 rounded-full bg-brand-600 px-2 text-xs text-white">{n.badge}</span>}
            </Link>
          ))}
        </nav>
        <div className="mt-6 hidden md:block">
          {isDemoMode() && <p className="mb-3 text-xs muted">Demo mode: set ANTHROPIC_API_KEY for real AI output.</p>}
          <DeleteProjectButton id={id} />
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
