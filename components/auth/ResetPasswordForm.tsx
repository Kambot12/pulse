"use client";

import { useActionState } from "react";
import { resetPasswordAction, type ActionState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { PasswordInput } from "@/components/PasswordInput";

/**
 * Forgot-password step 2: set a new password using the token from the email link.
 * On success the action redirects to /login?reset=1.
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState<ActionState, FormData>(resetPasswordAction, undefined);

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="label" htmlFor="password">New password</label>
        <PasswordInput id="password" name="password" required minLength={8} placeholder="At least 8 characters" autoComplete="new-password" />
      </div>
      <SubmitButton pendingText="Updating…">Set new password</SubmitButton>
    </form>
  );
}
