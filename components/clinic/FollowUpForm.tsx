"use client";

import { useActionState, useEffect, useRef } from "react";
import { CalendarPlus } from "lucide-react";
import { scheduleFollowUpAction } from "@/lib/actions/clinic";
import type { ActionState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";

export function FollowUpForm({ studentId }: { studentId: string }) {
  const [state, action] = useActionState<ActionState, FormData>(scheduleFollowUpAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => { if (state && !state.error) formRef.current?.reset(); }, [state]);

  return (
    <form ref={formRef} action={action} className="card space-y-3 p-5">
      <p className="flex items-center gap-2 font-semibold"><CalendarPlus size={16} /> Schedule a follow-up</p>
      <input type="hidden" name="studentId" value={studentId} />
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="f-date">Date</label>
          <input id="f-date" name="date" type="date" min={today} required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="f-time">Time</label>
          <input id="f-time" name="time" type="time" required className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="f-reason">Reason</label>
        <input id="f-reason" name="reason" required className="input" placeholder="e.g. Review blood test results" />
      </div>

      <SubmitButton pendingText="Scheduling…">Schedule &amp; notify patient</SubmitButton>
    </form>
  );
}
