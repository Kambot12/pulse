"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { changePasswordAction, type AccountActionState } from "@/lib/actions/account";
import { SubmitButton } from "@/components/SubmitButton";
import { PasswordInput } from "@/components/PasswordInput";

export function ChangePasswordForm() {
  const [state, action] = useActionState<AccountActionState, FormData>(changePasswordAction, undefined);

  return (
    <form action={action} className="space-y-4">
      {state?.ok && (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <CheckCircle2 size={16} /> Password updated.
        </p>
      )}
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
      <div>
        <label className="label" htmlFor="currentPassword">Current password</label>
        <PasswordInput id="currentPassword" name="currentPassword" required placeholder="••••••••" autoComplete="current-password" />
      </div>
      <div>
        <label className="label" htmlFor="newPassword">New password</label>
        <PasswordInput id="newPassword" name="newPassword" required minLength={8} placeholder="At least 8 characters" autoComplete="new-password" />
      </div>
      <SubmitButton pendingText="Updating…">Update password</SubmitButton>
    </form>
  );
}
