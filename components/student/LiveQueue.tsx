"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Clock, PartyPopper, CalendarPlus } from "lucide-react";

export type QueueData =
  | { state: "none" }
  | { state: "serving"; number: number }
  | { state: "waiting"; number: number; ahead: number; etaMin: number };

export function LiveQueue({ data }: { data: QueueData }) {
  const router = useRouter();

  // Keep the position fresh while the student waits.
  useEffect(() => {
    if (data.state === "none") return;
    const id = setInterval(() => router.refresh(), 10_000);
    return () => clearInterval(id);
  }, [router, data.state]);

  if (data.state === "none") {
    return (
      <div className="card grid place-items-center p-10 text-center">
        <Users className="mb-3 text-muted" />
        <p className="font-medium">You&apos;re not in the queue</p>
        <p className="mb-4 text-sm text-muted">Book a visit and check in at the clinic to get a queue number.</p>
        <Link href="/appointments" className="btn btn-primary"><CalendarPlus size={16} /> Book an appointment</Link>
      </div>
    );
  }

  if (data.state === "serving") {
    return (
      <div className="card brand-gradient grid place-items-center p-10 text-center text-white">
        <PartyPopper className="mb-2" size={28} />
        <p className="text-sm text-white/80">It&apos;s your turn</p>
        <p className="my-1 text-5xl font-extrabold">#{data.number}</p>
        <p className="text-white/90">Please proceed to the clinic now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card grid place-items-center p-8 text-center">
        <p className="text-sm text-muted">Your queue number</p>
        <p className="my-1 text-5xl font-extrabold brand-text">#{data.number}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-5 text-center">
          <div className="mb-1 flex items-center justify-center gap-1.5 text-sm text-muted"><Users size={15} /> Ahead of you</div>
          <p className="text-3xl font-extrabold">{data.ahead}</p>
        </div>
        <div className="card p-5 text-center">
          <div className="mb-1 flex items-center justify-center gap-1.5 text-sm text-muted"><Clock size={15} /> Est. wait</div>
          <p className="text-3xl font-extrabold">~{data.etaMin}<span className="text-lg"> min</span></p>
        </div>
      </div>
      <p className="text-center text-xs text-muted">Updates automatically. We&apos;ll notify you when it&apos;s your turn.</p>
    </div>
  );
}
