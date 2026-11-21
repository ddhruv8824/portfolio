"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RunAgentButton({
  projectId,
  agent,
  label = "Run agent",
  endpoint,
  className = "btn btn-primary",
}: {
  projectId: string;
  agent?: string;
  label?: string;
  endpoint?: string;
  className?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function run() {
    setState("running");
    setMsg("");
    try {
      const res = await fetch(endpoint ?? `/api/projects/${projectId}/agents/${agent}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Agent failed");
      setState("done");
      setMsg(typeof data.count === "number" ? `${data.count} new draft(s) in the queue` : "Done");
      router.refresh();
    } catch (err) {
      setState("error");
      setMsg(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button className={className} onClick={run} disabled={state === "running"}>
        {state === "running" ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> Working…
          </>
        ) : (
          label
        )}
      </button>
      {msg && <span className={`text-xs ${state === "error" ? "text-red-500" : "text-emerald-600"}`}>{msg}</span>}
    </div>
  );
}
