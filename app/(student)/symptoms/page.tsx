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
    </div>
  );
}
