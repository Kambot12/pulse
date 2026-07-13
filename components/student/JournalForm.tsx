"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Siren, CalendarClock, CheckCircle2 } from "lucide-react";
import { addJournalEntryAction, type JournalActionState } from "@/lib/actions/journal";
import { SYMPTOMS } from "@/lib/intelligence/symptoms";
import { SubmitButton } from "@/components/SubmitButton";

export function JournalForm() {
  const [state, action] = useActionState<JournalActionState, FormData>(addJournalEntryAction, undefined);

  return (
    <form action={action} className="card space-y-4 p-5">
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
      {state?.ok && <TriageBanner level={state.triageLevel} />}

      <div>
        <label className="label">How are you feeling? Tap what applies</label>
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS.map((s) => (
            <label key={s.key} className="cursor-pointer">
              <input type="checkbox" name="symptoms" value={s.key} className="peer sr-only" />
              <span className="pill border border-line bg-surface text-muted transition peer-checked:border-transparent peer-checked:bg-[#ecfeff] peer-checked:text-brand-ink">
                {s.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="severity">Severity</label>
          <select id="severity" name="severity" className="input" defaultValue="mild">
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="notes">Notes (optional)</label>
        <textarea id="notes" name="notes" rows={2} className="input" placeholder="Anything else you noticed…" />
      </div>

      <SubmitButton pendingText="Saving…">Log entry</SubmitButton>
    </form>
  );
}

function TriageBanner({ level }: { level?: string }) {
  if (level === "urgent") {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
        <span className="flex items-center gap-1.5"><Siren size={15} /> This may need urgent care.</span>
        <Link href="/dashboard" className="font-semibold underline">Open SOS</Link>
      </div>
    );
  }
  if (level === "book_appointment") {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
        <span className="flex items-center gap-1.5"><CalendarClock size={15} /> Worth getting checked at the clinic.</span>
        <Link href="/appointments" className="font-semibold underline">Book</Link>
      </div>
    );
  }
  return (
    <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
      <CheckCircle2 size={15} /> Logged. Keep an eye on it and rest up.
    </p>
  );
}
