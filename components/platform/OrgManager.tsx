"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Building2, Copy, Check, Settings2, Power, Star, Plus, X } from "lucide-react";
import { createOrgAction, updateOrgSettingsAction, setOrgActiveAction, setDefaultOrgAction, type PlatformActionState } from "@/lib/actions/platform";
import { SubmitButton } from "@/components/SubmitButton";

export interface OrgRow {
  id: string;
  name: string;
  slug: string;
  joinCode: string;
  emailDomain: string;
  isDefault: boolean;
  active: boolean;
  theme: { brand: string; accent: string; fontKey: string };
  logoDataUri: string;
  students: number;
  staff: number;
}

const FONTS = [
  { key: "geist", label: "Geist (default)" },
  { key: "inter", label: "Inter" },
  { key: "manrope", label: "Manrope" },
  { key: "plus-jakarta", label: "Plus Jakarta Sans" },
];

const MAX_LOGO_BYTES = 200 * 1024;

/** Reads a File into a data URI, or returns "" if too big / invalid. */
function useLogoField() {
  const [logo, setLogo] = useState("");
  const [err, setErr] = useState("");
  const onFile = (file: File | undefined) => {
    setErr("");
    if (!file) return setLogo("");
    if (!file.type.startsWith("image/")) return setErr("Pick an image file.");
    if (file.size > MAX_LOGO_BYTES) return setErr("Logo must be under 200KB.");
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result || ""));
    reader.readAsDataURL(file);
  };
  return { logo, err, onFile, setLogo };
}

export function OrgManager({ orgs }: { orgs: OrgRow[] }) {
  // Only auto-open the create form when there are no institutions yet.
  const [showCreate, setShowCreate] = useState(orgs.length === 0);

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted">Institutions ({orgs.length})</h2>
          <button onClick={() => setShowCreate((v) => !v)} className="btn btn-primary px-3 py-1.5 text-sm">
            {showCreate ? <><X size={15} /> Close</> : <><Plus size={15} /> New institution</>}
          </button>
        </div>
        {orgs.length ? (
          <div className="space-y-3">{orgs.map((o) => <OrgCard key={o.id} org={o} />)}</div>
        ) : (
          <div className="card p-6 text-center text-sm text-muted">No institutions yet. Create your first one.</div>
        )}
      </section>

      {showCreate && <CreateOrgForm />}
    </div>
  );
}

