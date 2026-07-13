import { isValidObjectId } from "mongoose";
import { headers } from "next/headers";
import { Droplet, Dna, TriangleAlert, Phone, Activity, ShieldX, Pill, Stethoscope } from "lucide-react";
import { dbConnect } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import { StudentProfile, type StudentProfileDoc } from "@/lib/db/models/StudentProfile";
import { Medication } from "@/lib/db/models/Medication";
import { MedicalRecord } from "@/lib/db/models/MedicalRecord";
import { AuditLog } from "@/lib/db/models/AuditLog";
import { Consultation } from "@/components/clinic/Consultation";
import { AddRecordForm } from "@/components/clinic/AddRecordForm";
import { FollowUpForm } from "@/components/clinic/FollowUpForm";
import { ClinicMedList } from "@/components/clinic/ClinicMedList";
import { toPlain } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PatientWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const canEdit = !!user && ["doctor", "admin"].includes(user.role);
  const orgId = user?.orgId ?? null;

  if (!isValidObjectId(id)) {
    return <ErrorCard body="That patient link is invalid." />;
  }

  await dbConnect();
  // Scoped to the staff member's institution — a clinic can only open its own patients.
  const profile = await StudentProfile.findOne({ _id: id, orgId }).lean<StudentProfileDoc>();
  if (!profile) return <ErrorCard body="No student is linked to this record." />;

  const [activeMeds, records] = await Promise.all([
    Medication.find({ orgId, studentId: profile._id, active: true }).sort({ createdAt: -1 }).lean(),
    MedicalRecord.find({ orgId, studentId: profile._id }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  const h = await headers();
  await AuditLog.create({
    orgId, actorId: user?.id, action: "clinic.viewPatient", targetType: "StudentProfile",
    targetId: String(profile._id), ip: h.get("x-forwarded-for") ?? "",
  });

  const p = toPlain(profile);
  const meds = toPlain(activeMeds);
  const recs = toPlain(records);

  return (
    <div className="animate-fade-up space-y-5">
      {/* Identity */}
      <div className="card brand-gradient p-6 text-white">
        <p className="text-sm text-white/80">Patient record</p>
        <h1 className="text-2xl font-bold">{p.name}</h1>
        <p className="text-white/80">{p.matricNumber} · {p.faculty} · {p.level} level</p>
      </div>

      {/* Critical strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Droplet size={14} />} label="Blood" value={p.bloodGroup ?? "—"} />
        <Stat icon={<Dna size={14} />} label="Genotype" value={p.genotype ?? "—"} />
        <Stat icon={<Activity size={14} />} label="Age" value={p.age ? String(p.age) : "—"} />
        <Stat icon={<Phone size={14} />} label="Emergency" value={p.emergencyContact?.phone || "—"} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Panel icon={<TriangleAlert size={16} />} title="Allergies" items={p.allergies} tone="red" />
        <Panel icon={<Activity size={16} />} title="Conditions" items={p.medicalConditions} tone="amber" />
      </div>

      {/* Current meds */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted"><Pill size={16} /> Current medications</h2>
        {canEdit ? (
          <ClinicMedList meds={meds as never} />
        ) : meds.length ? (
          <div className="space-y-2">
            {meds.map((m) => (
              <div key={String(m._id)} className="card p-4">
                <p className="font-semibold">{m.name} {m.dosage ? <span className="font-normal text-muted">· {m.dosage}</span> : null}</p>
                <p className="text-sm text-muted">{m.schedule?.join(", ")}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted">No active medications.</p>}
      </section>

      {/* Clinician actions */}
      {canEdit ? (
        <>
          <Consultation
            studentId={String(p._id)}
            name={p.name}
            conditions={p.medicalConditions ?? []}
            allergies={p.allergies ?? []}
            genotype={p.genotype ?? undefined}
            age={p.age ?? undefined}
            currentMedNames={meds.map((m) => m.name)}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <AddRecordForm studentId={String(p._id)} />
            <FollowUpForm studentId={String(p._id)} />
          </div>
        </>
      ) : (
        <p className="rounded-xl bg-slate-50 p-3 text-sm text-muted">
          You have view-only access. Prescribing and record edits require a doctor or admin account.
        </p>
      )}

      {/* Timeline */}
      <section className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted"><Stethoscope size={16} /> Medical history</h2>
        {recs.length ? (
          <ul className="space-y-3">
            {recs.map((r) => (
              <li key={String(r._id)} className="flex gap-3">
                <div className="mt-1 size-2.5 shrink-0 rounded-full bg-brand" />
                <div>
                  <p className="font-medium">{r.title} <span className="text-xs font-normal capitalize text-muted">· {r.type}</span></p>
                  {r.details ? <p className="text-sm text-muted">{r.details}</p> : null}
                  <p className="text-xs text-muted">{new Date(r.createdAt as string).toLocaleDateString()}{r.doctorName ? ` · ${r.doctorName}` : ""}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">No records yet.</p>}
      </section>
    </div>
  );
}

function ErrorCard({ body }: { body: string }) {
  return (
    <div className="mx-auto max-w-md px-5 py-16 text-center">
      <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-red-50 text-red-500"><ShieldX size={28} /></div>
      <h1 className="text-xl font-bold">Record unavailable</h1>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">{icon} {label}</div>
      <p className="mt-0.5 truncate font-bold">{value}</p>
    </div>
  );
}

function Panel({ icon, title, items, tone }: { icon: React.ReactNode; title: string; items?: string[]; tone: "red" | "amber" }) {
  const toneClass = tone === "red" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700";
  return (
    <div className="card p-4">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted">{icon} {title}</p>
      {items?.length ? (
        <div className="flex flex-wrap gap-2">{items.map((i) => <span key={i} className={`pill ${toneClass}`}>{i}</span>)}</div>
      ) : <p className="text-sm text-muted">None recorded</p>}
    </div>
  );
}
