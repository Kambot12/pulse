import { auth } from "@/lib/auth/auth";
import { verifyPassportToken } from "@/lib/passport/token";
import { dbConnect } from "@/lib/db/connect";
import { AuditLog } from "@/lib/db/models/AuditLog";
import { StudentProfile } from "@/lib/db/models/StudentProfile";

export const runtime = "nodejs";

const CLINIC_ROLES = ["doctor", "reception", "admin", "superadmin"];

/** Clinic-only: turn a scanned passport token into a studentId for the workspace. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !CLINIC_ROLES.includes(session.user.role) || !session.user.orgId) {
    return new Response("Forbidden", { status: 403 });
  }
  const orgId = session.user.orgId;

  const { token } = await req.json().catch(() => ({}));
  const result = verifyPassportToken(String(token ?? ""));
  if (!result.ok) return Response.json({ ok: false, reason: result.reason }, { status: 400 });

  await dbConnect();
  // The scanned student must belong to THIS clinic's institution.
  const inOrg = await StudentProfile.exists({ _id: result.payload.sid, orgId });
  if (!inOrg) return Response.json({ ok: false, reason: "not_in_org" }, { status: 403 });

  await AuditLog.create({
    orgId,
    actorId: session.user.id,
    action: "passport.resolve",
    targetType: "StudentProfile",
    targetId: result.payload.sid,
  });

  return Response.json({ ok: true, studentId: result.payload.sid });
}
