"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/lib/auth/auth";
import { signupSchema } from "@/lib/validation/schemas";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";

export type ActionState = { error?: string } | undefined;

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
