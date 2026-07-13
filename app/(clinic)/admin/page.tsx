import { redirect } from "next/navigation";
import mongoose from "mongoose";
import { Users, CalendarClock, Activity, Pill, Siren, ListOrdered, TrendingDown } from "lucide-react";
import { dbConnect } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import { StudentProfile } from "@/lib/db/models/StudentProfile";
import { Appointment } from "@/lib/db/models/Appointment";
import { Medication } from "@/lib/db/models/Medication";
import { QueueEntry } from "@/lib/db/models/QueueEntry";
import { EmergencyAlert } from "@/lib/db/models/EmergencyAlert";

export const dynamic = "force-dynamic";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["admin", "superadmin"].includes(user.role)) redirect("/doctor");
  if (!user.orgId) redirect("/login");
  const orgId = user.orgId;
  const orgObjId = new mongoose.Types.ObjectId(orgId);

  await dbConnect();
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  const todayStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;

  const [students, apptTotal, activeMeds, activeEmergencies, servedToday, waitingNow,
    noShows, completed, conditionsAgg, medsAgg] = await Promise.all([
    StudentProfile.countDocuments({ orgId }),
    Appointment.countDocuments({ orgId }),
    Medication.countDocuments({ orgId, active: true }),
    EmergencyAlert.countDocuments({ orgId, status: { $in: ["active", "acknowledged"] } }),
    QueueEntry.countDocuments({ orgId, status: "done", enqueuedAt: { $gte: start, $lt: end } }),
    QueueEntry.countDocuments({ orgId, status: "waiting", enqueuedAt: { $gte: start, $lt: end } }),
    Appointment.countDocuments({ orgId, status: "approved", date: { $lt: todayStr } }),
    Appointment.countDocuments({ orgId, status: "completed" }),
    StudentProfile.aggregate<{ _id: string; count: number }>([
      { $match: { orgId: orgObjId } },
      { $unwind: "$medicalConditions" },
      { $match: { medicalConditions: { $ne: "" } } },
      { $group: { _id: { $toLower: "$medicalConditions" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 6 },
    ]),
    Medication.aggregate<{ _id: string; count: number }>([
      { $match: { orgId: orgObjId } },
      { $group: { _id: "$name", count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 6 },
    ]),
  ]);

  const noShowRate = noShows + completed > 0 ? Math.round((noShows / (noShows + completed)) * 100) : 0;
  const conditions = conditionsAgg.map((c) => ({ label: cap(c._id), count: c.count }));
  const meds = medsAgg.map((m) => ({ label: m._id, count: m.count }));

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clinic analytics</h1>
        <p className="text-sm text-muted">Operational overview across the university clinic.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <Stat icon={<Users size={18} />} label="Students" value={students} />
        <Stat icon={<CalendarClock size={18} />} label="Appointments" value={apptTotal} />
        <Stat icon={<Pill size={18} />} label="Active meds" value={activeMeds} />
        <Stat icon={<Siren size={18} />} label="Open emergencies" value={activeEmergencies} accent={activeEmergencies > 0} />
        <Stat icon={<ListOrdered size={18} />} label="Served today" value={servedToday} />
        <Stat icon={<Users size={18} />} label="Waiting now" value={waitingNow} />
        <Stat icon={<TrendingDown size={18} />} label="No-show rate" value={`${noShowRate}%`} />
        <Stat icon={<Activity size={18} />} label="Completed visits" value={completed} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarList title="Most common conditions" items={conditions} empty="No condition data yet." />
        <BarList title="Most prescribed medications" items={meds} empty="No medications yet." />
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`card p-5 ${accent ? "border-red-200 bg-red-50" : ""}`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-muted">{icon} {label}</div>
      <p className={`mt-2 text-3xl font-extrabold ${accent ? "text-red-600" : ""}`}>{value}</p>
    </div>
  );
}

function BarList({ title, items, empty }: { title: string; items: { label: string; count: number }[]; empty: string }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="card p-5">
      <p className="mb-3 text-sm font-semibold text-muted">{title}</p>
      {items.length ? (
        <ul className="space-y-2.5">
          {items.map((i) => (
            <li key={i.label}>
              <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{i.label}</span><span className="text-muted">{i.count}</span></div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                <div className="brand-gradient h-full rounded-full" style={{ width: `${(i.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted">{empty}</p>}
    </div>
  );
}
