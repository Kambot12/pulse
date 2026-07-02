"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { onboardingSchema } from "@/lib/validation/schemas";
import { dbConnect } from "@/lib/db/connect";
import { StudentProfile } from "@/lib/db/models/StudentProfile";
import { User } from "@/lib/db/models/User";
import type { ActionState } from "./auth";

export async function onboardingAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = onboardingSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const d = parsed.data;

  await dbConnect();

  // matric number must be unique across students
  const clash = await StudentProfile.findOne({
    matricNumber: d.matricNumber,
    userId: { $ne: session.user.id },
  });
  if (clash) return { error: "That matric number is already registered." };

  await StudentProfile.findOneAndUpdate(
    { userId: session.user.id },
    {
      userId: session.user.id,
      name: d.name,
      matricNumber: d.matricNumber,
      faculty: d.faculty,
      department: d.department,
      level: d.level,
      age: d.age,
      gender: d.gender,
      bloodGroup: d.bloodGroup,
      genotype: d.genotype,
      allergies: d.allergies,
      medicalConditions: d.medicalConditions,
      currentMedication: d.currentMedication,
      emergencyContact: {
        name: d.emergencyContactName,
        phone: d.emergencyContactPhone,
        relationship: d.emergencyContactRelationship,
      },
      onboardingComplete: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await User.findByIdAndUpdate(session.user.id, { onboardingComplete: true });

  redirect("/dashboard");
}
