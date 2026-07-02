"use client";

import { useTransition } from "react";
import { Check, X, Clock, Loader2 } from "lucide-react";
import { logDoseAction } from "@/lib/actions/medications";
import type { DoseStatus } from "@/lib/db/models/MedicationLog";

export interface Dose {
  medicationId: string;
  medName: string;
  dosage: string;
  time: string;
  status: DoseStatus | "pending";
}

export function MedicationSchedule({ doses }: { doses: Dose[] }) {
  const [pending, start] = useTransition();

  if (!doses.length) {
    return (
      <div className="card grid place-items-center p-8 text-center">
        <Clock className="mb-2 text-muted" />
        <p className="font-medium">Nothing due today</p>
        <p className="text-sm text-muted">Add a medication below to start getting reminders.</p>
      </div>
    );
  }

  const act = (d: Dose, status: DoseStatus) =>
    start(() => {
      logDoseAction(d.medicationId, d.time, status);
    });

  return (
    <div className="space-y-2">
      {doses.map((d) => (
        <div key={`${d.medicationId}-${d.time}`} className="card flex items-center justify-between p-4">
          <div className="min-w-0">
            <p className="truncate font-semibold">{d.medName}</p>
            <p className="text-sm text-muted">
              {d.dosage ? `${d.dosage} · ` : ""}{d.time === "as-needed" ? "As needed" : d.time}
            </p>
          </div>

          {d.status === "pending" ? (
            <div className="flex gap-2">
              <button
                disabled={pending}
                onClick={() => act(d, "skipped")}
                className="btn btn-ghost px-3 py-2"
                aria-label="Skip dose"
              >
                {pending ? <Loader2 className="animate-spin" size={16} /> : <X size={16} />} Skip
              </button>
              <button
                disabled={pending}
                onClick={() => act(d, "taken")}
                className="btn btn-primary px-3 py-2"
                aria-label="Take dose"
              >
                <Check size={16} /> Take
              </button>
            </div>
          ) : (
            <span className={`pill ${d.status === "taken" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-muted"}`}>
              {d.status === "taken" ? "Taken ✓" : "Skipped"}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
