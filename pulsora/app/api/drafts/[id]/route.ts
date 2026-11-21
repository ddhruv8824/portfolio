import { NextResponse } from "next/server";
import { updateDraft } from "@/lib/db";
import type { DraftStatus } from "@/lib/types";

const STATUSES: DraftStatus[] = ["pending", "approved", "rejected", "posted"];

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { status?: DraftStatus; title?: string; body?: string };
  if (body.status && !STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const draft = await updateDraft(id, {
    ...(body.status && { status: body.status }),
    ...(typeof body.title === "string" && { title: body.title }),
    ...(typeof body.body === "string" && { body: body.body }),
  });
  if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  return NextResponse.json(draft);
}
