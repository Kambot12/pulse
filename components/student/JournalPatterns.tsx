"use client";

import { useState, useTransition } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { summarizeJournalAction } from "@/lib/actions/journal";

export function JournalPatterns({ summary, hasEntries }: { summary: string; hasEntries: boolean }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  return (
    <div className="card p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted"><Sparkles size={16} /> Your patterns</h2>
        {hasEntries && (
          <button
            onClick={() => start(async () => { const r = await summarizeJournalAction(); if (r?.error) setErr(r.error); })}
            disabled={pending}
            className="btn btn-ghost px-2.5 py-1 text-xs"
          >
            <RefreshCw size={13} className={pending ? "animate-spin" : ""} /> {summary ? "Refresh" : "Summarize"}
          </button>
        )}
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
      {summary ? (
        <p className="whitespace-pre-line text-sm text-foreground">{summary}</p>
      ) : (
        <p className="text-sm text-muted">
          {hasEntries
            ? "Tap Summarize to see patterns across your recent entries."
            : "Log a few entries and Pulse will surface patterns here."}
        </p>
      )}
      <p className="mt-3 text-[11px] text-muted">General information, not a diagnosis. Confirm anything personal with a clinician.</p>
    </div>
  );
}
