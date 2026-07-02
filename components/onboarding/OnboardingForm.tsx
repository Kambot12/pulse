"use client";

import { useActionState, useState, startTransition } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { onboardingAction } from "@/lib/actions/onboarding";
import type { ActionState } from "@/lib/actions/auth";
import { BLOOD_GROUPS, GENOTYPES, GENDERS, LEVELS } from "@/lib/constants";

type Fields = Record<string, string>;

const STEPS = [
  { title: "About you", fields: ["name", "matricNumber", "faculty", "department", "level"] },
  { title: "Vitals", fields: ["age", "gender", "bloodGroup", "genotype"] },
  { title: "Medical history", fields: ["allergies", "medicalConditions", "currentMedication"] },
  { title: "Emergency contact", fields: ["emergencyContactName", "emergencyContactPhone", "emergencyContactRelationship"] },
] as const;

const REQUIRED = new Set([
  "name", "matricNumber", "faculty", "department", "level", "age", "gender", "bloodGroup", "genotype",
]);

const LABELS: Fields = {
  name: "Full name", matricNumber: "Matric number", faculty: "Faculty", department: "Department",
  level: "Level", age: "Age", gender: "Gender", bloodGroup: "Blood group", genotype: "Genotype",
  allergies: "Allergies", medicalConditions: "Medical conditions", currentMedication: "Current medication",
  emergencyContactName: "Contact name", emergencyContactPhone: "Contact phone",
  emergencyContactRelationship: "Relationship",
};

const HINTS: Fields = {
  allergies: "Comma-separated, e.g. Penicillin, Peanuts",
  medicalConditions: "Comma-separated, e.g. Asthma",
  currentMedication: "Comma-separated, e.g. Ventolin",
};

export function OnboardingForm() {
  const [state, dispatch, isPending] = useActionState<ActionState, FormData>(
    onboardingAction,
    undefined
  );
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Fields>({});
  const [stepError, setStepError] = useState<string | null>(null);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const set = (k: string, v: string) => setValues((prev) => ({ ...prev, [k]: v }));

  const validateStep = () => {
    for (const f of current.fields) {
      if (REQUIRED.has(f) && !values[f]?.trim()) {
        setStepError(`${LABELS[f]} is required.`);
        return false;
      }
    }
    setStepError(null);
    return true;
  };

  const next = () => validateStep() && setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => { setStepError(null); setStep((s) => Math.max(s - 1, 0)); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.set(k, v));
    startTransition(() => dispatch(fd));
  };

  const renderField = (f: string) => {
    const common = { id: f, value: values[f] ?? "", className: "input" as const };
    if (f === "gender" || f === "bloodGroup" || f === "genotype" || f === "level") {
      const opts = f === "gender" ? GENDERS : f === "bloodGroup" ? BLOOD_GROUPS : f === "genotype" ? GENOTYPES : LEVELS;
      return (
        <select {...common} onChange={(e) => set(f, e.target.value)}>
          <option value="">Select…</option>
          {opts.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    return (
      <input
        {...common}
        type={f === "age" ? "number" : f.includes("Phone") ? "tel" : "text"}
        placeholder={HINTS[f] ?? ""}
        onChange={(e) => set(f, e.target.value)}
      />
    );
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* progress */}
      <div>
        <div className="mb-2 flex justify-between text-xs font-medium text-muted">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span>{current.title}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div className="brand-gradient h-full rounded-full transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">{current.title}</h1>

      {(stepError || state?.error) && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {stepError ?? state?.error}
        </p>
      )}

      <div className="grid gap-4">
        {current.fields.map((f) => (
          <div key={f}>
            <label className="label" htmlFor={f}>
              {LABELS[f]} {REQUIRED.has(f) && <span className="text-brand">*</span>}
            </label>
            {renderField(f)}
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-1">
        {step > 0 && (
          <button type="button" onClick={back} className="btn btn-ghost">
            <ChevronLeft size={16} /> Back
          </button>
        )}
        {!isLast ? (
          <button type="button" onClick={next} className="btn btn-primary ml-auto">
            Continue <ChevronRight size={16} />
          </button>
        ) : (
          <button type="submit" disabled={isPending} className="btn btn-primary ml-auto">
            {isPending ? <><Loader2 className="animate-spin" size={16} /> Saving…</> : "Finish setup"}
          </button>
        )}
      </div>
    </form>
  );
}
