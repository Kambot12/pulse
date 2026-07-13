import { auth } from "./auth";
import { dbConnect } from "@/lib/db/connect";
import { StudentProfile, type StudentProfileDoc } from "@/lib/db/models/StudentProfile";
import { toPlain } from "@/lib/utils";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export interface OrgContext {
  userId: string;
  orgId: string;
  role: string;
}

/**
 * Tenant context for the signed-in user. Returns null if not signed in or if the
 * user has no org (e.g. the platform super-admin). Every tenant-scoped query and
 * mutation must filter/stamp with this `orgId` so institutions stay isolated.
 */
export async function requireOrg(): Promise<OrgContext | null> {
  const user = await getCurrentUser();
  if (!user?.id || !user.orgId) return null;
  return { userId: user.id, orgId: user.orgId, role: user.role };
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

/**
 * Signed-in student's id AND their org, in one query. Use in student actions so
 * every create/query can be stamped/scoped with the correct `orgId`.
 */
export async function getCurrentStudentContext(): Promise<{ studentId: string; orgId: string } | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  await dbConnect();
  const profile = await StudentProfile.findOne({ userId: user.id })
    .select("_id orgId").lean<{ _id: unknown; orgId: unknown }>();
  if (!profile?.orgId) return null;
  return { studentId: String(profile._id), orgId: String(profile.orgId) };
}
