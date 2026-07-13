import "server-only";
import crypto from "crypto";
import { dbConnect } from "@/lib/db/connect";
import { StudentProfile } from "@/lib/db/models/StudentProfile";
import { AuditLog } from "@/lib/db/models/AuditLog";
import { pushToUserIds } from "@/lib/push";

export function genEmergencyCode(): string {
  return crypto.randomBytes(6).toString("base64url"); // ~8 url-safe chars
}

/** Ensure the student has a stable break-glass code; returns it. Safe to call during render. */
export async function ensureEmergencyCode(profileId: string): Promise<string> {
  await dbConnect();
  const existing = await StudentProfile.findById(profileId).select("emergencyCode").lean<{ emergencyCode?: string }>();
  if (existing?.emergencyCode) return existing.emergencyCode;
  for (let i = 0; i < 6; i++) {
    const code = genEmergencyCode();
    if (await StudentProfile.exists({ emergencyCode: code })) continue;
    await StudentProfile.updateOne({ _id: profileId }, { emergencyCode: code });
    return code;
  }
  return "";
}

/** Audit a break-glass access and notify the student their emergency card was viewed. */
export async function notifyCardAccessed(
  profile: { _id: unknown; userId?: unknown; orgId?: unknown },
  actorLabel: string,
  ip = ""
): Promise<void> {
  await AuditLog.create({
    orgId: profile.orgId,
    action: "emergency.cardView",
    actorLabel,
    targetType: "StudentProfile",
    targetId: String(profile._id),
    ip,
  });
  if (profile.userId) {
    await pushToUserIds([profile.userId], {
      title: "🩺 Emergency card viewed",
      body: `Your emergency health card was opened just now (${actorLabel}).`,
      url: "/passport",
      tag: `cardview-${Date.now()}`,
    }).catch(() => {});
  }
}
