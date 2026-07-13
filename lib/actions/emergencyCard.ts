"use server";

import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db/connect";
import { getCurrentStudentId } from "@/lib/auth/session";
import { StudentProfile } from "@/lib/db/models/StudentProfile";
import { genEmergencyCode } from "@/lib/emergency/code";

/** Rotate the student's break-glass link (revokes the old /e/<code>). */
export async function regenerateEmergencyCodeAction() {
  const studentId = await getCurrentStudentId();
  if (!studentId) return;
  await dbConnect();
  let code = genEmergencyCode();
  for (let i = 0; i < 6; i++) {
    if (!(await StudentProfile.exists({ emergencyCode: code }))) break;
    code = genEmergencyCode();
  }
  await StudentProfile.updateOne({ _id: studentId }, { emergencyCode: code });
  revalidatePath("/passport");
}
