import { headers } from "next/headers";
import { ShieldX } from "lucide-react";
import { Logo } from "@/components/Logo";
import { dbConnect } from "@/lib/db/connect";
import { StudentProfile, type StudentProfileDoc } from "@/lib/db/models/StudentProfile";
import { EmergencyCard } from "@/components/emergency/EmergencyCard";
import { notifyCardAccessed } from "@/lib/emergency/code";
import { toPlain } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Emergency Health Card — Pulse", robots: { index: false } };

export default async function EmergencyCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  await dbConnect();
  const profile = await StudentProfile.findOne({ emergencyCode: code }).lean<StudentProfileDoc>();

  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-red-50 text-red-500"><ShieldX size={28} /></div>
        <h1 className="text-xl font-bold">Card not found</h1>
        <p className="mt-1 text-sm text-muted">This emergency link is invalid or has been reset.</p>
      </div>
    );
  }

  // Break-glass: log the access and notify the owner (best-effort).
  const h = await headers();
  await notifyCardAccessed(profile, "break-glass link", h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "");

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
