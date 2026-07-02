"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Stethoscope, Plus, Trash2, TriangleAlert, Info, Dna, User, Pill } from "lucide-react";
import { recordConsultationAction } from "@/lib/actions/clinic";
import type { ActionState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { FREQUENCIES } from "@/lib/meds/schedule";
import { DRUG_LIBRARY, findDrug } from "@/lib/meds/library";
import { checkSafety } from "@/lib/meds/safety";
import { templatesForConditions, COMMON_TEMPLATES, type RxTemplate } from "@/lib/meds/templates";

interface Row {
  id: string; name: string; dosage: string; frequencyKey: string; durationDays: string; drugKey: string; instructions: string;
}

const emptyRow = (): Row => ({ id: crypto.randomUUID(), name: "", dosage: "", frequencyKey: "twice_daily", durationDays: "", drugKey: "", instructions: "" });

export function Consultation({
  studentId, name, conditions = [], allergies = [], genotype, age, currentMedNames = [],
}: {
  studentId: string; name: string; conditions?: string[]; allergies?: string[];
  genotype?: string; age?: number; currentMedNames?: string[];
}) {
  const [state, action] = useActionState<ActionState, FormData>(recordConsultationAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [pregnant, setPregnant] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  const templates = [...templatesForConditions(conditions), ...COMMON_TEMPLATES];

  useEffect(() => {
    if (state && !state.error) { formRef.current?.reset(); setRows([]); setPregnant(false); }
  }, [state]);

  const addFromTemplate = (t: RxTemplate) => setRows((r) => [...r, {
    id: crypto.randomUUID(), name: t.name, dosage: t.dosage, frequencyKey: t.frequencyKey,
    durationDays: t.durationDays ? String(t.durationDays) : "", drugKey: t.drugKey, instructions: t.instructions,
  }]);

  const update = (id: string, patch: Partial<Row>) =>
    setRows((r) => r.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const remove = (id: string) => setRows((r) => r.filter((row) => row.id !== id));

  const prescriptionsJson = JSON.stringify(rows.map(({ id, ...rest }) => ({ ...rest, durationDays: rest.durationDays })));

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="pregnant" value={pregnant ? "true" : "false"} />
      <input type="hidden" name="prescriptions" value={prescriptionsJson} />

      {/* Patient context panel */}
      <div className="card bg-slate-50 p-4">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted"><User size={15} /> {name} — at a glance</p>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="pill bg-white"><Dna size={13} /> Genotype {genotype || "—"}</span>
          {typeof age === "number" && <span className="pill bg-white">Age {age}</span>}
          {allergies.length ? allergies.map((a) => <span key={a} className="pill bg-red-100 text-red-700"><TriangleAlert size={12} /> {a}</span>)
            : <span className="pill bg-white text-muted">No allergies</span>}
          {conditions.map((c) => <span key={c} className="pill bg-amber-100 text-amber-700">{c}</span>)}
          {currentMedNames.length ? currentMedNames.map((m) => <span key={m} className="pill bg-sky-50 text-sky-700"><Pill size={12} /> {m}</span>) : null}
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <p className="flex items-center gap-2 font-semibold"><Stethoscope size={16} /> Consultation</p>
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="complaint">Presenting complaint</label>
            <input id="complaint" name="complaint" required className="input" placeholder="e.g. Acute asthma attack" />
          </div>
          <div>
            <label className="label" htmlFor="diagnosis">Diagnosis</label>
            <input id="diagnosis" name="diagnosis" className="input" placeholder="e.g. Mild asthma exacerbation" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" rows={2} className="input" placeholder="Exam findings, plan…" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={pregnant} onChange={(e) => setPregnant(e.target.checked)} className="size-4 accent-[color:var(--brand)]" />
          Patient is pregnant (adjusts safety checks)
        </label>
      </div>

      {/* Templates */}
      {templates.length > 0 && (
        <div className="card p-4">
          <p className="mb-2 text-sm font-semibold text-muted">Quick prescribe (tap to add, then edit)</p>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <button type="button" key={`${t.conditionLabel}-${t.label}`} onClick={() => addFromTemplate(t)}
                className="pill border border-line bg-white hover:border-brand/50">
                <Plus size={12} /> {t.label} <span className="text-muted">· {t.conditionLabel}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Prescription rows */}
      <datalist id="drug-list-consult">{DRUG_LIBRARY.map((d) => <option key={d.key} value={d.name} />)}</datalist>
      {rows.map((row) => {
        const drug = findDrug(row.name);
        const warnings = row.name.trim()
          ? checkSafety(drug ?? { name: row.name, drugClass: "other" }, { allergies, currentMedNames, conditions, genotype, age, pregnant })
          : [];
        return (
          <div key={row.id} className="card space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <input list="drug-list-consult" className="input" placeholder="Drug" value={row.name}
                  onChange={(e) => update(row.id, { name: e.target.value, drugKey: findDrug(e.target.value)?.key ?? "" })} />
                <input className="input" placeholder="Dosage (e.g. 500mg)" value={row.dosage} onChange={(e) => update(row.id, { dosage: e.target.value })} />
                <select className="input" value={row.frequencyKey} onChange={(e) => update(row.id, { frequencyKey: e.target.value })}>
                  {FREQUENCIES.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
                <input className="input" type="number" min={0} max={365} placeholder="Days (blank = ongoing)" value={row.durationDays}
                  onChange={(e) => update(row.id, { durationDays: e.target.value })} />
                <input className="input sm:col-span-2" placeholder="Instructions" value={row.instructions} onChange={(e) => update(row.id, { instructions: e.target.value })} />
              </div>
              <button type="button" onClick={() => remove(row.id)} className="btn btn-ghost px-2 py-2 text-red-600"><Trash2 size={15} /></button>
            </div>
            {warnings.map((w, i) => (
              <p key={i} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${w.level === "high" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
                {w.level === "high" ? <TriangleAlert size={15} className="mt-0.5 shrink-0" /> : <Info size={15} className="mt-0.5 shrink-0" />} {w.message}
              </p>
            ))}
          </div>
        );
      })}

      <button type="button" onClick={() => setRows((r) => [...r, emptyRow()])} className="btn btn-ghost w-full">
        <Plus size={16} /> Add medication
      </button>

      <SubmitButton pendingText="Saving consultation…">Save visit &amp; prescribe{rows.length ? ` (${rows.length})` : ""}</SubmitButton>
    </form>
  );
}
