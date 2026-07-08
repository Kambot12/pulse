"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/lib/auth/auth";
import { signupSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation/schemas";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { PasswordResetToken } from "@/lib/db/models/PasswordResetToken";
import { sendEmail } from "@/lib/notify/email";

export type ActionState = { error?: string } | undefined;
export type ResetRequestState = { ok?: boolean; error?: string } | undefined;

const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export async function signupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const email = parsed.data.email.toLowerCase();
  const { password } = parsed.data;

  await dbConnect();
  const existing = await User.findOne({ email });
  if (existing) return { error: "That email is already registered. Try logging in." };

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ email, passwordHash, role: "student" });

  // signIn throws a redirect on success (NEXT_REDIRECT) — let it propagate.
  await signIn("credentials", { email, password, redirectTo: "/onboarding" });
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const next = formData.get("next")?.toString() || "/dashboard";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: next,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error; // re-throw NEXT_REDIRECT and others
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

/**
 * Step 1 of reset: email a one-time link. Always returns the same success state
 * whether or not the email exists, so it never reveals who has an account.
 */
export async function requestPasswordResetAction(
  _prev: ResetRequestState,
  formData: FormData
): Promise<ResetRequestState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const email = parsed.data.email.toLowerCase();
  await dbConnect();
  const user = await User.findOne({ email });

  if (user && !user.disabled) {
    // Invalidate any outstanding reset tokens for this user before issuing a new one.
    await PasswordResetToken.deleteMany({ userId: user._id, usedAt: null });

    const rawToken = crypto.randomBytes(32).toString("hex");
    await PasswordResetToken.create({
      userId: user._id,
      tokenHash: sha256(rawToken),
      expiresAt: new Date(Date.now() + 60 * 60_000), // valid for 1 hour
    });

    const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
    const link = `${base}/reset-password?token=${rawToken}`;

    const delivery = await sendEmail({
      to: email,
      subject: "Reset your Pulse password",
      text: `Reset your Pulse password using this link (valid for 1 hour):\n\n${link}\n\nIf you didn't request this, you can safely ignore this email.`,
      html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#0f172a">Reset your Pulse password</h2>
        <p style="color:#475569">Click the button below to choose a new password. This link is valid for 1 hour.</p>
        <p style="margin:24px 0">
          <a href="${link}" style="background:linear-gradient(135deg,#0ea5a4,#6366f1);color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">Reset password</a>
        </p>
        <p style="color:#94a3b8;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
      </div>`,
    });

    // If delivery didn't succeed (no provider, or Resend test-mode rejecting a
    // non-verified recipient), log the link so an operator can still retrieve it
    // and password reset isn't fully blocked while email is being set up.
    if (!delivery.ok) {
      console.warn(`[password-reset] email not delivered via "${delivery.provider}". Reset link for ${email}: ${link}`);
    }
  }

  // Neutral response regardless of whether the account exists.
  return { ok: true };
}

/**
 * Step 2 of reset: consume the token and set the new password. Redirects to login
 * on success (the redirect throws NEXT_REDIRECT, which propagates).
 */
export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { token, password } = parsed.data;
  await dbConnect();

  const record = await PasswordResetToken.findOne({ tokenHash: sha256(token), usedAt: null });
  if (!record || record.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired. Please request a new one." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.updateOne({ _id: record.userId }, { $set: { passwordHash, mustChangePassword: false } });
  record.usedAt = new Date();
  await record.save();

  redirect("/login?reset=1");
}