function CreateOrgForm() {
  const [state, action] = useActionState<PlatformActionState, FormData>(createOrgAction, undefined);
  const { logo, err, onFile } = useLogoField();
  const [brand, setBrand] = useState("#0ea5a4");
  const [accent, setAccent] = useState("#6366f1");

  if (state?.ok) {
    return (
      <div className="card space-y-3 p-5">
        <h2 className="text-lg font-bold">Institution created ✅</h2>
        <p className="text-sm text-muted">Share these with the clinic admin (shown once):</p>
        <CredRow label="Admin email" value={state.adminEmail ?? ""} />
        <CredRow label="Temp password" value={state.tempPassword ?? ""} />
        <CredRow label="Student join code" value={state.joinCode ?? ""} />
        <CredRow label="Signup link" value={`/signup?org=${state.slug}`} />
        <button onClick={() => location.reload()} className="btn btn-primary w-full">Create another</button>
      </div>
    );
  }

  return (
    <form action={action} className="card space-y-4 p-5">
      <div className="flex items-center gap-2">
        <Building2 size={18} className="text-brand-ink" />
        <h2 className="text-lg font-bold">New institution</h2>
      </div>
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Institution name</label>
          <input id="name" name="name" required className="input" placeholder="Acme University" />
        </div>
        <div>
          <label className="label" htmlFor="slug">Slug</label>
          <input id="slug" name="slug" required className="input" placeholder="acme" pattern="[a-z0-9\-]{2,32}" />
        </div>
        <div>
          <label className="label" htmlFor="emailDomain">Email domain <span className="font-normal text-muted">(students on it auto-join)</span></label>
          <input id="emailDomain" name="emailDomain" className="input" placeholder="acme.edu" />
        </div>
        <div>
          <label className="label" htmlFor="adminName">First admin name</label>
          <input id="adminName" name="adminName" required className="input" placeholder="Dr. Amina Bello" />
        </div>
        <div>
          <label className="label" htmlFor="adminEmail">First admin email</label>
          <input id="adminEmail" name="adminEmail" type="email" required className="input" placeholder="admin@acme.edu" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ColorField name="brand" label="Brand" value={brand} onChange={setBrand} />
        <ColorField name="accent" label="Accent" value={accent} onChange={setAccent} />
        <div>
          <label className="label" htmlFor="fontKey">Font</label>
          <select id="fontKey" name="fontKey" className="input" defaultValue="geist">
            {FONTS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Preview</label>
          <div className="grid h-[42px] place-items-center rounded-xl text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${brand}, ${accent})` }}>Aa</div>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="logo">Logo (optional, &lt;200KB)</label>
        <input id="logo" type="file" accept="image/*" className="input" onChange={(e) => onFile(e.target.files?.[0])} />
        {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
        {logo && <img src={logo} alt="logo preview" className="mt-2 h-10 w-auto rounded" />}
        <input type="hidden" name="logoDataUri" value={logo} />
      </div>

      <SubmitButton pendingText="Creating…">Create institution</SubmitButton>
    </form>
  );
}

function OrgCard({ org }: { org: OrgRow }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className={`card p-4 ${org.active ? "" : "opacity-60"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {org.logoDataUri
            ? <img src={org.logoDataUri} alt="" className="size-9 rounded-lg object-contain" />
            : <div className="size-9 rounded-lg" style={{ background: `linear-gradient(135deg, ${org.theme.brand}, ${org.theme.accent})` }} />}
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {org.name}
              {org.isDefault && <span className="ml-1.5 pill bg-amber-50 text-amber-700">default</span>}
              {!org.active && <span className="ml-1 text-xs text-muted">(inactive)</span>}
            </p>
            <p className="truncate text-xs text-muted">/{org.slug} · {org.emailDomain || "no domain"} · code {org.joinCode} · {org.students} students · {org.staff} staff</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => startTransition(() => setDefaultOrgAction(org.id))}
            disabled={pending || org.isDefault}
            className="grid size-8 place-items-center rounded-lg text-muted hover:bg-slate-100 disabled:opacity-40"
            title={org.isDefault ? "This is the default institution" : "Set as default (catch-all for unmatched domains)"}
          ><Star size={16} className={org.isDefault ? "fill-amber-400 text-amber-500" : ""} /></button>
          <button onClick={() => setEditing((v) => !v)} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-slate-100" title="Edit settings"><Settings2 size={16} /></button>
          <button
            onClick={() => startTransition(() => setOrgActiveAction(org.id, !org.active))}
            disabled={pending}
            className="grid size-8 place-items-center rounded-lg text-muted hover:bg-slate-100"
            title={org.active ? "Deactivate" : "Activate"}
          ><Power size={16} className={org.active ? "text-emerald-600" : ""} /></button>
        </div>
      </div>

      {editing && <SettingsEditor org={org} onDone={() => setEditing(false)} />}
    </div>
  );
}

function SettingsEditor({ org, onDone }: { org: OrgRow; onDone: () => void }) {
  const [state, action] = useActionState<PlatformActionState, FormData>(updateOrgSettingsAction, undefined);
  const { logo, err, onFile } = useLogoField();
  const [brand, setBrand] = useState(org.theme.brand);
  const [accent, setAccent] = useState(org.theme.accent);
  const formRef = useRef<HTMLFormElement>(null);

  if (state?.ok) { onDone(); if (typeof location !== "undefined") location.reload(); }

  return (
    <form ref={formRef} action={action} className="mt-4 space-y-3 border-t border-line pt-4">
      <input type="hidden" name="orgId" value={org.id} />
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`name-${org.id}`}>Institution name</label>
          <input id={`name-${org.id}`} name="name" required className="input" defaultValue={org.name} />
        </div>
        <div>
          <label className="label" htmlFor={`domain-${org.id}`}>Email domain</label>
          <input id={`domain-${org.id}`} name="emailDomain" className="input" defaultValue={org.emailDomain} placeholder="acme.edu" />
          {org.isDefault && <p className="mt-1 text-xs text-muted">Default institution — also catches Gmail &amp; any unmatched email.</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <ColorField name="brand" label="Brand" value={brand} onChange={setBrand} />
        <ColorField name="accent" label="Accent" value={accent} onChange={setAccent} />
        <div>
          <label className="label" htmlFor={`font-${org.id}`}>Font</label>
          <select id={`font-${org.id}`} name="fontKey" className="input" defaultValue={org.theme.fontKey}>
            {FONTS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Replace logo (optional)</label>
        <input type="file" accept="image/*" className="input" onChange={(e) => onFile(e.target.files?.[0])} />
        {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
        <input type="hidden" name="logoDataUri" value={logo} />
      </div>
      <div className="flex gap-2">
        <SubmitButton pendingText="Saving…">Save settings</SubmitButton>
        <button type="button" onClick={onDone} className="btn btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

function ColorField({ name, label, value, onChange }: { name: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-[42px] w-12 cursor-pointer rounded-lg border border-line" />
        <input name={name} value={value} onChange={(e) => onChange(e.target.value)} className="input font-mono text-xs" />
      </div>
    </div>
  );
}

function CredRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="truncate font-mono text-sm">{value}</p>
      </div>
      <button
        onClick={() => { navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-slate-200"
      >{copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}</button>
    </div>
  );
}
