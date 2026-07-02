"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/db/connect";
import { Appointment } from "@/lib/db/models/Appointment";
import { QueueEntry } from "@/lib/db/models/QueueEntry";
import { StudentProfile } from "@/lib/db/models/StudentProfile";
import { AuditLog } from "@/lib/db/models/AuditLog";
import { pushToUserIds } from "@/lib/push";

const CLINIC_ROLES = ["doctor", "reception", "admin"];

async function requireStaff() {
  const session = await auth();
  if (!session?.user || !CLINIC_ROLES.includes(session.user.role)) return null;
  return session.user;
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
  const user = await requireStaff();
  if (!user) return;
  await dbConnect();
  const appt = await Appointment.findByIdAndUpdate(id, { status: "approved" }, { new: true });
  await AuditLog.create({ actorId: user.id, action: "appointment.approve", targetType: "Appointment", targetId: id });
  if (appt) await notifyStudent(appt.studentId, "✅ Appointment approved", `Your visit on ${appt.date} at ${appt.time} is confirmed.`, "/appointments");
  revalidatePath("/appointments");
}

export async function rejectAppointmentAction(id: string) {
  const user = await requireStaff();
  if (!user) return;
  await dbConnect();
  const appt = await Appointment.findByIdAndUpdate(id, { status: "rejected" }, { new: true });
  await AuditLog.create({ actorId: user.id, action: "appointment.reject", targetType: "Appointment", targetId: id });
  if (appt) await notifyStudent(appt.studentId, "Appointment update", `Your requested visit on ${appt.date} couldn't be confirmed. Please rebook.`, "/appointments");
  revalidatePath("/appointments");
}

/** Check an approved appointment into today's queue and give it a number. */
export async function checkInAppointmentAction(appointmentId: string) {
  const user = await requireStaff();
  if (!user) return;
  await dbConnect();

  const appt = await Appointment.findById(appointmentId);
  if (!appt) return;

  // Already queued today?
  const existing = await QueueEntry.findOne({ appointmentId, status: { $in: ["waiting", "in_progress"] } });
  if (existing) return;

  const { start, end } = dayBounds();
  const todayCount = await QueueEntry.countDocuments({ enqueuedAt: { $gte: start, $lt: end } });
  const number = todayCount + 1;

  const profile = await StudentProfile.findById(appt.studentId).select("name").lean<{ name: string }>();

  await QueueEntry.create({
    studentId: appt.studentId, appointmentId, number, status: "waiting",
    studentName: profile?.name ?? "", reason: appt.reason,
  });
  appt.queueNumber = number;
  await appt.save();

  await AuditLog.create({ actorId: user.id, action: "queue.checkIn", targetType: "Appointment", targetId: appointmentId });
  await notifyStudent(appt.studentId, "🎫 You're checked in", `You're number ${number} in today's queue.`);
  revalidatePath("/queue");
  revalidatePath("/appointments");
}

export async function callNextAction() {
  const user = await requireStaff();
  if (!user) return;
  await dbConnect();
  const { start, end } = dayBounds();

  // finish anyone currently in progress
  await QueueEntry.updateMany(
    { status: "in_progress", enqueuedAt: { $gte: start, $lt: end } },
    { status: "done" }
  );

  const next = await QueueEntry.findOne({ status: "waiting", enqueuedAt: { $gte: start, $lt: end } }).sort({ number: 1 });
  if (!next) { revalidatePath("/queue"); return; }
  next.status = "in_progress";
  await next.save();

  await AuditLog.create({ actorId: user.id, action: "queue.callNext", targetType: "QueueEntry", targetId: String(next._id) });
  await notifyStudent(next.studentId, "🔔 It's your turn", "Please proceed to the clinic — you're being seen now.");
  revalidatePath("/queue");
}

export async function completeEntryAction(entryId: string) {
  const user = await requireStaff();
  if (!user) return;
  await dbConnect();
  const entry = await QueueEntry.findByIdAndUpdate(entryId, { status: "done" }, { new: true });
  if (entry?.appointmentId) {
    await Appointment.findByIdAndUpdate(entry.appointmentId, { status: "completed" });
  }
  await AuditLog.create({ actorId: user.id, action: "queue.complete", targetType: "QueueEntry", targetId: entryId });
  revalidatePath("/queue");
}
