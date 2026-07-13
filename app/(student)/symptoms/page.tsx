import Link from "next/link";
import { NotebookPen, ChevronRight } from "lucide-react";
import { getCurrentStudentProfile } from "@/lib/auth/session";
import { SymptomCheck } from "@/components/student/SymptomCheck";

export default async function SymptomsPage() {
  const profile = (await getCurrentStudentProfile())!;

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Symptom check</h1>
        <p className="text-sm text-muted">
          Tell Pulse how you feel and it&apos;ll guide you on what to do next. It never diagnoses or
          prescribes — it points you to the right care.
        </p>
      </div>

      <SymptomCheck
        emergencyContact={
          profile.emergencyContact?.phone
            ? { name: profile.emergencyContact.name, phone: profile.emergencyContact.phone }
            : undefined
        }
      />

      <Link href="/journal" className="card flex items-center justify-between p-4 transition hover:border-brand/40">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-[#ecfeff] text-brand-ink"><NotebookPen size={18} /></div>
          <div>
            <p className="text-sm font-semibold">Keep a symptom journal</p>
            <p className="text-xs text-muted">Track how you feel over time and spot patterns.</p>
          </div>
        </div>
        <ChevronRight className="text-muted" />
      </Link>
    </div>
  );
}
