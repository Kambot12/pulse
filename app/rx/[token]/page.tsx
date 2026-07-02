import { headers } from "next/headers";
import { ShieldCheck, ShieldX, Pill, CalendarClock, User } from "lucide-react";
import { Logo } from "@/components/Logo";
import { verifyRxToken } from "@/lib/rx/token";
import { dbConnect } from "@/lib/db/connect";
import { Medication, type MedicationDoc } from "@/lib/db/models/Medication";
import { StudentProfile } from "@/lib/db/models/StudentProfile";
import { AuditLog } from "@/lib/db/models/AuditLog";
import { frequencyLabel } from "@/lib/meds/schedule";
import { toPlain } from "@/lib/utils";

export const runtime = "nodejs";

function ErrorCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-md px-5 py-16 text-center">
      <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-red-50 text-red-500"><ShieldX size={28} /></div>
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}

export default async function RxVerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = verifyRxToken(decodeURIComponent(token));
  if (!result.ok) {
    const msg = { malformed: "This code could not be read.", bad_signature: "This prescription failed its security check — it may be forged.", expired: "This prescription code has expired." } as const;
    return <ErrorCard title="Unverified prescription" body={msg[result.reason]} />;
  }

  await dbConnect();
  const med = await Medication.findById(result.medicationId).lean<MedicationDoc>();
  if (!med) return <ErrorCard title="Prescription not found" body="No prescription is linked to this code." />;

  const student = await StudentProfile.findById(med.studentId).select("name matricNumber").lean<{ name: string; matricNumber: string }>();

  const h = await headers();
  await AuditLog.create({ action: "rx.verify", actorLabel: "pharmacy", targetType: "Medication", targetId: String(med._id), ip: h.get("x-forwarded-for") ?? "" });

  const m = toPlain(med);

  return (
    <div className="mx-auto max-w-lg px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Logo />
        <span className="pill bg-emerald-50 text-emerald-700"><ShieldCheck size={14} /> Verified prescription</span>
      </div>

      <div className="card overflow-hidden">
        <div className="brand-gradient px-6 py-5 text-white">
          <p className="flex items-center gap-2 text-sm text-white/80"><Pill size={15} /> Prescription</p>
          <h1 className="text-2xl font-bold">{m.name}{m.dosage ? ` · ${m.dosage}` : ""}</h1>
        </div>
        <div className="space-y-3 p-6">
          <Row label="For patient" value={`${student?.name ?? "—"} (${student?.matricNumber ?? "—"})`} icon={<User size={15} />} />
          <Row label="Directions" value={`${frequencyLabel(m.frequencyKey ?? "")}${m.durationDays ? ` for ${m.durationDays} days` : ""}`} icon={<CalendarClock size={15} />} />
          {m.instructions ? <Row label="Instructions" value={m.instructions} /> : null}
          <Row label="Prescribed by" value={m.prescribedByName || "Clinic"} />
          <Row label="Issued" value={m.startDate ?? "—"} />
          <Row label="Status" value={m.active ? "Active" : "Completed / stopped"} />
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        This prescription was cryptographically signed by Pulse. Dispense per the prescriber&apos;s directions.
        This access has been logged.
      </p>
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line pb-2.5 last:border-0 last:pb-0">
      <span className="flex items-center gap-1.5 text-sm text-muted">{icon} {label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}
