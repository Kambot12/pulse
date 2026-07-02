"use client";

import { useState, useTransition } from "react";
import { Pill, Square, SlidersHorizontal, Loader2, Save } from "lucide-react";
import { FREQUENCIES, frequencyLabel } from "@/lib/meds/schedule";
import { updateMedicationByClinicAction, stopMedicationByClinicAction } from "@/lib/actions/clinic";

interface Med {
  _id: string; name: string; dosage?: string; frequencyKey?: string;
  schedule?: string[]; durationDays?: number; source?: string; prescribedByName?: string;
}

function MedRow({ med }: { med: Med }) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [dosage, setDosage] = useState(med.dosage ?? "");
  const [frequencyKey, setFrequencyKey] = useState(med.frequencyKey || "twice_daily");
  const [durationDays, setDurationDays] = useState(med.durationDays ? String(med.durationDays) : "");

  const save = () => start(() => {
    updateMedicationByClinicAction(med._id, {
      dosage, frequencyKey, durationDays: durationDays ? Number(durationDays) : 0,
    }).then(() => setEditing(false));
  });

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{med.name} {med.dosage ? <span className="font-normal text-muted">· {med.dosage}</span> : null}</p>
          <p className="text-sm text-muted">
            {frequencyLabel(med.frequencyKey ?? "")}{med.schedule?.length ? ` · ${med.schedule.join(", ")}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {med.source === "clinic" ? `Prescribed by ${med.prescribedByName || "clinic"}` : "Self-added"}
          </p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setEditing((v) => !v)} className="btn btn-ghost px-2.5 py-1.5 text-xs"><SlidersHorizontal size={13} /> Adjust</button>
          <button disabled={pending} onClick={() => start(() => { stopMedicationByClinicAction(med._id); })}
            className="btn btn-ghost px-2.5 py-1.5 text-xs text-red-600">
            {pending ? <Loader2 className="animate-spin" size={13} /> : <Square size={13} />} Stop
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-3">
          <input className="input" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="Dosage" />
          <select className="input" value={frequencyKey} onChange={(e) => setFrequencyKey(e.target.value)}>
            {FREQUENCIES.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
          <input className="input" type="number" min={0} max={365} value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)} placeholder="Days" />
          <div className="sm:col-span-3">
            <button disabled={pending} onClick={save} className="btn btn-primary px-3 py-2 text-sm">
              {pending ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Save changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ClinicMedList({ meds }: { meds: Med[] }) {
  if (!meds.length) {
    return (
      <div className="card grid place-items-center p-8 text-center">
        <Pill className="mb-2 text-muted" />
        <p className="text-sm text-muted">No active medications.</p>
      </div>
    );
  }
  return <div className="space-y-2">{meds.map((m) => <MedRow key={m._id} med={m} />)}</div>;
}
