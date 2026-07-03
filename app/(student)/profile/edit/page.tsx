import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentStudentProfile } from "@/lib/auth/session";
import { EditProfileForm } from "@/components/student/EditProfileForm";

export default async function EditProfilePage() {
  const p = (await getCurrentStudentProfile())!;

  return (
    <div className="animate-fade-up space-y-4">
      <Link href="/profile" className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={15} /> Back to profile
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit profile</h1>
        <p className="text-sm text-muted">Keep your health information up to date — it powers your passport and safety checks.</p>
      </div>
      <EditProfileForm
        initial={{
          name: p.name, matricNumber: p.matricNumber, faculty: p.faculty, department: p.department,
          level: p.level, age: p.age ?? undefined, gender: p.gender ?? undefined,
          bloodGroup: p.bloodGroup ?? undefined, genotype: p.genotype ?? undefined,
          allergies: p.allergies, medicalConditions: p.medicalConditions, currentMedication: p.currentMedication,
          emergencyContact: p.emergencyContact ?? undefined,
        }}
      />
    </div>
  );
}
