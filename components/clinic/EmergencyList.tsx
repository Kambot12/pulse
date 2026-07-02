"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Phone, Check, CheckCheck, Droplet, Dna, TriangleAlert } from "lucide-react";
import { acknowledgeEmergencyAction, resolveEmergencyAction } from "@/lib/actions/emergency";

interface Alert {
  _id: string;
  status: string;
  createdAt: string;
  note?: string;
  location?: { lat?: number; lng?: number; accuracy?: number };
  criticalSnapshot?: {
    name?: string; matricNumber?: string; bloodGroup?: string; genotype?: string;
    allergies?: string[]; medicalConditions?: string[];
    emergencyContact?: { name?: string; phone?: string; relationship?: string };
  };
}

export function EmergencyList({ alerts }: { alerts: Alert[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  // Live-ish: refresh every 15s to pull new alerts / status changes.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 15_000);
    return () => clearInterval(id);
  }, [router]);

  if (!alerts.length) {
    return (
      <div className="card grid place-items-center p-10 text-center">
        <div className="mb-2 grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Check /></div>
        <p className="font-medium">No active emergencies</p>
        <p className="text-sm text-muted">Incoming SOS alerts will appear here in real time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((a) => {
        const c = a.criticalSnapshot ?? {};
        const loc = a.location;
        const mapUrl = loc?.lat != null ? `https://www.google.com/maps?q=${loc.lat},${loc.lng}` : null;
        return (
          <div key={a._id} className={`card border-2 p-5 ${a.status === "active" ? "border-red-300 bg-red-50" : "border-amber-200 bg-amber-50/40"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`pill ${a.status === "active" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"} capitalize`}>
                    {a.status === "active" ? "🆘 Active" : a.status}
                  </span>
                  <span className="text-xs text-muted">{new Date(a.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-1.5 text-lg font-bold">{c.name ?? "Student"}</p>
                <p className="text-sm text-muted">{c.matricNumber}</p>
              </div>
              {mapUrl && (
                <a href={mapUrl} target="_blank" rel="noreferrer" className="btn btn-ghost px-3 py-2 text-sm">
                  <MapPin size={15} /> Location
                </a>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="pill bg-white"><Droplet size={13} /> {c.bloodGroup || "—"}</span>
              <span className="pill bg-white"><Dna size={13} /> {c.genotype || "—"}</span>
              {c.allergies?.length ? (
                <span className="pill bg-red-100 text-red-700"><TriangleAlert size={13} /> {c.allergies.join(", ")}</span>
              ) : null}
              {c.medicalConditions?.length ? (
                <span className="pill bg-amber-100 text-amber-700">{c.medicalConditions.join(", ")}</span>
              ) : null}
            </div>

            {c.emergencyContact?.phone && (
              <a href={`tel:${c.emergencyContact.phone}`} className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-ink">
                <Phone size={14} /> {c.emergencyContact.name} ({c.emergencyContact.relationship}) · {c.emergencyContact.phone}
              </a>
            )}

            <div className="mt-4 flex gap-2">
              {a.status === "active" && (
                <button disabled={pending} onClick={() => start(() => { acknowledgeEmergencyAction(a._id); })}
                  className="btn btn-primary px-3 py-2 text-sm"><Check size={15} /> Acknowledge</button>
              )}
              <button disabled={pending} onClick={() => start(() => { resolveEmergencyAction(a._id); })}
                className="btn btn-ghost px-3 py-2 text-sm"><CheckCheck size={15} /> Resolve</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
