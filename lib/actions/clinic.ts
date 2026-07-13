"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/db/connect";
import { Medication } from "@/lib/db/models/Medication";
import { MedicalRecord } from "@/lib/db/models/MedicalRecord";
import { StudentProfile } from "@/lib/db/models/StudentProfile";
import { Appointment } from "@/lib/db/models/Appointment";
import { AuditLog } from "@/lib/db/models/AuditLog";
import { clinicPrescribeSchema, clinicRecordSchema, clinicFollowUpSchema, consultationSchema } from "@/lib/validation/schemas";
import { generateTimes, computeEndDate, frequencyLabel, todayISO } from "@/lib/meds/schedule";
import { drugByKey, findDrug } from "@/lib/meds/library";
import { pushToUserIds } from "@/lib/push";
import type { ActionState } from "./auth";

const EDITOR_ROLES = ["doctor", "admin", "superadmin"];
const CLINIC_ROLES = ["doctor", "reception", "admin", "superadmin"];

/** Doctor/admin + their tenant. Returns null (blocking) if not an editor or no org. */
async function requireClinician() {
  const session = await auth();
  const user = session?.user;
  if (!user || !EDITOR_ROLES.includes(user.role) || !user.orgId) return null;
  return { user, orgId: user.orgId };
}

/** True only if the student exists AND belongs to the given institution. */
async function studentInOrg(studentId: string, orgId: string): Promise<boolean> {
  return !!(await StudentProfile.exists({ _id: studentId, orgId }));
}

export interface PatientHit { id: string; name: string; matricNumber: string }

export async function searchPatientsAction(query: string): Promise<PatientHit[]> {
  const session = await auth();
  const user = session?.user;
  if (!user || !CLINIC_ROLES.includes(user.role) || !user.orgId) return [];
  const q = query.trim();
  if (q.length < 2) return [];

  await dbConnect();
  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  // Scoped to the staff member's institution — never returns another org's students.
  const hits = await StudentProfile.find({ orgId: user.orgId, $or: [{ name: rx }, { matricNumber: rx }] })
    .limit(8)
    .select("name matricNumber")
    .lean<{ _id: unknown; name: string; matricNumber: string }[]>();

  return hits.map((h) => ({ id: String(h._id), name: h.name, matricNumber: h.matricNumber }));
}

function clinicianName(user: { name?: string | null; email?: string | null }): string {
  if (user.name) return user.name;
  if (user.email) return `Dr. ${user.email.split("@")[0]}`;
  return "the clinic";
}

async function notifyStudent(studentId: string, title: string, body: string, url = "/medications") {
  const profile = await StudentProfile.findById(studentId).select("userId").lean<{ userId: unknown }>();
  if (profile?.userId) {
    await pushToUserIds([profile.userId], { title, body, url });
  }
}

export async function prescribeMedicationAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await requireClinician();
  if (!ctx) return { error: "Not authorized to prescribe." };
  const user = ctx.user;

  const parsed = clinicPrescribeSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { studentId, name, dosage, frequencyKey, durationDays, drugKey, instructions } = parsed.data;
  await dbConnect();
  if (!(await studentInOrg(studentId, ctx.orgId))) return { error: "Patient not found." };

  const drug = drugKey ? drugByKey(drugKey) : findDrug(name);
  const schedule = generateTimes(frequencyKey);
  const startDate = todayISO();
  const endDate = computeEndDate(startDate, durationDays || null);
  const docName = clinicianName(user);

  await Medication.create({
    orgId: ctx.orgId,
    studentId, name, dosage, frequencyKey,
    durationDays: durationDays || undefined,
    withFood: drug?.withFood ?? "any",
    drugKey: drug?.key ?? "",
    schedule, startDate, endDate: endDate ?? undefined,
    instructions, active: true, remindersEnabled: true,
    source: "clinic", prescribedById: user.id, prescribedByName: docName,
  });

  await MedicalRecord.create({
    orgId: ctx.orgId,
    studentId, type: "prescription",
    title: `${name}${dosage ? ` · ${dosage}` : ""}`,
    details: `${frequencyLabel(frequencyKey)}${durationDays ? ` for ${durationDays} days` : ""}.${instructions ? ` ${instructions}` : ""}`,
    doctorId: user.id, doctorName: docName,
  });

  await AuditLog.create({ orgId: ctx.orgId, actorId: user.id, action: "clinic.prescribe", targetType: "StudentProfile", targetId: studentId });
  await notifyStudent(studentId, "💊 New prescription", `${docName} prescribed ${name}. Reminders are set.`);

  revalidatePath(`/patient/${studentId}`);
  revalidatePath("/medications");
  return { error: undefined };
}

export async function addRecordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await requireClinician();
  if (!ctx) return { error: "Not authorized." };
  const user = ctx.user;

  const parsed = clinicRecordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { studentId, type, title, details } = parsed.data;
  await dbConnect();
  if (!(await studentInOrg(studentId, ctx.orgId))) return { error: "Patient not found." };
  const docName = clinicianName(user);

  await MedicalRecord.create({ orgId: ctx.orgId, studentId, type, title, details, doctorId: user.id, doctorName: docName });
  await AuditLog.create({ orgId: ctx.orgId, actorId: user.id, action: "clinic.addRecord", targetType: "StudentProfile", targetId: studentId });
  await notifyStudent(studentId, "📋 New health record", `${docName} added a ${type} record to your timeline.`);

  revalidatePath(`/patient/${studentId}`);
  revalidatePath("/timeline");
  return { error: undefined };
}

