"use client";

import { useTransition } from "react";
import { Check, X, LogIn, Loader2, CalendarClock } from "lucide-react";
import { approveAppointmentAction, rejectAppointmentAction, checkInAppointmentAction } from "@/lib/actions/queue";

interface Appt {
  _id: string; studentName: string; reason: string; date: string; time: string;
  status: string; queueNumber?: number;
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
  completed: "bg-slate-100 text-muted",
};

export function AppointmentApproval({ appts }: { appts: Appt[] }) {
  const [pending, start] = useTransition();

  if (!appts.length) {
    return (
      <div className="card grid place-items-center p-10 text-center">
        <CalendarClock className="mb-2 text-muted" />
        <p className="font-medium">No appointment requests</p>
        <p className="text-sm text-muted">Pending and approved visits will show up here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {appts.map((a) => (
        <div key={a._id} className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{a.studentName || "Student"}</p>
              <p className="truncate text-sm text-muted">{a.reason}</p>
              <p className="mt-0.5 text-xs text-muted">
                {new Date(`${a.date}T${a.time}`).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <span className={`pill capitalize ${STATUS_STYLE[a.status] ?? "bg-slate-100 text-muted"}`}>{a.status}</span>
          </div>

          <div className="mt-3 flex gap-2">
            {a.status === "pending" && (
              <>
                <button disabled={pending} onClick={() => start(() => { approveAppointmentAction(a._id); })} className="btn btn-primary px-3 py-2 text-sm">
                  {pending ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} Approve
                </button>
                <button disabled={pending} onClick={() => start(() => { rejectAppointmentAction(a._id); })} className="btn btn-ghost px-3 py-2 text-sm text-red-600">
                  <X size={14} /> Reject
                </button>
              </>
            )}
            {a.status === "approved" && (
              <button disabled={pending} onClick={() => start(() => { checkInAppointmentAction(a._id); })} className="btn btn-primary px-3 py-2 text-sm">
                {pending ? <Loader2 className="animate-spin" size={14} /> : <LogIn size={14} />}
                {a.queueNumber ? `Queued #${a.queueNumber}` : "Check in to queue"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
