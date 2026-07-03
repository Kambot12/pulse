"use client";

import { useActionState } from "react";
import { createFirstAdminAction } from "@/lib/actions/staff";
import type { ActionState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";

export function FirstAdminForm() {
  const [state, action] = useActionState<ActionState, FormData>(createFirstAdminAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Set up your clinic</h1>
        <p className="mt-1 text-sm text-muted">Create the first admin account for your university clinic.</p>
      </div>
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
      <div>
        <label className="label" htmlFor="name">Your name</label>
        <input id="name" name="name" required className="input" placeholder="e.g. Dr. Amina Bello" />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="input" placeholder="admin@university.edu" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required minLength={8} className="input" placeholder="At least 8 characters" />
      </div>
      <div>
        <label className="label" htmlFor="secret">Setup secret <span className="font-normal text-muted">(only if configured)</span></label>
        <input id="secret" name="secret" className="input" placeholder="Leave blank if not set" />
      </div>
      <SubmitButton pendingText="Creating admin…">Create admin &amp; continue</SubmitButton>
    </form>
  );
}
