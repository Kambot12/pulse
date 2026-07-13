"use server";

import { revalidatePath } from "next/cache";
import { appointmentSchema } from "@/lib/validation/schemas";
import { dbConnect } from "@/lib/db/connect";
import { Appointment } from "@/lib/db/models/Appointment";
import { getCurrentStudentId, getCurrentStudentContext } from "@/lib/auth/session";
import type { ActionState } from "./auth";

export async function bookAppointmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getCurrentStudentContext();
  if (!ctx) return { error: "Not signed in." };

  const parsed = appointmentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Don't allow booking in the past
  const when = new Date(`${parsed.data.date}T${parsed.data.time}`);
  if (Number.isFinite(when.getTime()) && when.getTime() < Date.now() - 60_000) {
    return { error: "Please pick a time in the future." };
  }

  await dbConnect();
  await Appointment.create({
    orgId: ctx.orgId,
    studentId: ctx.studentId,
    date: parsed.data.date,
    time: parsed.data.time,
    reason: parsed.data.reason,
    status: "pending",
  });

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return { error: undefined };
}

export async function cancelAppointmentAction(appointmentId: string) {
  const studentId = await getCurrentStudentId();
  if (!studentId) return;
  await dbConnect();
  await Appointment.updateOne(
    { _id: appointmentId, studentId, status: { $in: ["pending", "approved"] } },
    { status: "cancelled" }
  );
  revalidatePath("/appointments");
  revalidatePath("/dashboard");
}
