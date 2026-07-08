"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction, type ResetRequestState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";

/**
 * Forgot-password step 1: request a reset link. Always shows the same success
 * message so it never reveals whether an email is registered.
 */
export default function ForgotPasswordPage() {
  const [state, action] = useActionState<ResetRequestState, FormData>(
    requestPasswordResetAction,
    undefined
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
        <p className="mt-1 text-sm text-muted">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {state?.ok ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          If an account exists for that email, a reset link is on its way. Check your inbox
          (and spam). The link is valid for 1 hour.
        </p>
      ) : (
        <form action={action} className="space-y-4">
          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
          )}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required className="input" placeholder="you@university.edu" />
          </div>
          <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
        </form>
      )}

      <p className="text-center text-sm text-muted">
        <Link href="/login" className="text-brand-ink hover:underline">Back to login</Link>
      </p>
    </div>
  );
}
