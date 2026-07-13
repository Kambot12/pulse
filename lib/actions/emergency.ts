"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/db/connect";
import { StudentProfile, type StudentProfileDoc } from "@/lib/db/models/StudentProfile";
import { EmergencyAlert } from "@/lib/db/models/EmergencyAlert";
import { AuditLog } from "@/lib/db/models/AuditLog";
import { pushToRoles } from "@/lib/push";
import { sendSms } from "@/lib/notify/sms";

const CLINIC_ROLES = ["doctor", "reception", "admin", "superadmin"];

export interface SosResult { ok: boolean; alertId?: string; error?: string }

export async function triggerEmergencyAction(input: {
  lat?: number; lng?: number; accuracy?: number; note?: string;
}): Promise<SosResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not signed in." };

  await dbConnect();
  const profile = await StudentProfile.findOne({ userId: session.user.id }).lean<StudentProfileDoc>();
  if (!profile) return { ok: false, error: "No student profile found." };

  const orgId = String(profile.orgId);

  // Rate-limit: reuse an in-flight alert from the last 5 minutes instead of spamming.
  const recent = await EmergencyAlert.findOne({
    studentId: profile._id,
    status: { $in: ["active", "acknowledged"] },
    createdAt: { $gte: new Date(Date.now() - 5 * 60_000) },
  });
  if (recent) return { ok: true, alertId: String(recent._id) };

  const alert = await EmergencyAlert.create({
    orgId,
    studentId: profile._id,
    status: "active",
    location:
      input.lat != null && input.lng != null
        ? { lat: input.lat, lng: input.lng, accuracy: input.accuracy }
        : undefined,
    criticalSnapshot: {
      name: profile.name,
      matricNumber: profile.matricNumber,
      bloodGroup: profile.bloodGroup,
      genotype: profile.genotype,
      allergies: profile.allergies,
      medicalConditions: profile.medicalConditions,
      emergencyContact: profile.emergencyContact,
    },
    note: input.note ?? "",
  });

  await AuditLog.create({
    orgId,
    actorId: session.user.id,
    action: "emergency.trigger",
    targetType: "EmergencyAlert",
    targetId: String(alert._id),
  });

  // Channel 1+2: live dashboard (via the record) + push to THIS clinic's staff only.
  await pushToRoles(CLINIC_ROLES, {
    title: "🆘 Emergency SOS",
    body: `${profile.name} (${profile.matricNumber}) needs help. Blood ${profile.bloodGroup ?? "—"}, genotype ${profile.genotype ?? "—"}.`,
    url: "/emergencies",
    tag: `sos-${alert._id}`,
    urgent: true,
  }, orgId);

  // Channel 4: SMS (stubbed until a provider is configured).
  await sendSms("clinic", `SOS: ${profile.name} ${profile.matricNumber} triggered an emergency.`);
  if (profile.emergencyContact?.phone) {
    await sendSms(profile.emergencyContact.phone, `${profile.name} just triggered an emergency alert on Pulse.`);
  }

  revalidatePath("/emergencies");
  return { ok: true, alertId: String(alert._id) };
}

async function requireStaff() {
  const session = await auth();
  const user = session?.user;
  if (!user || !CLINIC_ROLES.includes(user.role) || !user.orgId) return null;
  return { user, orgId: user.orgId };
}

export async function acknowledgeEmergencyAction(id: string) {
  const ctx = await requireStaff();
  if (!ctx) return;
  await dbConnect();
  await EmergencyAlert.updateOne(
    { _id: id, orgId: ctx.orgId, status: "active" },
    { status: "acknowledged", acknowledgedBy: ctx.user.id, acknowledgedAt: new Date() }
  );
  await AuditLog.create({ orgId: ctx.orgId, actorId: ctx.user.id, action: "emergency.acknowledge", targetType: "EmergencyAlert", targetId: id });
  revalidatePath("/emergencies");
}

export async function resolveEmergencyAction(id: string) {
  const ctx = await requireStaff();
  if (!ctx) return;
  await dbConnect();
  await EmergencyAlert.updateOne({ _id: id, orgId: ctx.orgId }, { status: "resolved", resolvedAt: new Date() });
  await AuditLog.create({ orgId: ctx.orgId, actorId: ctx.user.id, action: "emergency.resolve", targetType: "EmergencyAlert", targetId: id });
  revalidatePath("/emergencies");
}
