"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Forgot-password UI. Wiring the reset email requires a mail provider (Resend /
 * SES) — a Phase 5 task. The form intentionally always shows the same message so
 * it never reveals whether an email is registered.
 */
export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
        <p className="mt-1 text-sm text-muted">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {sent ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          If an account exists for that email, a reset link is on its way.
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="space-y-4"
        >
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" required className="input" placeholder="you@university.edu" />
          </div>
          <button type="submit" className="btn btn-primary w-full">Send reset link</button>
        </form>
      )}

      <p className="text-center text-sm text-muted">
        <Link href="/login" className="text-brand-ink hover:underline">Back to login</Link>
      </p>
    </div>
  );
}