export async function recordConsultationAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await requireClinician();
  if (!ctx) return { error: "Not authorized." };
  const user = ctx.user;

  let prescriptions: unknown = [];
  try { prescriptions = JSON.parse(String(formData.get("prescriptions") ?? "[]")); } catch { /* ignore */ }

  const parsed = consultationSchema.safeParse({
    studentId: formData.get("studentId"),
    complaint: formData.get("complaint"),
    diagnosis: formData.get("diagnosis"),
    notes: formData.get("notes"),
    pregnant: formData.get("pregnant") === "true",
    prescriptions,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { studentId, complaint, diagnosis, notes, pregnant, prescriptions: rxList } = parsed.data;
  await dbConnect();
  if (!(await studentInOrg(studentId, ctx.orgId))) return { error: "Patient not found." };
  const docName = clinicianName(user);

  // 1) The visit episode
  const visit = await MedicalRecord.create({
    orgId: ctx.orgId,
    studentId, type: "visit",
    title: diagnosis || complaint,
    details: [complaint && `Complaint: ${complaint}`, notes, pregnant && "Patient is pregnant."].filter(Boolean).join(" — "),
    doctorId: user.id, doctorName: docName,
  });

  // 2) Prescriptions linked to that visit → smart courses + prescription records
  for (const rx of rxList) {
    const drug = rx.drugKey ? drugByKey(rx.drugKey) : findDrug(rx.name);
    const startDate = todayISO();
    const endDate = computeEndDate(startDate, rx.durationDays || null);
    await Medication.create({
      orgId: ctx.orgId,
      studentId, name: rx.name, dosage: rx.dosage, frequencyKey: rx.frequencyKey,
      durationDays: rx.durationDays || undefined, withFood: drug?.withFood ?? "any",
      drugKey: drug?.key ?? "", schedule: generateTimes(rx.frequencyKey),
      startDate, endDate: endDate ?? undefined, instructions: rx.instructions,
      active: true, remindersEnabled: true, source: "clinic",
      prescribedById: user.id, prescribedByName: docName, visitId: visit._id,
    });
    await MedicalRecord.create({
      orgId: ctx.orgId,
      studentId, type: "prescription", visitId: visit._id,
      title: `${rx.name}${rx.dosage ? ` · ${rx.dosage}` : ""}`,
      details: `${frequencyLabel(rx.frequencyKey)}${rx.durationDays ? ` for ${rx.durationDays} days` : ""}.${rx.instructions ? ` ${rx.instructions}` : ""}`,
      doctorId: user.id, doctorName: docName,
    });
  }

  await AuditLog.create({ orgId: ctx.orgId, actorId: user.id, action: "clinic.consultation", targetType: "StudentProfile", targetId: studentId });
  const n = rxList.length;
  await notifyStudent(
    studentId,
    "🩺 Visit recorded",
    n ? `${docName} saw you and prescribed ${n} medication${n > 1 ? "s" : ""}. Reminders are set.` : `${docName} recorded your visit.`,
    n ? "/medications" : "/timeline"
  );

  revalidatePath(`/patient/${studentId}`);
  revalidatePath("/medications");
  revalidatePath("/timeline");
  return { error: undefined };
}

export async function scheduleFollowUpAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await requireClinician();
  if (!ctx) return { error: "Not authorized." };
  const user = ctx.user;

  const parsed = clinicFollowUpSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { studentId, date, time, reason } = parsed.data;
  await dbConnect();
  if (!(await studentInOrg(studentId, ctx.orgId))) return { error: "Patient not found." };
  await Appointment.create({ orgId: ctx.orgId, studentId, date, time, reason, status: "approved" });
  await AuditLog.create({ orgId: ctx.orgId, actorId: user.id, action: "clinic.followUp", targetType: "StudentProfile", targetId: studentId });
  await notifyStudent(studentId, "📅 Follow-up scheduled", `${clinicianName(user)} booked a follow-up on ${date} at ${time}.`, "/appointments");

  revalidatePath(`/patient/${studentId}`);
  revalidatePath("/appointments");
  return { error: undefined };
}

export async function updateMedicationByClinicAction(
  medId: string,
  data: { dosage?: string; frequencyKey?: string; durationDays?: number }
) {
  const ctx = await requireClinician();
  if (!ctx) return;

  await dbConnect();
  const med = await Medication.findOne({ _id: medId, orgId: ctx.orgId });
  if (!med) return;

  if (data.dosage != null) med.dosage = data.dosage;
  if (data.frequencyKey) { med.frequencyKey = data.frequencyKey; med.schedule = generateTimes(data.frequencyKey); }
  if (data.durationDays != null) {
    med.durationDays = data.durationDays || undefined;
    med.endDate = computeEndDate(med.startDate ?? todayISO(), data.durationDays || null) ?? undefined;
  }
  await med.save();

  await AuditLog.create({ orgId: ctx.orgId, actorId: ctx.user.id, action: "clinic.updateMed", targetType: "Medication", targetId: medId });
  await notifyStudent(String(med.studentId), "💊 Prescription updated", `${clinicianName(ctx.user)} updated ${med.name}.`);

  revalidatePath(`/patient/${med.studentId}`);
  revalidatePath("/medications");
}

export async function stopMedicationByClinicAction(medId: string) {
  const ctx = await requireClinician();
  if (!ctx) return;

  await dbConnect();
  const med = await Medication.findOneAndUpdate({ _id: medId, orgId: ctx.orgId }, { active: false }, { new: false });
  if (!med) return;

  await AuditLog.create({ orgId: ctx.orgId, actorId: ctx.user.id, action: "clinic.stopMed", targetType: "Medication", targetId: medId });
  await notifyStudent(String(med.studentId), "💊 Medication stopped", `${clinicianName(ctx.user)} stopped ${med.name}.`);

  revalidatePath(`/patient/${med.studentId}`);
  revalidatePath("/medications");
}
