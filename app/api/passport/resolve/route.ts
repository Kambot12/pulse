import { auth } from "@/lib/auth/auth";
import { verifyPassportToken } from "@/lib/passport/token";
import { dbConnect } from "@/lib/db/connect";
import { AuditLog } from "@/lib/db/models/AuditLog";

export const runtime = "nodejs";

const CLINIC_ROLES = ["doctor", "reception", "admin"];

/** Clinic-only: turn a scanned passport token into a studentId for the workspace. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !CLINIC_ROLES.includes(session.user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const { token } = await req.json().catch(() => ({}));
  const result = verifyPassportToken(String(token ?? ""));
  if (!result.ok) return Response.json({ ok: false, reason: result.reason }, { status: 400 });

  await dbConnect();
  await AuditLog.create({
    actorId: session.user.id,
    action: "passport.resolve",
    targetType: "StudentProfile",
    targetId: result.payload.sid,
  });

  return Response.json({ ok: true, studentId: result.payload.sid });
}
