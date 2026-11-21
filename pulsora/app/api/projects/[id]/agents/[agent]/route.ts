import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agents";
import { addDrafts, addRun, getProject } from "@/lib/db";
import { describeError } from "@/lib/llm";
import { AGENTS, type AgentId } from "@/lib/types";

export const maxDuration = 300;

export async function POST(_req: Request, ctx: { params: Promise<{ id: string; agent: string }> }) {
  const { id, agent } = await ctx.params;
  if (!AGENTS.includes(agent as AgentId)) return NextResponse.json({ error: "Unknown agent" }, { status: 404 });
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  try {
    const { drafts, demo } = await runAgent(agent as AgentId, project);
    await addDrafts(drafts.map((d) => ({ ...d, projectId: id, agent: agent as AgentId })));
    await addRun({ projectId: id, agent: agent as AgentId, status: "success", message: `Created ${drafts.length} draft(s) for review.`, draftCount: drafts.length, demo });
    return NextResponse.json({ count: drafts.length });
  } catch (err) {
    const message = describeError(err);
    await addRun({ projectId: id, agent: agent as AgentId, status: "error", message, draftCount: 0, demo: false });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
