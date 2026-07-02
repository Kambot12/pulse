"use client";

import { useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { cancelAppointmentAction } from "@/lib/actions/appointments";

export function CancelAppointmentButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(() => { cancelAppointmentAction(id); })}
      className="btn btn-ghost px-3 py-1.5 text-sm text-red-600"
    >
      {pending ? <Loader2 className="animate-spin" size={14} /> : <X size={14} />} Cancel
    </button>
  );
}
