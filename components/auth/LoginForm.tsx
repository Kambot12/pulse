"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type ActionState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { PasswordInput } from "@/components/PasswordInput";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<ActionState, FormData>(loginAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Log in to your Pulse health passport.</p>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}

      <input type="hidden" name="next" value={next ?? "/dashboard"} />
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="input" placeholder="you@university.edu" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <PasswordInput id="password" name="password" required placeholder="••••••••" autoComplete="current-password" />
      </div>

      <SubmitButton pendingText="Logging in…">Log in</SubmitButton>

      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-brand-ink hover:underline">Forgot password?</Link>
        <Link href="/signup" className="text-brand-ink hover:underline">Create account</Link>
      </div>
      <p className="border-t border-line pt-3 text-center text-sm text-muted">
        Clinic staff? <Link href="/clinic" className="font-medium text-brand-ink hover:underline">Sign in here</Link>
      </p>
    </form>
  );
}
