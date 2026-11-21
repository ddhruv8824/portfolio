"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Draft, DraftStatus } from "@/lib/types";

const STATUS_STYLE: Record<DraftStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  rejected: "bg-zinc-200 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-300",
  posted: "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-100",
};

export function DraftCard({ draft }: { draft: Draft }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(draft.title);
  const [body, setBody] = useState(draft.body);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function patch(data: Partial<Pick<Draft, "status" | "title" | "body">>) {
    setBusy(true);
    await fetch(`/api/drafts/${draft.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusy(false);
    setEditing(false);
    router.refresh();
  }

  async function copy() {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const long = body.length > 600;

  return (
    <article className="panel p-5">
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <span className="chip">{draft.channel}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[draft.status]}`}>{draft.status}</span>
        <span className="ml-auto text-xs muted">{new Date(draft.createdAt).toLocaleString()}</span>
      </header>

      {editing ? (
        <input className="input mb-2 font-semibold" value={title} onChange={(e) => setTitle(e.target.value)} />
      ) : (
        <h3 className="mb-1 font-semibold">{draft.title}</h3>
      )}
      {draft.reason && <p className="mb-2 text-sm muted">💡 {draft.reason}</p>}
      {draft.targetUrl && (
        <a href={draft.targetUrl} target="_blank" rel="noreferrer" className="mb-2 block truncate text-sm text-brand-600 underline">
          {draft.targetUrl}
        </a>
      )}

      {editing ? (
        <textarea className="input min-h-64 font-mono text-sm" value={body} onChange={(e) => setBody(e.target.value)} />
      ) : (
        <div className="relative">
          <pre className={`whitespace-pre-wrap break-words font-sans text-sm leading-relaxed ${!expanded && long ? "max-h-56 overflow-hidden" : ""}`}>
            {draft.body}
          </pre>
          {long && (
            <button className="mt-1 text-xs font-semibold text-brand-600" onClick={() => setExpanded(!expanded)}>
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      <footer className="mt-4 flex flex-wrap gap-2">
        {editing ? (
          <>
            <button className="btn btn-primary" disabled={busy} onClick={() => patch({ title, body })}>Save</button>
            <button className="btn btn-ghost" onClick={() => { setEditing(false); setTitle(draft.title); setBody(draft.body); }}>Cancel</button>
          </>
        ) : (
          <>
            {draft.status !== "approved" && draft.status !== "posted" && (
              <button className="btn btn-primary" disabled={busy} onClick={() => patch({ status: "approved" })}>✓ Approve</button>
            )}
            {draft.status === "approved" && (
              <button className="btn btn-primary" disabled={busy} onClick={() => patch({ status: "posted" })}>Mark as posted</button>
            )}
            <button className="btn btn-ghost" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn btn-ghost" onClick={copy}>{copied ? "Copied!" : "Copy"}</button>
            {draft.status !== "rejected" && draft.status !== "posted" && (
              <button className="btn btn-ghost" disabled={busy} onClick={() => patch({ status: "rejected" })}>Reject</button>
            )}
            {draft.status === "rejected" && (
              <button className="btn btn-ghost" disabled={busy} onClick={() => patch({ status: "pending" })}>Restore</button>
            )}
          </>
        )}
      </footer>
    </article>
  );
}
