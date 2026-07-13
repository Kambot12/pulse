"use client";

import { useActionState, useState, useTransition } from "react";
import {
  Terminal, LogOut, RefreshCw, Database, Mail, Bell, Bot, Clock, MessageSquare, ShieldCheck,
  CheckCircle2, XCircle, MinusCircle, CircleDot, Play, Sprout, TriangleAlert,
} from "lucide-react";
import {
  sendTestEmailAction, runRemindersAction, seedDemoDataAction, factoryResetAction,
  type DevActionState,
} from "@/lib/dev/actions";
import { logoutAction } from "@/lib/actions/auth";
import type { Diagnostics, Status } from "@/lib/dev/checks";
import { SubmitButton } from "@/components/SubmitButton";

const STATUS_ICON: Record<Status, React.ReactNode> = {
  ok: <CheckCircle2 size={16} className="text-emerald-600" />,
  missing: <MinusCircle size={16} className="text-amber-500" />,
  error: <XCircle size={16} className="text-red-600" />,
  stub: <CircleDot size={16} className="text-slate-400" />,
};
const INT_ICON: Record<string, React.ReactNode> = {
  db: <Database size={16} />, email: <Mail size={16} />, push: <Bell size={16} />, ai: <Bot size={16} />,
  cron: <Clock size={16} />, sms: <MessageSquare size={16} />, secrets: <ShieldCheck size={16} />,
};

