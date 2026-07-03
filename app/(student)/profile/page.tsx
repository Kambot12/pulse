import Link from "next/link";
import { Pencil } from "lucide-react";
import { getCurrentStudentProfile } from "@/lib/auth/session";
import { initials } from "@/lib/utils";

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2.5 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium">{value ?? "—"}</span>
    </div>
  );
}

function Chips({ items }: { items?: string[] }) {
  if (!items?.length) return <span className="text-sm text-muted">None</span>;
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {items.map((i) => <span key={i} className="pill bg-[#ecfeff] text-brand-ink">{i}</span>)}
    </div>
  );
}

export default async function ProfilePage() {
  const p = (await getCurrentStudentProfile())!;

  return (
    <div className="animate-fade-up space-y-5">
      <div className="card flex items-center gap-4 p-5">
        <div className="brand-gradient grid size-16 place-items-center rounded-2xl text-xl font-bold text-white">
          {initials(p.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold">{p.name}</h1>
          <p className="text-sm text-muted">{p.matricNumber}</p>
        </div>
        <Link href="/profile/edit" className="btn btn-ghost px-3 py-2 text-sm"><Pencil size={15} /> Edit</Link>
      </div>

      <div className="card p-5">
        <p className="mb-1 text-sm font-semibold text-muted">Academic</p>
        <Row label="Faculty" value={p.faculty} />
        <Row label="Department" value={p.department} />
        <Row label="Level" value={p.level} />
      </div>

      <div className="card p-5">
        <p className="mb-1 text-sm font-semibold text-muted">Vitals</p>
        <Row label="Age" value={p.age} />
        <Row label="Gender" value={p.gender} />
        <Row label="Blood group" value={p.bloodGroup} />
        <Row label="Genotype" value={p.genotype} />
      </div>

      <div className="card p-5">
        <p className="mb-3 text-sm font-semibold text-muted">Medical</p>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <span className="text-sm text-muted">Allergies</span><Chips items={p.allergies} />
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-sm text-muted">Conditions</span><Chips items={p.medicalConditions} />
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-sm text-muted">Medication</span><Chips items={p.currentMedication} />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <p className="mb-1 text-sm font-semibold text-muted">Emergency contact</p>
        <Row label="Name" value={p.emergencyContact?.name} />
        <Row label="Relationship" value={p.emergencyContact?.relationship} />
        <Row label="Phone" value={p.emergencyContact?.phone} />
      </div>
    </div>
  );
}
