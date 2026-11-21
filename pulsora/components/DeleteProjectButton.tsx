"use client";

import { useRouter } from "next/navigation";

export function DeleteProjectButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      className="text-xs muted underline"
      onClick={async () => {
        if (!confirm("Delete this project and all its drafts?")) return;
        await fetch(`/api/projects/${id}`, { method: "DELETE" });
        router.push("/");
        router.refresh();
      }}
    >
      Delete project
    </button>
  );
}
