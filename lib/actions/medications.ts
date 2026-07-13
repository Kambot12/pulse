"use server";

import { revalidatePath } from "next/cache";
import { medicationSchema } from "@/lib/validation/schemas";
import { dbConnect } from "@/lib/db/connect";
import { Medication } from "@/lib/db/models/Medication";
import { MedicationLog, type DoseStatus } from "@/lib/db/models/MedicationLog";
import { getCurrentStudentId, getCurrentStudentContext } from "@/lib/auth/session";
import { generateTimes, computeEndDate, todayISO } from "@/lib/meds/schedule";
import { drugByKey, findDrug } from "@/lib/meds/library";
import type { ActionState } from "./auth";

export async function addMedicationAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getCurrentStudentContext();
  if (!ctx) return { error: "Not signed in." };

  const parsed = medicationSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, dosage, frequencyKey, durationDays, drugKey, notes } = parsed.data;
  const drug = drugKey ? drugByKey(drugKey) : findDrug(name);
  const schedule = generateTimes(frequencyKey);
  const startDate = todayISO();
  const endDate = computeEndDate(startDate, durationDays || null);

  await dbConnect();
  await Medication.create({
    orgId: ctx.orgId,
    studentId: ctx.studentId,
    name,
    dosage,
    frequencyKey,
    durationDays: durationDays || undefined,
    withFood: drug?.withFood ?? "any",
    drugKey: drug?.key ?? "",
    schedule,
    startDate,
    endDate: endDate ?? undefined,
    notes,
    active: true,
    remindersEnabled: true,
  });

  revalidatePath("/medications");
  revalidatePath("/dashboard");
  return { error: undefined };
}

/** Records that a scheduled dose was taken or skipped (idempotent per slot). */
export async function logDoseAction(medicationId: string, time: string, status: DoseStatus) {
  const ctx = await getCurrentStudentContext();
  if (!ctx) return;

  const scheduledFor = new Date();
  if (/^\d{1,2}:\d{2}$/.test(time)) {
    const [hh, mm] = time.split(":").map(Number);
    scheduledFor.setHours(hh, mm, 0, 0);
  } else {
    scheduledFor.setSeconds(0, 0);
  }

  await dbConnect();
  await MedicationLog.findOneAndUpdate(
    { medicationId, studentId: ctx.studentId, scheduledFor },
    { orgId: ctx.orgId, medicationId, studentId: ctx.studentId, scheduledFor, status, actedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  revalidatePath("/medications");
  revalidatePath("/dashboard");
}

export async function setMedicationActiveAction(medicationId: string, active: boolean) {
  const studentId = await getCurrentStudentId();
  if (!studentId) return;
  await dbConnect();
  await Medication.updateOne({ _id: medicationId, studentId }, { active });
  revalidatePath("/medications");
}
