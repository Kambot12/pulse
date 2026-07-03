"use client";

import { useActionState } from "react";
import { updateStudentProfileAction } from "@/lib/actions/account";
import type { ActionState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { BLOOD_GROUPS, GENOTYPES, GENDERS, LEVELS } from "@/lib/constants";

interface Initial {
  name?: string; matricNumber?: string; faculty?: string; department?: string; level?: string;
  age?: number; gender?: string; bloodGroup?: string; genotype?: string;
  allergies?: string[]; medicalConditions?: string[]; currentMedication?: string[];
  emergencyContact?: { name?: string; phone?: string; relationship?: string };
}

export function EditProfileForm({ initial }: { initial: Initial }) {
  const [state, action] = useActionState<ActionState, FormData>(updateStudentProfileAction, undefined);
  const list = (a?: string[]) => (a ?? []).join(", ");

  return (
    <form action={action} className="space-y-5">
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}

      <div className="card space-y-3 p-5">
        <p className="text-sm font-semibold text-muted">About you</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name"><input name="name" required className="input" defaultValue={initial.name} /></Field>
          <Field label="Matric number"><input name="matricNumber" required className="input" defaultValue={initial.matricNumber} /></Field>
          <Field label="Faculty"><input name="faculty" required className="input" defaultValue={initial.faculty} /></Field>
          <Field label="Department"><input name="department" required className="input" defaultValue={initial.department} /></Field>
          <Field label="Level">
            <select name="level" required className="input" defaultValue={initial.level}>
              <option value="">Select…</option>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Age"><input name="age" type="number" required className="input" defaultValue={initial.age} /></Field>
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <p className="text-sm font-semibold text-muted">Vitals</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Gender">
            <select name="gender" required className="input" defaultValue={initial.gender}>
              <option value="">Select…</option>{GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Blood group">
            <select name="bloodGroup" required className="input" defaultValue={initial.bloodGroup}>
              <option value="">Select…</option>{BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Genotype">
            <select name="genotype" required className="input" defaultValue={initial.genotype}>
              <option value="">Select…</option>{GENOTYPES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <p className="text-sm font-semibold text-muted">Medical history <span className="font-normal">(comma-separated)</span></p>
        <Field label="Allergies"><input name="allergies" className="input" defaultValue={list(initial.allergies)} placeholder="e.g. Penicillin, Peanuts" /></Field>
        <Field label="Conditions"><input name="medicalConditions" className="input" defaultValue={list(initial.medicalConditions)} placeholder="e.g. Asthma" /></Field>
        <Field label="Current medication"><input name="currentMedication" className="input" defaultValue={list(initial.currentMedication)} /></Field>
      </div>

      <div className="card space-y-3 p-5">
        <p className="text-sm font-semibold text-muted">Emergency contact</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Name"><input name="emergencyContactName" className="input" defaultValue={initial.emergencyContact?.name} /></Field>
          <Field label="Phone"><input name="emergencyContactPhone" type="tel" className="input" defaultValue={initial.emergencyContact?.phone} /></Field>
          <Field label="Relationship"><input name="emergencyContactRelationship" className="input" defaultValue={initial.emergencyContact?.relationship} /></Field>
        </div>
      </div>

      <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}
