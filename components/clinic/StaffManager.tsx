"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { UserPlus, Trash2, KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { createStaffAction, removeStaffAction, type StaffActionState } from "@/lib/actions/staff";
import { SubmitButton } from "@/components/SubmitButton";

interface Staff { id: string; name: string; email: string; role: string }

const ROLE_STYLE: Record<string, string> = {
  admin: "bg-indigo-50 text-indigo-700",
  doctor: "bg-emerald-50 text-emerald-700",
  reception: "bg-amber-50 text-amber-700",
};

export function StaffManager({ staff, selfId }: { staff: Staff[]; selfId: string }) {
  const [state, action] = useActionState<StaffActionState, FormData>(createStaffAction, {});
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => { if (state?.tempPassword) formRef.current?.reset(); }, [state]);

  return (
    <div className="space-y-5">
      <form ref={formRef} action={action} className="card space-y-3 p-5">
        <p className="flex items-center gap-2 font-semibold"><UserPlus size={16} /> Add a staff member</p>
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
        {state?.tempPassword && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <p className="flex items-center gap-1.5 font-semibold"><CheckCircle2 size={15} /> Account created for {state.createdEmail}</p>
            <p className="mt-1 flex items-center gap-1.5">
              <KeyRound size={14} /> Temporary password: <code className="rounded bg-white px-1.5 py-0.5 font-mono font-bold">{state.tempPassword}</code>
            </p>
            <p className="mt-1 text-xs text-emerald-700">Share this with them securely — they&apos;ll be asked to change it on first login. It won&apos;t be shown again.</p>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          <input name="name" required className="input" placeholder="Full name" />
          <input name="email" type="email" required className="input" placeholder="Email" />
          <select name="role" className="input" defaultValue="doctor">
            <option value="doctor">Doctor</option>
            <option value="reception">Reception</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <SubmitButton pendingText="Creating…">Create account</SubmitButton>
      </form>

      <div>
        <p className="mb-2 text-sm font-semibold text-muted">Staff ({staff.length})</p>
        <div className="space-y-2">
          {staff.map((s) => (
            <div key={s.id} className="card flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{s.name || s.email} {s.id === selfId && <span className="text-xs text-muted">(you)</span>}</p>
                <p className="text-sm text-muted">{s.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`pill capitalize ${ROLE_STYLE[s.role] ?? "bg-slate-100 text-muted"}`}>{s.role}</span>
                {s.id !== selfId && (
                  <button disabled={pending} onClick={() => start(() => { removeStaffAction(s.id); })}
                    className="btn btn-ghost px-2 py-1.5 text-red-600" title="Remove">
                    {pending ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
