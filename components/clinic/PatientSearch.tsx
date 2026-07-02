"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, ChevronRight } from "lucide-react";
import { searchPatientsAction, type PatientHit } from "@/lib/actions/clinic";

export function PatientSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<PatientHit[]>([]);
  const [pending, start] = useTransition();

  const onChange = (value: string) => {
    setQ(value);
    if (value.trim().length < 2) { setHits([]); return; }
    start(async () => setHits(await searchPatientsAction(value)));
  };

  return (
    <div className="card p-5">
      <p className="mb-2 text-sm font-semibold text-muted">Find a patient</p>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
        <input
          className="input pl-9"
          value={q}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by name or matric number…"
        />
        {pending && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted" size={16} />}
      </div>

      {hits.length > 0 && (
        <ul className="mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line">
          {hits.map((h) => (
            <li key={h.id}>
              <button
                onClick={() => router.push(`/patient/${h.id}`)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition hover:bg-slate-50"
              >
                <span><span className="font-medium">{h.name}</span> <span className="text-muted">· {h.matricNumber}</span></span>
                <ChevronRight size={16} className="text-muted" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {q.trim().length >= 2 && !pending && hits.length === 0 && (
        <p className="mt-2 text-sm text-muted">No matching students.</p>
      )}
    </div>
  );
}
