import { NextResponse } from "next/server";
import { crawlSite } from "@/lib/crawl";
import { addRun, createProject, listProjects } from "@/lib/db";
import { describeError, isDemoMode } from "@/lib/llm";
import { buildAudit } from "@/lib/seo";
import { buildStrategy } from "@/lib/strategy";

export const maxDuration = 300;

export async function GET() {
  return NextResponse.json(await listProjects());
}

/** Onboarding: crawl the website → build the strategy → run the SEO/GEO audit. */
export async function POST(req: Request) {
  const { url, notes } = (await req.json().catch(() => ({}))) as { url?: string; notes?: string };
  if (!url?.trim()) return NextResponse.json({ error: "Please enter your website URL." }, { status: 400 });

  try {
    const { site, homepageHtml } = await crawlSite(url);
    const strategy = await buildStrategy(site, notes);
    const audit = await buildAudit(site.url, homepageHtml, strategy);
    const demo = isDemoMode();
    const project = await createProject({ url: site.url, site, strategy, audit, demo });
    await addRun({ projectId: project.id, agent: "strategy", status: "success", message: `Analysed ${site.pages.length} pages and built the strategy.`, draftCount: 0, demo });
    await addRun({ projectId: project.id, agent: "seo", status: "success", message: `Website audit score ${audit.score}/100.`, draftCount: 0, demo });
    return NextResponse.json({ id: project.id });
  } catch (err) {
    return NextResponse.json({ error: describeError(err) }, { status: 500 });
  }
}
