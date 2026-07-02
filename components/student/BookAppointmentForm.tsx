"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CalendarPlus, CheckCircle2 } from "lucide-react";
import { bookAppointmentAction } from "@/lib/actions/appointments";
import type { ActionState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";

export function BookAppointmentForm() {
  const [state, action] = useActionState<ActionState, FormData>(bookAppointmentAction, undefined);
  const [booked, setBooked] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (submitted.current && state && !state.error) {
      setBooked(true);
      formRef.current?.reset();
    }
    submitted.current = true;
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={() => { submitted.current = true; setBooked(false); }}
      className="card space-y-3 p-5"
    >
      <p className="flex items-center gap-2 font-semibold"><CalendarPlus size={16} /> Book an appointment</p>

      {booked && (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <CheckCircle2 size={16} /> Request sent! You&apos;ll be notified once the clinic confirms.
        </p>
      )}
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="date">Date</label>
          <input id="date" name="date" type="date" min={today} required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="time">Time</label>
          <input id="time" name="time" type="time" required className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="reason">Reason for visit</label>
        <textarea id="reason" name="reason" required rows={3} className="input" placeholder="e.g. Persistent headache and fever" />
      </div>

      <SubmitButton pendingText="Sending request…">Request appointment</SubmitButton>
    </form>
  );
}
