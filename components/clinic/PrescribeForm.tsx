"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Pill, TriangleAlert, Info, Stethoscope } from "lucide-react";
import { prescribeMedicationAction } from "@/lib/actions/clinic";
import type { ActionState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { FREQUENCIES } from "@/lib/meds/schedule";
import { DRUG_LIBRARY, findDrug } from "@/lib/meds/library";
import { checkSafety } from "@/lib/meds/safety";

const WITH_FOOD_LABEL: Record<string, string> = {
  before: "Before food", after: "After food", with: "With food", any: "Any time",
};

export function PrescribeForm({
  studentId, allergies = [], conditions = [], currentMedNames = [],
}: {
  studentId: string; allergies?: string[]; conditions?: string[]; currentMedNames?: string[];
}) {
  const [state, action] = useActionState<ActionState, FormData>(prescribeMedicationAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("");
  const [frequencyKey, setFrequencyKey] = useState("twice_daily");
  const [freqTouched, setFreqTouched] = useState(false);

  const drug = useMemo(() => findDrug(name), [name]);
  useEffect(() => { if (drug && !freqTouched) setFrequencyKey(drug.defaultFrequencyKey); }, [drug, freqTouched]);

  const warnings = useMemo(
    () => (name.trim() ? checkSafety(drug ?? { name, drugClass: "other" }, { allergies, currentMedNames, conditions }) : []),
    [drug, name, allergies, currentMedNames, conditions]
  );

  useEffect(() => {
    if (state && !state.error) { formRef.current?.reset(); setName(""); setFrequencyKey("twice_daily"); setFreqTouched(false); }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="card space-y-3 p-5">
      <p className="flex items-center gap-2 font-semibold"><Stethoscope size={16} /> Prescribe medication</p>
      <input type="hidden" name="studentId" value={studentId} />
      {drug && <input type="hidden" name="drugKey" value={drug.key} />}
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="p-name">Drug</label>
          <input id="p-name" name="name" required list="drug-list-clinic" className="input"
            placeholder="e.g. Amoxicillin" value={name} onChange={(e) => setName(e.target.value)} />
          <datalist id="drug-list-clinic">{DRUG_LIBRARY.map((d) => <option key={d.key} value={d.name} />)}</datalist>
        </div>
        <div>
          <label className="label" htmlFor="p-dosage">Dosage</label>
          <input id="p-dosage" name="dosage" className="input" placeholder="e.g. 500mg" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="p-freq">Frequency</label>
          <select id="p-freq" name="frequencyKey" className="input" value={frequencyKey}
            onChange={(e) => { setFrequencyKey(e.target.value); setFreqTouched(true); }}>
            {FREQUENCIES.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="p-duration">Duration (days)</label>
          <input id="p-duration" name="durationDays" type="number" min={0} max={365} className="input"
            placeholder="e.g. 7" defaultValue={drug?.typicalCourseDays ?? ""} key={drug?.key ?? "none"} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="p-instructions">Instructions to patient</label>
        <input id="p-instructions" name="instructions" className="input" placeholder="e.g. Complete the full course; take with food" />
      </div>

      {warnings.map((w, i) => (
        <p key={i} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${w.level === "high" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
          {w.level === "high" ? <TriangleAlert size={16} className="mt-0.5 shrink-0" /> : <Info size={16} className="mt-0.5 shrink-0" />}
          {w.message}
        </p>
      ))}

      {drug && (
        <div className="rounded-xl bg-slate-50 p-3 text-sm">
          <p className="flex items-center gap-2 font-medium"><Pill size={14} /> {drug.name} · {WITH_FOOD_LABEL[drug.withFood]}</p>
          {drug.cautions.length > 0 && <p className="mt-0.5 text-muted">{drug.cautions.join(" · ")}.</p>}
        </div>
      )}

      <SubmitButton pendingText="Prescribing…">Prescribe &amp; notify patient</SubmitButton>
    </form>
  );
}
