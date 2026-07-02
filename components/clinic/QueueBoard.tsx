"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellRing, CheckCircle2, Loader2, Users } from "lucide-react";
import { callNextAction, completeEntryAction } from "@/lib/actions/queue";

interface Entry {
  _id: string; number: number; studentName: string; reason: string; status: string;
}

export function QueueBoard({ entries }: { entries: Entry[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 10_000);
    return () => clearInterval(id);
  }, [router]);

  const current = entries.find((e) => e.status === "in_progress");
  const waiting = entries.filter((e) => e.status === "waiting");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="pill bg-[#ecfeff] text-brand-ink"><Users size={14} /> {waiting.length} waiting</span>
        <button disabled={pending} onClick={() => start(() => { callNextAction(); })} className="btn btn-primary">
          {pending ? <Loader2 className="animate-spin" size={16} /> : <BellRing size={16} />} Call next
        </button>
      </div>

      {/* Now serving */}
      <div className="card brand-gradient p-6 text-white">
        <p className="text-sm text-white/80">Now serving</p>
        {current ? (
          <div className="mt-1 flex items-center justify-between">
            <div>
              <p className="text-3xl font-extrabold">#{current.number}</p>
              <p className="text-white/90">{current.studentName} · {current.reason}</p>
            </div>
            <button disabled={pending} onClick={() => start(() => { completeEntryAction(current._id); })}
              className="btn bg-white/20 px-3 py-2 text-sm text-white hover:bg-white/30">
              <CheckCircle2 size={16} /> Done
            </button>
          </div>
        ) : (
          <p className="mt-1 text-xl font-bold">— Tap “Call next” to begin</p>
        )}
      </div>

      {/* Waiting list */}
      <div>
        <p className="mb-2 text-sm font-semibold text-muted">Waiting</p>
        {waiting.length ? (
          <div className="space-y-2">
            {waiting.map((e) => (
              <div key={e._id} className="card flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-slate-100 font-bold">#{e.number}</span>
                  <div>
                    <p className="font-medium">{e.studentName}</p>
                    <p className="text-sm text-muted">{e.reason}</p>
                  </div>
                </div>
                <button disabled={pending} onClick={() => start(() => { completeEntryAction(e._id); })}
                  className="btn btn-ghost px-2.5 py-1.5 text-xs text-muted">Remove</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-6 text-center text-sm text-muted">Queue is empty.</div>
        )}
      </div>
    </div>
  );
}
