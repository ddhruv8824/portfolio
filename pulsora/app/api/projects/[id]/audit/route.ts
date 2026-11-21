import { NextResponse } from "next/server";
import { fetchText } from "@/lib/crawl";
import { addRun, getProject, updateProject } from "@/lib/db";
import { describeError, isDemoMode } from "@/lib/llm";
import { buildAudit } from "@/lib/seo";

export const maxDuration = 300;

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  try {
    const page = await fetchText(project.url);
    if (!page.ok) throw new Error(`Could not load ${project.url}`);
    const audit = await buildAudit(project.url, page.body, project.strategy);
    await updateProject(id, { audit });
    await addRun({ projectId: id, agent: "seo", status: "success", message: `Website audit score ${audit.score}/100.`, draftCount: 0, demo: isDemoMode() });
    return NextResponse.json({ score: audit.score });
  } catch (err) {
    return NextResponse.json({ error: describeError(err) }, { status: 500 });
  }
}
