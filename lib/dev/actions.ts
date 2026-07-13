"use server";

import crypto from "crypto";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/db/connect";
import { Organization } from "@/lib/db/models/Organization";
import { User } from "@/lib/db/models/User";
import { StudentProfile } from "@/lib/db/models/StudentProfile";
import { sendEmail } from "@/lib/notify/email";
import { runDueReminders } from "@/lib/reminders/run";

export type DevActionState = { error?: string; ok?: boolean; message?: string } | undefined;

/** Only the env-based developer session may run console tools. */
async function guard(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === "developer";
}

// ---- Tools ----

export async function sendTestEmailAction(_prev: DevActionState, formData: FormData): Promise<DevActionState> {
  if (!(await guard())) return { error: "Not authorized." };
  const to = String(formData.get("to") ?? "").trim();
  if (!to) return { error: "Enter a recipient address." };

  const res = await sendEmail({
    to,
    subject: "Pulse developer console — test email",
    text: "This is a test email from the Pulse developer console. If you received it, email delivery works.",
    html: "<p>This is a <b>test email</b> from the Pulse developer console. If you received it, email delivery works ✅</p>",
  });
  return res.ok
    ? { ok: true, message: `Sent via ${res.provider} to ${to}.` }
    : { error: res.skipped ? "No email provider configured (SMTP_* not set) — nothing sent." : `Delivery failed via ${res.provider}.` };
}

export async function runRemindersAction(): Promise<DevActionState> {
  if (!(await guard())) return { error: "Not authorized." };
  const r = await runDueReminders();
  return { ok: true, message: `Checked ${r.checkedMeds} active course(s); sent ${r.sent} reminder(s).` };
}

export async function seedDemoDataAction(): Promise<DevActionState> {
  if (!(await guard())) return { error: "Not authorized." };
  await dbConnect();

  const slug = "demo";
  if (await Organization.exists({ slug })) return { error: "Demo institution already exists." };

  const org = await Organization.create({
    name: "Demo University", slug, joinCode: crypto.randomBytes(3).toString("hex").toUpperCase(),
    theme: { brand: "#0ea5a4", brandInk: "#0b6b6a", accent: "#6366f1", fontKey: "geist" }, active: true,
  });

  const tempPassword = "Demo" + crypto.randomBytes(3).toString("hex");
  const adminEmail = "admin@demo.edu";
  await User.create({
    orgId: org._id, email: adminEmail, name: "Demo Admin", role: "admin",
    passwordHash: await bcrypt.hash(tempPassword, 10), mustChangePassword: true, onboardingComplete: true,
  });

  // Two demo students with completed profiles.
  const demoStudents = [
    { email: "ada@demo.edu", name: "Ada Obi", matric: "DEMO/001", blood: "O+", geno: "AA" },
    { email: "bola@demo.edu", name: "Bola Ade", matric: "DEMO/002", blood: "A+", geno: "AS" },
  ];
  for (const s of demoStudents) {
    const u = await User.create({
      orgId: org._id, email: s.email, name: s.name, role: "student",
      passwordHash: await bcrypt.hash("password123", 10), onboardingComplete: true,
    });
    await StudentProfile.create({
      orgId: org._id, userId: u._id, name: s.name, matricNumber: s.matric,
      bloodGroup: s.blood, genotype: s.geno, onboardingComplete: true,
    });
  }

  revalidatePath("/dev");
  return { ok: true, message: `Demo University created. Admin ${adminEmail} / ${tempPassword}. Students use password "password123".` };
}

// ---- Danger zone ----

export async function factoryResetAction(_prev: DevActionState, formData: FormData): Promise<DevActionState> {
  if (!(await guard())) return { error: "Not authorized." };
  if (String(formData.get("confirm") ?? "") !== "RESET") {
    return { error: 'Type RESET to confirm.' };
  }

  await dbConnect();
  const db = mongoose.connection.db;
  if (!db) return { error: "No database connection." };

  const cols = await db.collections();
  let cleared = 0;
  for (const c of cols) {
    const res = await c.deleteMany({});
    cleared += res.deletedCount ?? 0;
  }

  revalidatePath("/dev");
  return { ok: true, message: `Wiped ${cleared} document(s) across ${cols.length} collection(s). Recreate the super-admin at /setup.` };
}
