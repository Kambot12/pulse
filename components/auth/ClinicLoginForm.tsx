"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { loginAction, type ActionState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";

export function ClinicLoginForm() {
  const [state, action] = useActionState<ActionState, FormData>(loginAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#ecfeff] px-3 py-1 text-xs font-semibold text-brand-ink">
          <Stethoscope size={14} /> Pulse for Clinics
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Clinic staff sign-in</h1>
        <p className="mt-1 text-sm text-muted">For doctors, reception &amp; administrators.</p>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}

      {/* Staff land in the clinic dashboard */}
      <input type="hidden" name="next" value="/doctor" />
      <div>
        <label className="label" htmlFor="email">Work email</label>
        <input id="email" name="email" type="email" required className="input" placeholder="you@clinic.edu" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required className="input" placeholder="••••••••" />
      </div>

      <SubmitButton pendingText="Signing in…">Sign in to clinic</SubmitButton>

      <div className="space-y-1 pt-1 text-center text-sm">
        <p className="text-muted">No account? Ask your clinic admin to create one.</p>
        <p><Link href="/login" className="text-brand-ink hover:underline">I&apos;m a student →</Link></p>
      </div>
    </form>
  );
}
