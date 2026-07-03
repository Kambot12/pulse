"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { registerWithInviteAction } from "@/lib/actions/staff";
import type { ActionState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";

export function ClinicRegisterForm() {
  const [state, action] = useActionState<ActionState, FormData>(registerWithInviteAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#ecfeff] px-3 py-1 text-xs font-semibold text-brand-ink">
          <Ticket size={14} /> Staff registration
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Create your staff account</h1>
        <p className="mt-1 text-sm text-muted">Enter the invite code your clinic admin gave you.</p>
      </div>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}

      <div>
        <label className="label" htmlFor="code">Invite code</label>
        <input id="code" name="code" required className="input font-mono uppercase tracking-wider" placeholder="e.g. 9F3AC1B2" />
      </div>
      <div>
        <label className="label" htmlFor="name">Full name</label>
        <input id="name" name="name" required className="input" placeholder="e.g. Dr. Amina Bello" />
      </div>
      <div>
        <label className="label" htmlFor="email">Work email</label>
        <input id="email" name="email" type="email" required className="input" placeholder="you@clinic.edu" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required minLength={8} className="input" placeholder="At least 8 characters" />
      </div>

      <SubmitButton pendingText="Creating account…">Create account</SubmitButton>

      <p className="pt-1 text-center text-sm text-muted">
        Already have an account? <Link href="/clinic" className="font-medium text-brand-ink hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
