"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STEPS = ["Crawling your website…", "Understanding your business…", "Building your marketing strategy…", "Auditing SEO & AI-search readiness…"];

export function OnboardForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setStep(0);
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 9000);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.push(`/p/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    } finally {
      clearInterval(timer);
    }
  }

  return (
    <form onSubmit={submit} className="panel p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="input"
          placeholder="yourcompany.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          required
        />
        <button className="btn btn-primary justify-center whitespace-nowrap px-6" disabled={loading}>
          {loading ? "Working…" : "Hire my AI CMO →"}
        </button>
      </div>
      {!showNotes && !loading && (
        <button type="button" className="mt-3 text-sm muted underline" onClick={() => setShowNotes(true)}>
          + Add notes about your goals (optional)
        </button>
      )}
      {showNotes && (
        <textarea
          className="input mt-3 min-h-24"
          placeholder="e.g. We want B2B customers in India, focus on agencies, launch in 2 months…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={loading}
        />
      )}
      {loading && (
        <div className="mt-4 flex items-center gap-3 text-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span>{STEPS[step]}</span>
          <span className="muted">(about 1–2 minutes)</span>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </form>
  );
}
