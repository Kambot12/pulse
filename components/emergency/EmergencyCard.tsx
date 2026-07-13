"use client";

import { useState } from "react";
import { Siren, Droplet, Dna, Activity, Phone, TriangleAlert, Pill, ChevronDown, PhoneCall, WifiOff } from "lucide-react";
import { EMERGENCY_LINE } from "@/lib/constants";
import { firstAidFor, GENERAL_STEPS, FIRST_AID_DISCLAIMER } from "@/lib/emergency/firstAid";

export interface EmergencyData {
  name: string;
  matricNumber?: string;
  bloodGroup?: string;
  genotype?: string;
  age?: number;
  allergies?: string[];
  medicalConditions?: string[];
  currentMedication?: string[];
  emergencyContact?: { name?: string; phone?: string; relationship?: string };
}

export function EmergencyCard({ data, offline = false }: { data: EmergencyData; offline?: boolean }) {
  const sections = firstAidFor(data);
  const [open, setOpen] = useState<string | null>(null);
  const contactPhone = data.emergencyContact?.phone;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header */}
      <div className="rounded-2xl bg-red-600 p-5 text-white">
        <div className="flex items-center gap-2 text-sm font-semibold text-white/90"><Siren size={16} /> EMERGENCY HEALTH CARD</div>
        <h1 className="mt-1 text-2xl font-bold">{data.name}</h1>
        {data.matricNumber ? <p className="text-white/80">{data.matricNumber}</p> : null}
        {offline && <p className="mt-1 flex items-center gap-1.5 text-xs text-white/80"><WifiOff size={12} /> Offline — showing saved card</p>}
      </div>

      {/* Call buttons — biggest, first */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {contactPhone && (
          <a href={`tel:${contactPhone}`} className="btn btn-primary py-3 text-base">
            <PhoneCall size={18} /> Call {data.emergencyContact?.name || "emergency contact"}
          </a>
        )}
        <a href={`tel:${EMERGENCY_LINE}`} className={`btn py-3 text-base ${contactPhone ? "btn-ghost text-red-600" : "btn-primary"}`}>
          <Phone size={18} /> Call {EMERGENCY_LINE}
        </a>
      </div>

      {/* Critical strip */}
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<Droplet size={14} />} label="Blood" value={data.bloodGroup || "—"} />
        <Stat icon={<Dna size={14} />} label="Genotype" value={data.genotype || "—"} />
        <Stat icon={<Activity size={14} />} label="Age" value={data.age ? String(data.age) : "—"} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Panel icon={<TriangleAlert size={16} />} title="Allergies" items={data.allergies} tone="red" />
        <Panel icon={<Activity size={16} />} title="Conditions" items={data.medicalConditions} tone="amber" />
        <Panel icon={<Pill size={16} />} title="Current medication" items={data.currentMedication} tone="sky" />
        {data.emergencyContact?.name && (
          <div className="card p-4">
            <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-muted"><Phone size={16} /> Emergency contact</p>
            <p className="font-medium">{data.emergencyContact.name}{data.emergencyContact.relationship ? ` · ${data.emergencyContact.relationship}` : ""}</p>
            {contactPhone ? <a href={`tel:${contactPhone}`} className="text-sm font-semibold text-brand-ink">{contactPhone}</a> : null}
          </div>
        )}
      </div>

      {/* First aid */}
      <div className="card p-5">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-red-600"><Siren size={16} /> First aid</p>
        <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm">
          {GENERAL_STEPS.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
        <div className="space-y-2">
          {sections.map((sec) => (
            <div key={sec.key} className={`overflow-hidden rounded-xl border ${sec.urgent ? "border-red-200" : "border-line"}`}>
              <button
                onClick={() => setOpen(open === sec.key ? null : sec.key)}
                className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm font-semibold ${sec.urgent ? "bg-red-50 text-red-700" : "bg-slate-50"}`}
              >
                <span>{sec.title}</span>
                <ChevronDown size={16} className={`shrink-0 transition ${open === sec.key ? "rotate-180" : ""}`} />
              </button>
              {open === sec.key && (
                <div className="px-4 py-3">
                  <p className="mb-2 text-xs text-muted">{sec.when}</p>
                  <ol className="list-decimal space-y-1 pl-5 text-sm">
                    {sec.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted">{FIRST_AID_DISCLAIMER}</p>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-muted">{icon} {label}</div>
      <p className="mt-0.5 truncate text-lg font-bold">{value}</p>
    </div>
  );
}

function Panel({ icon, title, items, tone }: { icon: React.ReactNode; title: string; items?: string[]; tone: "red" | "amber" | "sky" }) {
  const toneClass = { red: "bg-red-50 text-red-600", amber: "bg-amber-50 text-amber-700", sky: "bg-sky-50 text-sky-700" }[tone];
  return (
    <div className="card p-4">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted">{icon} {title}</p>
      {items?.length ? (
        <div className="flex flex-wrap gap-2">{items.map((i) => <span key={i} className={`pill ${toneClass}`}>{i}</span>)}</div>
      ) : <p className="text-sm text-muted">None recorded</p>}
    </div>
  );
}
