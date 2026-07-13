"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth, unstable_update } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { StudentProfile } from "@/lib/db/models/StudentProfile";
import { changePasswordSchema, onboardingSchema } from "@/lib/validation/schemas";
import type { ActionState } from "./auth";

export type AccountActionState = { error?: string; ok?: boolean } | undefined;

export async function changePasswordAction(
  _prev: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await dbConnect();
  const user = await User.findById(session.user.id);
  if (!user) return { error: "Account not found." };

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return { error: "Your current password is incorrect." };

  user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  user.mustChangePassword = false;
  await user.save();

  // refresh the session so the "must change password" banner clears
  await unstable_update({ mustChangePassword: false } as unknown as Parameters<typeof unstable_update>[0]);
  return { ok: true };
}

export async function updateStudentProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = onboardingSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  await dbConnect();
  const clash = await StudentProfile.findOne({
    orgId: session.user.orgId,
    matricNumber: d.matricNumber,
    userId: { $ne: session.user.id },
  });
  if (clash) return { error: "That matric number is already registered to another account." };

  await StudentProfile.findOneAndUpdate(
    { userId: session.user.id },
    {
      name: d.name, matricNumber: d.matricNumber, faculty: d.faculty, department: d.department,
      level: d.level, age: d.age, gender: d.gender, bloodGroup: d.bloodGroup, genotype: d.genotype,
      allergies: d.allergies, medicalConditions: d.medicalConditions, currentMedication: d.currentMedication,
      emergencyContact: { name: d.emergencyContactName, phone: d.emergencyContactPhone, relationship: d.emergencyContactRelationship },
    }
  );

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  redirect("/profile");
}
