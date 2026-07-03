"use client";

import { useState, useTransition } from "react";
import { Ticket, Plus, Trash2, Copy, Check, Loader2 } from "lucide-react";
import { createInviteAction, revokeInviteAction } from "@/lib/actions/staff";

interface Invite { id: string; code: string; role: string; expiresAt: string; uses: number }

export function InviteManager({ invites }: { invites: Invite[] }) {
  const [role, setRole] = useState("doctor");
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (code: string) => {
    navigator.clipboard?.writeText(code).then(() => { setCopied(code); setTimeout(() => setCopied(null), 1500); }).catch(() => {});
  };

  return (
    <div className="card space-y-3 p-5">
      <p className="flex items-center gap-2 font-semibold"><Ticket size={16} /> Invite codes</p>
      <p className="text-sm text-muted">Generate a code and share it — staff self-register with it at <span className="font-mono">/clinic/register</span>. Codes expire in 30 days.</p>

      <div className="flex gap-2">
        <select value={role} onChange={(e) => setRole(e.target.value)} className="input max-w-[160px]">
          <option value="doctor">Doctor</option>
          <option value="reception">Reception</option>
          <option value="admin">Admin</option>
        </select>
        <button disabled={pending} onClick={() => start(() => { createInviteAction(role); })} className="btn btn-primary">
          {pending ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Generate code
        </button>
      </div>

      {invites.length > 0 && (
        <div className="space-y-2 pt-1">
          {invites.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between gap-2 rounded-xl border border-line p-3">
              <div className="flex items-center gap-2">
                <code className="rounded bg-slate-100 px-2 py-1 font-mono font-bold tracking-wider">{inv.code}</code>
                <button onClick={() => copy(inv.code)} className="btn btn-ghost px-2 py-1.5" title="Copy">
                  {copied === inv.code ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="pill bg-[#ecfeff] capitalize text-brand-ink">{inv.role}</span>
                <span>{inv.uses} used</span>
                <span className="hidden sm:inline">· exp {new Date(inv.expiresAt).toLocaleDateString()}</span>
                <button disabled={pending} onClick={() => start(() => { revokeInviteAction(inv.id); })} className="btn btn-ghost px-2 py-1.5 text-red-600" title="Revoke">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
