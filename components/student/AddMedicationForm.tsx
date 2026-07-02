"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Plus, TriangleAlert, Info, Pill } from "lucide-react";
import { addMedicationAction } from "@/lib/actions/medications";
import type { ActionState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { FREQUENCIES } from "@/lib/meds/schedule";
import { DRUG_LIBRARY, findDrug } from "@/lib/meds/library";
import { checkSafety } from "@/lib/meds/safety";

const WITH_FOOD_LABEL: Record<string, string> = {
  before: "Before food", after: "After food", with: "With food", any: "Any time",
};

export function AddMedicationForm({
  allergies = [], conditions = [], currentMedNames = [], genotype, age,
}: {
  allergies?: string[]; conditions?: string[]; currentMedNames?: string[]; genotype?: string; age?: number;
}) {
  const [state, action] = useActionState<ActionState, FormData>(addMedicationAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  const [name, setName] = useState("");
  const [frequencyKey, setFrequencyKey] = useState("twice_daily");
  const [freqTouched, setFreqTouched] = useState(false);

  const drug = useMemo(() => findDrug(name), [name]);

  // Auto-suggest the library's default frequency until the user overrides it.
  useEffect(() => {
    if (drug && !freqTouched) setFrequencyKey(drug.defaultFrequencyKey);
  }, [drug, freqTouched]);

  const warnings = useMemo(
    () => (name.trim()
      ? checkSafety(drug ?? { name, drugClass: "other" }, { allergies, currentMedNames, conditions, genotype, age })
      : []),
    [drug, name, allergies, currentMedNames, conditions, genotype, age]
  );

  useEffect(() => {
    if (state && !state.error) {
      formRef.current?.reset();
      setName(""); setFrequencyKey("twice_daily"); setFreqTouched(false);
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="card space-y-3 p-5">
      <p className="flex items-center gap-2 font-semibold"><Plus size={16} /> Add a medication</p>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
      {drug && <input type="hidden" name="drugKey" value={drug.key} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Medication</label>
          <input id="name" name="name" required list="drug-list" className="input"
            placeholder="Start typing… e.g. Amoxicillin"
            value={name} onChange={(e) => setName(e.target.value)} />
          <datalist id="drug-list">
            {DRUG_LIBRARY.map((d) => <option key={d.key} value={d.name} />)}
          </datalist>
        </div>
        <div>
          <label className="label" htmlFor="dosage">Dosage</label>
          <input id="dosage" name="dosage" className="input" placeholder="e.g. 500mg / 2 tabs" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="frequencyKey">How often</label>
          <select id="frequencyKey" name="frequencyKey" className="input"
            value={frequencyKey} onChange={(e) => { setFrequencyKey(e.target.value); setFreqTouched(true); }}>
            {FREQUENCIES.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="durationDays">Duration (days)</label>
          <input id="durationDays" name="durationDays" type="number" min={0} max={365} className="input"
            placeholder="e.g. 7 · leave blank for ongoing"
            defaultValue={drug?.typicalCourseDays ?? ""} key={drug?.key ?? "none"} />
        </div>
      </div>

      {/* Live safety warnings */}
      {warnings.map((w, i) => (
        <p key={i} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
          w.level === "high" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
          {w.level === "high" ? <TriangleAlert size={16} className="mt-0.5 shrink-0" /> : <Info size={16} className="mt-0.5 shrink-0" />}
          {w.message}
        </p>
      ))}

      {/* Library education */}
      {drug && (
        <div className="rounded-xl bg-slate-50 p-3 text-sm">
          <p className="flex items-center gap-2 font-medium"><Pill size={14} /> {drug.name} · {WITH_FOOD_LABEL[drug.withFood]}</p>
          {drug.commonSideEffects.length > 0 && (
            <p className="mt-1 text-muted"><span className="font-medium">Possible side effects:</span> {drug.commonSideEffects.join(", ")}.</p>
          )}
          {drug.cautions.length > 0 && (
            <p className="mt-0.5 text-muted"><span className="font-medium">Notes:</span> {drug.cautions.join(" · ")}.</p>
          )}
          <p className="mt-1 text-xs text-muted">Educational only — confirm dosing with your clinician.</p>
        </div>
      )}

      <SubmitButton pendingText="Adding…">Add to my schedule</SubmitButton>
    </form>
  );
}
