"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/db/connect";
import { Appointment } from "@/lib/db/models/Appointment";
import { QueueEntry } from "@/lib/db/models/QueueEntry";
import { StudentProfile } from "@/lib/db/models/StudentProfile";
import { AuditLog } from "@/lib/db/models/AuditLog";
import { pushToUserIds } from "@/lib/push";

const CLINIC_ROLES = ["doctor", "reception", "admin", "superadmin"];

/** Clinic staff + their tenant. Returns null (blocking the action) if not staff or no org. */
async function requireStaff() {
  const session = await auth();
  const user = session?.user;
  if (!user || !CLINIC_ROLES.includes(user.role) || !user.orgId) return null;
  return { user, orgId: user.orgId };
}

function dayBounds() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  return { start, end };
}

async function notifyStudent(studentId: unknown, title: string, body: string, url = "/queue") {
  const profile = await StudentProfile.findById(studentId).select("userId").lean<{ userId: unknown }>();
  if (profile?.userId) await pushToUserIds([profile.userId], { title, body, url });
}

export async function approveAppointmentAction(id: string) {
  const ctx = await requireStaff();
  if (!ctx) return;
  await dbConnect();
  const appt = await Appointment.findOneAndUpdate({ _id: id, orgId: ctx.orgId }, { status: "approved" }, { new: true });
  if (!appt) return;
  await AuditLog.create({ orgId: ctx.orgId, actorId: ctx.user.id, action: "appointment.approve", targetType: "Appointment", targetId: id });
  await notifyStudent(appt.studentId, "✅ Appointment approved", `Your visit on ${appt.date} at ${appt.time} is confirmed.`, "/appointments");
  revalidatePath("/appointments");
}

export async function rejectAppointmentAction(id: string) {
  const ctx = await requireStaff();
  if (!ctx) return;
  await dbConnect();
  const appt = await Appointment.findOneAndUpdate({ _id: id, orgId: ctx.orgId }, { status: "rejected" }, { new: true });
  if (!appt) return;
  await AuditLog.create({ orgId: ctx.orgId, actorId: ctx.user.id, action: "appointment.reject", targetType: "Appointment", targetId: id });
  await notifyStudent(appt.studentId, "Appointment update", `Your requested visit on ${appt.date} couldn't be confirmed. Please rebook.`, "/appointments");
  revalidatePath("/appointments");
}

/** Check an approved appointment into today's queue and give it a number. */
export async function checkInAppointmentAction(appointmentId: string) {
  const ctx = await requireStaff();
  if (!ctx) return;
  await dbConnect();

  const appt = await Appointment.findOne({ _id: appointmentId, orgId: ctx.orgId });
  if (!appt) return;

  // Already queued today?
  const existing = await QueueEntry.findOne({ appointmentId, orgId: ctx.orgId, status: { $in: ["waiting", "in_progress"] } });
  if (existing) return;

  const { start, end } = dayBounds();
  const todayCount = await QueueEntry.countDocuments({ orgId: ctx.orgId, enqueuedAt: { $gte: start, $lt: end } });
  const number = todayCount + 1;

  const profile = await StudentProfile.findById(appt.studentId).select("name").lean<{ name: string }>();

  await QueueEntry.create({
    orgId: ctx.orgId, studentId: appt.studentId, appointmentId, number, status: "waiting",
    studentName: profile?.name ?? "", reason: appt.reason,
  });
  appt.queueNumber = number;
  await appt.save();

  await AuditLog.create({ orgId: ctx.orgId, actorId: ctx.user.id, action: "queue.checkIn", targetType: "Appointment", targetId: appointmentId });
  await notifyStudent(appt.studentId, "🎫 You're checked in", `You're number ${number} in today's queue.`);
  revalidatePath("/queue");
  revalidatePath("/appointments");
}

export async function callNextAction() {
  const ctx = await requireStaff();
  if (!ctx) return;
  await dbConnect();
  const { start, end } = dayBounds();

  // finish anyone currently in progress
  await QueueEntry.updateMany(
    { orgId: ctx.orgId, status: "in_progress", enqueuedAt: { $gte: start, $lt: end } },
    { status: "done" }
  );

  const next = await QueueEntry.findOne({ orgId: ctx.orgId, status: "waiting", enqueuedAt: { $gte: start, $lt: end } }).sort({ number: 1 });
  if (!next) { revalidatePath("/queue"); return; }
  next.status = "in_progress";
  await next.save();

  await AuditLog.create({ orgId: ctx.orgId, actorId: ctx.user.id, action: "queue.callNext", targetType: "QueueEntry", targetId: String(next._id) });
  await notifyStudent(next.studentId, "🔔 It's your turn", "Please proceed to the clinic — you're being seen now.");
  revalidatePath("/queue");
}

export async function completeEntryAction(entryId: string) {
  const ctx = await requireStaff();
  if (!ctx) return;
  await dbConnect();
  const entry = await QueueEntry.findOneAndUpdate({ _id: entryId, orgId: ctx.orgId }, { status: "done" }, { new: true });
  if (entry?.appointmentId) {
    await Appointment.updateOne({ _id: entry.appointmentId, orgId: ctx.orgId }, { status: "completed" });
  }
  await AuditLog.create({ orgId: ctx.orgId, actorId: ctx.user.id, action: "queue.complete", targetType: "QueueEntry", targetId: entryId });
  revalidatePath("/queue");
}
