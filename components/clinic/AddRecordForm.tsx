"use client";

import { useActionState, useEffect, useRef } from "react";
import { FilePlus } from "lucide-react";
import { addRecordAction } from "@/lib/actions/clinic";
import type { ActionState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";

const TYPES = [
  { value: "visit", label: "Visit / consultation" },
  { value: "note", label: "Clinical note" },
  { value: "vaccination", label: "Vaccination" },
  { value: "labResult", label: "Lab result" },
];

export function AddRecordForm({ studentId }: { studentId: string }) {
  const [state, action] = useActionState<ActionState, FormData>(addRecordAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => { if (state && !state.error) formRef.current?.reset(); }, [state]);

  return (
    <form ref={formRef} action={action} className="card space-y-3 p-5">
      <p className="flex items-center gap-2 font-semibold"><FilePlus size={16} /> Add to medical record</p>
      <input type="hidden" name="studentId" value={studentId} />
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="r-type">Type</label>
          <select id="r-type" name="type" className="input" defaultValue="visit">
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="r-title">Title</label>
          <input id="r-title" name="title" required className="input" placeholder="e.g. Malaria — confirmed" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="r-details">Details</label>
        <textarea id="r-details" name="details" rows={3} className="input" placeholder="Findings, diagnosis, follow-up…" />
      </div>

      <SubmitButton pendingText="Saving…">Add record</SubmitButton>
    </form>
  );
}
