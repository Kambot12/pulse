"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth, signIn } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { AuditLog } from "@/lib/db/models/AuditLog";
import { staffSchema, firstAdminSchema } from "@/lib/validation/schemas";
import type { ActionState } from "./auth";

export interface StaffActionState {
  error?: string;
  tempPassword?: string;
  createdEmail?: string;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") return null;
  return session.user;
}

function genTempPassword() {
  return "Pulse" + crypto.randomBytes(3).toString("hex"); // e.g. Pulse9f3ac1
}

export async function createStaffAction(
  _prev: StaffActionState,
  formData: FormData
): Promise<StaffActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Only an admin can create staff accounts." };

  const parsed = staffSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const email = parsed.data.email.toLowerCase();
  await dbConnect();
  if (await User.findOne({ email })) return { error: "That email is already registered." };

  const tempPassword = genTempPassword();
  await User.create({
    email,
    name: parsed.data.name,
    role: parsed.data.role,
    passwordHash: await bcrypt.hash(tempPassword, 10),
    mustChangePassword: true,
    onboardingComplete: true,
  });

  await AuditLog.create({ actorId: admin.id, action: "staff.create", targetType: "User", targetId: email });
  revalidatePath("/admin/staff");
  return { tempPassword, createdEmail: email };
}

export async function removeStaffAction(userId: string) {
  const admin = await requireAdmin();
  if (!admin || admin.id === userId) return;
  await dbConnect();
  await User.deleteOne({ _id: userId });
  await AuditLog.create({ actorId: admin.id, action: "staff.remove", targetType: "User", targetId: userId });
  revalidatePath("/admin/staff");
}

/** Bootstrap: create the very first admin, only while none exists. */
export async function createFirstAdminAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = firstAdminSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await dbConnect();
  const adminCount = await User.countDocuments({ role: "admin" });
  if (adminCount > 0) return { error: "Setup is already complete. Ask an admin to add you." };

  if (process.env.SETUP_SECRET && parsed.data.secret !== process.env.SETUP_SECRET) {
    return { error: "Invalid setup secret." };
  }

  const email = parsed.data.email.toLowerCase();
  if (await User.findOne({ email })) return { error: "That email is already registered." };

  await User.create({
    email,
    name: parsed.data.name,
    role: "admin",
    passwordHash: await bcrypt.hash(parsed.data.password, 10),
    onboardingComplete: true,
  });
  await AuditLog.create({ action: "admin.bootstrap", targetType: "User", targetId: email });

  await signIn("credentials", { email, password: parsed.data.password, redirectTo: "/admin" });
}
