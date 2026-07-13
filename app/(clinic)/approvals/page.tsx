import { CalendarClock } from "lucide-react";
import { dbConnect } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import { Appointment } from "@/lib/db/models/Appointment";
import { StudentProfile } from "@/lib/db/models/StudentProfile";
import { AppointmentApproval } from "@/components/clinic/AppointmentApproval";
import { toPlain } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const orgId = (await getCurrentUser())?.orgId ?? null;
  await dbConnect();
  const appts = await Appointment.find({ orgId, status: { $in: ["pending", "approved"] } })
    .sort({ date: 1, time: 1 })
    .limit(50)
    .lean();

  // join student names
  const ids = [...new Set(appts.map((a) => String(a.studentId)))];
  const profiles = await StudentProfile.find({ orgId, _id: { $in: ids } }).select("name").lean<{ _id: unknown; name: string }[]>();
  const nameById = new Map(profiles.map((p) => [String(p._id), p.name]));

  const rows = toPlain(appts).map((a) => ({
    _id: String(a._id),
    studentName: nameById.get(String(a.studentId)) ?? "Student",
    reason: a.reason as string,
    date: a.date as string,
    time: a.time as string,
    status: a.status as string,
    queueNumber: a.queueNumber as number | undefined,
  }));

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex items-center gap-2">
        <div className="grid size-10 place-items-center rounded-xl bg-[#ecfeff] text-brand-ink"><CalendarClock size={20} /></div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
          <p className="text-sm text-muted">Approve requests and check students into the queue.</p>
        </div>
      </div>

      <AppointmentApproval appts={rows} />
    </div>
  );
}
