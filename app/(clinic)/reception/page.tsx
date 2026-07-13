import Link from "next/link";
import { Users, ListOrdered, CalendarClock } from "lucide-react";
import { dbConnect } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import { Appointment } from "@/lib/db/models/Appointment";
import { StudentProfile } from "@/lib/db/models/StudentProfile";
import { QueueEntry } from "@/lib/db/models/QueueEntry";
import { PatientSearch } from "@/components/clinic/PatientSearch";
import { AppointmentApproval } from "@/components/clinic/AppointmentApproval";
import { toPlain } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReceptionDashboard() {
  const orgId = (await getCurrentUser())?.orgId ?? null;
  await dbConnect();
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);

  const [appts, waiting, serving, pendingCount] = await Promise.all([
    Appointment.find({ orgId, status: { $in: ["pending", "approved"] } }).sort({ date: 1, time: 1 }).limit(20).lean(),
    QueueEntry.countDocuments({ orgId, status: "waiting", enqueuedAt: { $gte: start, $lt: end } }),
    QueueEntry.findOne({ orgId, status: "in_progress", enqueuedAt: { $gte: start, $lt: end } }).lean<{ number: number } | null>(),
    Appointment.countDocuments({ orgId, status: "pending" }),
  ]);

  const ids = [...new Set(appts.map((a) => String(a.studentId)))];
  const profiles = await StudentProfile.find({ orgId, _id: { $in: ids } }).select("name").lean<{ _id: unknown; name: string }[]>();
  const nameById = new Map(profiles.map((p) => [String(p._id), p.name]));
  const rows = toPlain(appts).map((a) => ({
    _id: String(a._id), studentName: nameById.get(String(a.studentId)) ?? "Student",
    reason: a.reason as string, date: a.date as string, time: a.time as string,
    status: a.status as string, queueNumber: a.queueNumber as number | undefined,
  }));

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Front desk</h1>
        <p className="text-sm text-muted">Check students in, approve visits, and manage the queue.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={<CalendarClock size={18} />} label="Pending requests" value={pendingCount} />
        <Stat icon={<Users size={18} />} label="Waiting in queue" value={waiting} />
        <Link href="/queue-board" className="card flex items-center justify-between p-5 transition hover:border-brand/40">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-muted"><ListOrdered size={18} /> Now serving</div>
            <p className="mt-2 text-3xl font-extrabold brand-text">{serving ? `#${serving.number}` : "—"}</p>
          </div>
        </Link>
      </div>

      <PatientSearch />

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted">Appointment requests</h2>
        <AppointmentApproval appts={rows} />
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted">{icon} {label}</div>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
    </div>
  );
}
