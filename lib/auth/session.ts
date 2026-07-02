import { auth } from "./auth";
import { dbConnect } from "@/lib/db/connect";
import { StudentProfile, type StudentProfileDoc } from "@/lib/db/models/StudentProfile";
import { toPlain } from "@/lib/utils";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Returns the signed-in student's profile as a plain object, or null. */
export async function getCurrentStudentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  await dbConnect();
  const profile = await StudentProfile.findOne({ userId: user.id }).lean<StudentProfileDoc>();
  return profile ? toPlain(profile) : null;
}

/** Returns the signed-in student's StudentProfile id as a string, or null. */
export async function getCurrentStudentId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  await dbConnect();
  const profile = await StudentProfile.findOne({ userId: user.id }).select("_id").lean<{ _id: unknown }>();
  return profile ? String(profile._id) : null;
}
