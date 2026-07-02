import { headers } from "next/headers";
import { ShieldCheck, ShieldX, Droplet, Dna, TriangleAlert, Phone, Pill, Activity } from "lucide-react";
import { Logo } from "@/components/Logo";
import { verifyPassportToken } from "@/lib/passport/token";
import { dbConnect } from "@/lib/db/connect";
import { StudentProfile, type StudentProfileDoc } from "@/lib/db/models/StudentProfile";
import { MedicalRecord } from "@/lib/db/models/MedicalRecord";
import { AuditLog } from "@/lib/db/models/AuditLog";
import { toPlain } from "@/lib/utils";

export const runtime = "nodejs";

function ErrorCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-md px-5 py-16 text-center">
      <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-red-50 text-red-500">
        <ShieldX size={28} />
      </div>
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) return <ErrorCard title="No passport token" body="This link is missing its secure token." />;

  const result = verifyPassportToken(token);
  if (!result.ok) {
    const messages = {
      malformed: "This QR code could not be read.",
      bad_signature: "This passport failed its security check.",
      expired: "This passport has expired — ask the student to refresh it.",
    } as const;
    return <ErrorCard title="Invalid passport" body={messages[result.reason]} />;
  }

  await dbConnect();
  const profile = await StudentProfile.findById(result.payload.sid).lean<StudentProfileDoc>();
  if (!profile) return <ErrorCard title="Student not found" body="No profile is linked to this passport." />;

  const records = await MedicalRecord.find({ studentId: profile._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Audit every access to a medical record.
  const h = await headers();
  await AuditLog.create({
    action: "passport.view",
    actorLabel: "clinic-scan",
    targetType: "StudentProfile",
    targetId: String(profile._id),
    ip: h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "",
  });

  const p = toPlain(profile);
  const recs = toPlain(records);

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Logo />
        <span className="pill bg-emerald-50 text-emerald-700"><ShieldCheck size={14} /> Verified</span>
      </div>

      <div className="card brand-gradient p-6 text-white">
        <p className="text-sm text-white/80">Health Passport</p>
        <h1 className="text-2xl font-bold">{p.name}</h1>
        <p className="text-white/80">{p.matricNumber} · {p.faculty} · {p.level} level</p>
      </div>

      {/* Critical strip */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Droplet size={14} />} label="Blood" value={p.bloodGroup ?? "—"} />
        <Stat icon={<Dna size={14} />} label="Genotype" value={p.genotype ?? "—"} />
        <Stat icon={<Activity size={14} />} label="Age" value={p.age ? String(p.age) : "—"} />
        <Stat icon={<Phone size={14} />} label="Emergency" value={p.emergencyContact?.phone || "—"} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Panel icon={<TriangleAlert size={16} />} title="Allergies" items={p.allergies} tone="red" />
        <Panel icon={<Activity size={16} />} title="Conditions" items={p.medicalConditions} tone="amber" />
        <Panel icon={<Pill size={16} />} title="Current medication" items={p.currentMedication} tone="sky" />
        {p.emergencyContact?.name && (
          <div className="card p-4">
            <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-muted"><Phone size={16} /> Emergency contact</p>
            <p className="font-medium">{p.emergencyContact.name} · {p.emergencyContact.relationship}</p>
            <p className="text-sm text-brand-ink">{p.emergencyContact.phone}</p>
          </div>
        )}
      </div>

      {/* Records */}
      <div className="card mt-4 p-5">
        <p className="mb-3 text-sm font-semibold text-muted">Medical history</p>
        {recs.length ? (
          <ul className="space-y-3">
            {recs.map((r) => (
              <li key={r._id as string} className="flex gap-3">
                <div className="mt-1 size-2.5 shrink-0 rounded-full bg-brand" />
                <div>
                  <p className="font-medium">{r.title} <span className="text-xs font-normal capitalize text-muted">· {r.type}</span></p>
                  {r.details ? <p className="text-sm text-muted">{r.details}</p> : null}
                  <p className="text-xs text-muted">{new Date(r.createdAt as string).toLocaleDateString()}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No medical records yet.</p>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-muted">This access has been logged. Pulse — secure health records.</p>
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

function Panel({ icon, title, items, tone }: {
  icon: React.ReactNode; title: string; items?: string[]; tone: "red" | "amber" | "sky";
}) {
  const toneClass = {
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-700",
    sky: "bg-sky-50 text-sky-700",
  }[tone];
  return (
    <div className="card p-4">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted">{icon} {title}</p>
      {items?.length ? (
        <div className="flex flex-wrap gap-2">
          {items.map((i) => <span key={i} className={`pill ${toneClass}`}>{i}</span>)}
        </div>
      ) : (
        <p className="text-sm text-muted">None recorded</p>
      )}
    </div>
  );
}