export function DevConsole({ data }: { data: Diagnostics }) {
  const [loggingOut, startLogout] = useTransition();

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid size-10 place-items-center rounded-xl bg-slate-900 text-white"><Terminal size={20} /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Developer Console</h1>
            <p className="text-sm text-muted">System diagnostics · {data.totalDocs} documents · {data.system.serverTime.replace("T", " ").slice(0, 19)} UTC</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => location.reload()} className="btn btn-ghost"><RefreshCw size={15} /> Refresh</button>
          <button onClick={() => startLogout(() => logoutAction())} disabled={loggingOut} className="btn btn-ghost"><LogOut size={15} /> Log out</button>
        </div>
      </header>

      {/* System */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Database" value={data.system.dbOk ? "Connected" : "Down"} tone={data.system.dbOk ? "ok" : "err"} />
        <Stat label="DB ping" value={data.system.dbPingMs != null ? `${data.system.dbPingMs} ms` : "—"} />
        <Stat label="Environment" value={data.system.nodeEnv} />
        <Stat label="Node" value={data.system.nodeVersion} />
      </div>

      {/* Integrations */}
      <Section title="Integrations">
        <div className="grid gap-3 sm:grid-cols-2">
          {data.integrations.map((i) => (
            <div key={i.key} className="card flex items-start gap-3 p-4">
              <div className="mt-0.5 text-muted">{INT_ICON[i.key]}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><span className="font-semibold">{i.label}</span> {STATUS_ICON[i.status]}</div>
                <p className="truncate text-xs text-muted">{i.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Env audit */}
      <Section title="Environment variables">
        <div className="card p-4">
          <div className="flex flex-wrap gap-2">
            {data.env.map((e) => (
              <span key={e.name} className={`pill ${e.set ? "bg-emerald-50 text-emerald-700" : e.required ? "bg-red-50 text-red-600" : "bg-slate-100 text-muted"}`}>
                {e.set ? "✓" : e.required ? "✕" : "–"} {e.name}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">Green = set · Red = required &amp; missing · Grey = optional &amp; unset. Values are never shown.</p>
        </div>
      </Section>

      {/* Data counts */}
      <Section title="Data">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {data.counts.map((c) => (
            <div key={c.label} className="card p-3">
              <p className="text-2xl font-extrabold">{c.value}</p>
              <p className="text-[11px] leading-tight text-muted">{c.label}</p>
            </div>
          ))}
        </div>
        {data.usersByRole.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.usersByRole.map((r) => <span key={r.role} className="pill bg-[#ecfeff] text-brand-ink capitalize">{r.role}: {r.count}</span>)}
          </div>
        )}
      </Section>

      {/* Institutions */}
      <Section title={`Institutions (${data.orgs.length})`}>
        {data.orgs.length ? (
          <div className="card divide-y divide-line">
            {data.orgs.map((o) => (
              <div key={o.slug} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div><span className="font-medium">{o.name}</span> <span className="text-muted">/{o.slug}</span></div>
                <div className="flex items-center gap-3 text-muted">
                  <span>{o.students} students</span><span>{o.staff} staff</span>
                  <span className={`pill ${o.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-muted"}`}>{o.active ? "active" : "inactive"}</span>
                </div>
              </div>
            ))}
          </div>
        ) : <Empty>No institutions.</Empty>}
      </Section>

      {/* Recent activity */}
      <Section title="Recent activity">
        {data.activity.length ? (
          <div className="card divide-y divide-line text-sm">
            {data.activity.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2">
                <span className="font-mono text-xs">{a.action}</span>
                <span className="truncate text-xs text-muted">{a.actor} · {new Date(a.at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : <Empty>No audit activity yet.</Empty>}
      </Section>

      {/* Tools */}
      <Section title="Tools">
        <div className="grid gap-3 lg:grid-cols-3">
          <TestEmailTool />
          <RunButtonTool label="Run reminder cron" desc="Send any due medication reminders now." icon={<Play size={15} />} action={runRemindersAction} />
          <RunButtonTool label="Seed demo data" desc="Create a Demo University with sample students." icon={<Sprout size={15} />} action={seedDemoDataAction} />
        </div>
      </Section>

      {/* Danger zone */}
      <DangerZone />
    </div>
  );
}

function TestEmailTool() {
  const [state, action] = useActionState<DevActionState, FormData>(sendTestEmailAction, undefined);
  return (
    <form action={action} className="card space-y-2 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold"><Mail size={15} /> Send test email</div>
      <input name="to" type="email" required className="input" placeholder="you@example.com" />
      <SubmitButton pendingText="Sending…">Send</SubmitButton>
      {state?.ok && <p className="text-xs text-emerald-700">{state.message}</p>}
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

function RunButtonTool({ label, desc, icon, action }: { label: string; desc: string; icon: React.ReactNode; action: () => Promise<DevActionState> }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<DevActionState>();
  return (
    <div className="card space-y-2 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">{icon} {label}</div>
      <p className="text-xs text-muted">{desc}</p>
      <button onClick={() => start(async () => setState(await action()))} disabled={pending} className="btn btn-ghost w-full">
        {pending ? "Running…" : "Run"}
      </button>
      {state?.ok && <p className="text-xs text-emerald-700">{state.message}</p>}
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
    </div>
  );
}

function DangerZone() {
  const [state, action] = useActionState<DevActionState, FormData>(factoryResetAction, undefined);
  return (
    <section className="mt-8">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-600"><TriangleAlert size={16} /> Danger zone</h2>
      <form action={action} className="card space-y-3 border-red-200 bg-red-50/40 p-4">
        <p className="text-sm text-muted">
          <strong className="text-foreground">Factory reset</strong> deletes <strong>every document in every collection</strong> —
          all institutions, users, students, records. This cannot be undone. Recreate the super-admin at <span className="font-mono">/setup</span> afterward.
        </p>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="label" htmlFor="confirm">Type <span className="font-mono">RESET</span> to confirm</label>
            <input id="confirm" name="confirm" className="input" placeholder="RESET" autoComplete="off" />
          </div>
          <SubmitButton pendingText="Wiping…">Wipe everything</SubmitButton>
        </div>
        {state?.ok && <p className="text-xs text-emerald-700">{state.message}</p>}
        {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      </form>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-semibold text-muted">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "err" }) {
  return (
    <div className={`card p-4 ${tone === "err" ? "border-red-200 bg-red-50" : ""}`}>
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className={`mt-1 truncate text-lg font-bold ${tone === "ok" ? "text-emerald-600" : tone === "err" ? "text-red-600" : ""}`}>{value}</p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="card p-4 text-sm text-muted">{children}</div>;
}
