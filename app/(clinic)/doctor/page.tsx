import Link from "next/link";
import { ScanLine, Users, CalendarClock, ShieldCheck } from "lucide-react";
import { dbConnect } from "@/lib/db/connect";
import { PatientSearch } from "@/components/clinic/PatientSearch";
import { StudentProfile } from "@/lib/db/models/StudentProfile";
import { Appointment } from "@/lib/db/models/Appointment";
import { AuditLog } from "@/lib/db/models/AuditLog";
import { toPlain } from "@/lib/utils";

export default async function DoctorDashboard() {
  await dbConnect();
  const [students, pending, recentAccess] = await Promise.all([
    StudentProfile.countDocuments({}),
    Appointment.countDocuments({ status: "pending" }),
    AuditLog.find({ action: "passport.view" }).sort({ createdAt: -1 }).limit(6).lean(),
  ]);
  const access = toPlain(recentAccess);

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clinic dashboard</h1>
        <p className="text-sm text-muted">Scan a student&apos;s passport to pull records instantly.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={<Users size={18} />} label="Registered students" value={students} />
        <Stat icon={<CalendarClock size={18} />} label="Pending appointments" value={pending} />
        <Stat icon={<ShieldCheck size={18} />} label="Records accessed" value={access.length} />
      </div>

      <Link href="/scan" className="card brand-gradient flex items-center justify-between p-5 text-white transition hover:brightness-105">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-white/20"><ScanLine size={22} /></div>
          <div>
            <p className="font-semibold">Scan a Health Passport</p>
            <p className="text-sm text-white/80">Open the camera and check a student in</p>
          </div>
        </div>
      </Link>

      <PatientSearch />

      <div className="card p-5">
        <p className="mb-3 text-sm font-semibold text-muted">Recent record access</p>
        {access.length ? (
          <ul className="space-y-2 text-sm">
            {access.map((a) => (
              <li key={a._id as string} className="flex justify-between">
                <span className="text-muted">{a.actorLabel || "scan"} · student {String(a.targetId).slice(-6)}</span>
                <span className="text-muted">{new Date(a.createdAt as string).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No passport scans yet.</p>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted">{icon} {label}</div>
      <p className="mt-2 text-3xl font-extrabold brand-text">{value}</p>
    </div>
  );
}
