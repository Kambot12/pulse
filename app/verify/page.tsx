import { headers } from "next/headers";
import { ShieldX } from "lucide-react";
import { Logo } from "@/components/Logo";
import { verifyPassportToken } from "@/lib/passport/token";
import { dbConnect } from "@/lib/db/connect";
import { StudentProfile, type StudentProfileDoc } from "@/lib/db/models/StudentProfile";
import { EmergencyCard } from "@/components/emergency/EmergencyCard";
import { notifyCardAccessed } from "@/lib/emergency/code";
import { toPlain } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  // Break-glass: log the access and notify the owner. Critical-only (no visit
  // history) — clinicians get full history via the authenticated /scan flow.
  const h = await headers();
  await notifyCardAccessed(profile, "passport scan", h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "");

  const p = toPlain(profile);

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <div className="mb-4 flex items-center justify-between">
        <Logo />
        <span className="pill bg-red-50 text-red-600">Emergency</span>
      </div>
      <EmergencyCard
        data={{
          name: p.name,
          matricNumber: p.matricNumber,
          bloodGroup: p.bloodGroup ?? undefined,
          genotype: p.genotype ?? undefined,
          age: p.age ?? undefined,
          allergies: p.allergies,
          medicalConditions: p.medicalConditions,
          currentMedication: p.currentMedication,
          emergencyContact: p.emergencyContact,
        }}
      />
      <p className="mt-6 text-center text-xs text-muted">This access is logged and the owner is notified. Pulse — emergency health card.</p>
    </div>
  );
}
