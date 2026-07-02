"use client";

import { useState } from "react";
import Link from "next/link";
import { Stethoscope, AlertTriangle, CalendarPlus, ShieldCheck, Activity } from "lucide-react";
import { assessSymptoms, type TriageResult } from "@/lib/intelligence/triage";
import { EmergencySOS } from "./EmergencySOS";

const LEVEL_UI = {
  urgent: { ring: "border-red-200 bg-red-50", chip: "bg-red-100 text-red-700", icon: AlertTriangle, label: "Urgent" },
  book_appointment: { ring: "border-amber-200 bg-amber-50", chip: "bg-amber-100 text-amber-700", icon: Activity, label: "See a clinician" },
  self_care: { ring: "border-emerald-200 bg-emerald-50", chip: "bg-emerald-100 text-emerald-700", icon: ShieldCheck, label: "Self-care" },
} as const;

export function SymptomCheck({ emergencyContact }: { emergencyContact?: { name?: string; phone?: string } }) {
  const [text, setText] = useState("");
  const [severity, setSeverity] = useState(3);
  const [duration, setDuration] = useState("");
  const [result, setResult] = useState<TriageResult | null>(null);

  const run = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setResult(assessSymptoms({ text, severity, durationDays: duration ? Number(duration) : undefined }));
  };

  const ui = result ? LEVEL_UI[result.level] : null;

  return (
    <div className="space-y-4">
      <form onSubmit={run} className="card space-y-3 p-5">
        <div>
          <label className="label" htmlFor="symptoms">How are you feeling?</label>
          <textarea id="symptoms" rows={3} className="input" value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe your symptoms, e.g. fever and headache since yesterday" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="severity">How bad is it? ({severity}/10)</label>
            <input id="severity" type="range" min={1} max={10} value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))} className="w-full accent-[color:var(--brand)]" />
          </div>
          <div>
            <label className="label" htmlFor="duration">For how many days?</label>
            <input id="duration" type="number" min={0} max={60} className="input"
              value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="optional" />
          </div>
        </div>
        <button type="submit" className="btn btn-primary w-full"><Stethoscope size={16} /> Check my symptoms</button>
      </form>

      {result && ui && (
        <div className={`card animate-fade-up border-2 p-5 ${ui.ring}`}>
          <div className="mb-2 flex items-center gap-2">
            <span className={`pill ${ui.chip}`}><ui.icon size={14} /> {ui.label}</span>
          </div>
          <h3 className="text-lg font-bold">{result.headline}</h3>

          {result.redFlags.length > 0 && (
            <div className="mt-2 rounded-lg bg-white/70 p-3">
              <p className="text-sm font-semibold text-red-700">Warning signs detected:</p>
              <ul className="mt-1 list-inside list-disc text-sm text-red-700">
                {result.redFlags.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          )}

          <ul className="mt-3 space-y-1.5">
            {result.advice.map((a) => (
              <li key={a} className="flex gap-2 text-sm"><span className="text-brand">•</span> {a}</li>
            ))}
          </ul>

          <div className="mt-4">
            {result.cta === "sos" && <EmergencySOS emergencyContact={emergencyContact} />}
            {result.cta === "book" && (
              <Link href="/appointments" className="btn btn-primary"><CalendarPlus size={16} /> Book an appointment</Link>
            )}
            {result.cta === "monitor" && (
              <Link href="/appointments" className="btn btn-ghost"><CalendarPlus size={16} /> Book anyway</Link>
            )}
          </div>

          <p className="mt-4 border-t border-black/5 pt-3 text-xs text-muted">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
