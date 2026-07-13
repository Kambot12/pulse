"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/db/connect";
import { Organization } from "@/lib/db/models/Organization";
import { User } from "@/lib/db/models/User";
import { AuditLog } from "@/lib/db/models/AuditLog";
import { orgCreateSchema, orgSettingsSchema } from "@/lib/validation/schemas";
import { isPublicEmailDomain } from "@/lib/constants";

export type PlatformActionState = {
  error?: string;
  ok?: boolean;
  tempPassword?: string;
  adminEmail?: string;
  joinCode?: string;
  slug?: string;
} | undefined;

/** Platform owner only (belongs to no institution). */
async function requireSuperadmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "superadmin") return null;
  return session.user;
}

function genTempPassword() {
  return "Pulse" + crypto.randomBytes(3).toString("hex");
}

/** Darken a #rrggbb hex by `amount` (0..1) for the brand-ink (text) shade. */
function darken(hex: string, amount = 0.3): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = Math.round(((n >> 16) & 255) * (1 - amount));
  const g = Math.round(((n >> 8) & 255) * (1 - amount));
  const b = Math.round((n & 255) * (1 - amount));
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

async function uniqueJoinCode(): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const code = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 chars
    if (!(await Organization.exists({ joinCode: code }))) return code;
  }
  return crypto.randomBytes(5).toString("hex").toUpperCase();
}

/** Create an institution + its first clinic admin. Super-admin only. */
export async function createOrgAction(
  _prev: PlatformActionState,
  formData: FormData
): Promise<PlatformActionState> {
  const su = await requireSuperadmin();
  if (!su) return { error: "Not authorized." };

  const parsed = orgCreateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  await dbConnect();
  if (await Organization.exists({ slug: d.slug })) return { error: "That slug is already taken." };
  if (d.emailDomain && isPublicEmailDomain(d.emailDomain)) {
    return { error: "You can't use a public email domain (like gmail.com) as an institution domain — those go to the default institution." };
  }
  if (d.emailDomain && await Organization.exists({ emailDomain: d.emailDomain })) {
    return { error: "That email domain is already used by another institution." };
  }
  if (await User.findOne({ email: d.adminEmail })) return { error: "That admin email is already registered." };

  // First institution created becomes the default catch-all.
  const isFirst = !(await Organization.exists({}));
  const joinCode = await uniqueJoinCode();
  const org = await Organization.create({
    name: d.name,
    slug: d.slug,
    emailDomain: d.emailDomain || "",
    isDefault: isFirst,
    joinCode,
    theme: { brand: d.brand, brandInk: darken(d.brand), accent: d.accent, fontKey: d.fontKey },
    logoDataUri: d.logoDataUri || "",
    active: true,
  });

  const tempPassword = genTempPassword();
  await User.create({
    orgId: org._id,
    email: d.adminEmail,
    name: d.adminName,
    role: "admin",
    passwordHash: await bcrypt.hash(tempPassword, 10),
    mustChangePassword: true,
    onboardingComplete: true,
  });

  await AuditLog.create({ orgId: org._id, actorId: su.id, action: "platform.createOrg", targetType: "Organization", targetId: String(org._id) });
  revalidatePath("/platform");
  return { ok: true, tempPassword, adminEmail: d.adminEmail, joinCode, slug: d.slug };
}

/** Update an institution's settings — name, email domain + white-label theme. Super-admin only. */
export async function updateOrgSettingsAction(
  _prev: PlatformActionState,
  formData: FormData
): Promise<PlatformActionState> {
  const su = await requireSuperadmin();
  if (!su) return { error: "Not authorized." };

  const parsed = orgSettingsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  await dbConnect();
  if (d.emailDomain && isPublicEmailDomain(d.emailDomain)) {
    return { error: "You can't use a public email domain (like gmail.com) — those go to the default institution." };
  }
  if (d.emailDomain && await Organization.exists({ emailDomain: d.emailDomain, _id: { $ne: d.orgId } })) {
    return { error: "That email domain is already used by another institution." };
  }

  await Organization.updateOne(
    { _id: d.orgId },
    { $set: {
      name: d.name,
      emailDomain: d.emailDomain,
      "theme.brand": d.brand, "theme.brandInk": darken(d.brand), "theme.accent": d.accent, "theme.fontKey": d.fontKey,
      ...(d.logoDataUri ? { logoDataUri: d.logoDataUri } : {}),
    } }
  );
  await AuditLog.create({ actorId: su.id, action: "platform.updateSettings", targetType: "Organization", targetId: d.orgId });
  revalidatePath("/platform");
  return { ok: true };
}

export async function setOrgActiveAction(orgId: string, active: boolean) {
  const su = await requireSuperadmin();
  if (!su) return;
  await dbConnect();
  await Organization.updateOne({ _id: orgId }, { active });
  await AuditLog.create({ actorId: su.id, action: active ? "platform.activateOrg" : "platform.deactivateOrg", targetType: "Organization", targetId: orgId });
  revalidatePath("/platform");
}

/** Make one institution the default catch-all for unmatched email domains. */
export async function setDefaultOrgAction(orgId: string) {
  const su = await requireSuperadmin();
  if (!su) return;
  await dbConnect();
  await Organization.updateMany({ _id: { $ne: orgId } }, { isDefault: false });
  await Organization.updateOne({ _id: orgId }, { isDefault: true });
  await AuditLog.create({ actorId: su.id, action: "platform.setDefaultOrg", targetType: "Organization", targetId: orgId });
  revalidatePath("/platform");
}
