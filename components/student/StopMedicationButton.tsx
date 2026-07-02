"use client";

import { useTransition } from "react";
import { Square, Loader2 } from "lucide-react";
import { setMedicationActiveAction } from "@/lib/actions/medications";

export function StopMedicationButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(() => { setMedicationActiveAction(id, false); })}
      className="btn btn-ghost px-2.5 py-1.5 text-xs text-muted"
      title="Stop this medication"
    >
      {pending ? <Loader2 className="animate-spin" size={13} /> : <Square size={13} />} Stop
    </button>
  );
}
