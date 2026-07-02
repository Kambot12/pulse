"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Droplet, Dna, TriangleAlert, Phone, WifiOff } from "lucide-react";
import { saveCache, readCache } from "@/lib/offline/db";

interface Critical {
  name: string;
  matricNumber: string;
  bloodGroup: string;
  genotype: string;
  allergies: string[];
  emergencyContact: { name?: string; phone?: string; relationship?: string } | null;
}

interface PassportData {
  qrDataUrl: string;
  critical: Critical;
}

export function PassportView(props: PassportData) {
  const [data, setData] = useState<PassportData | null>(props.qrDataUrl ? props : null);
  const [fromCache, setFromCache] = useState(false);

  // Cache the freshly-issued passport for offline use.
  useEffect(() => {
    if (props.qrDataUrl) saveCache("passport", props).catch(() => {});
  }, [props]);

  // If we somehow rendered without data (e.g. offline client navigation), hydrate from cache.
  useEffect(() => {
    if (!props.qrDataUrl) {
      readCache<PassportData>("passport").then((c) => {
        if (c?.data) {
          setData(c.data);
          setFromCache(true);
        }
      });
    }
  }, [props.qrDataUrl]);

  if (!data) {
    return <p className="text-sm text-muted">Loading your passport…</p>;
  }

  const c = data.critical;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Health Passport</h1>
        <p className="text-sm text-muted">Show this at the clinic to check in instantly.</p>
      </div>

      {fromCache && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-amber-600">
          <WifiOff size={13} /> Offline — showing your saved passport
        </p>
      )}

      {/* QR card */}
      <div className="card animate-fade-up overflow-hidden">
        <div className="brand-gradient px-5 py-4 text-white">
          <p className="text-lg font-bold">{c.name}</p>
          <p className="text-sm text-white/80">{c.matricNumber}</p>
        </div>
        <div className="grid place-items-center p-6">
          <Image src={data.qrDataUrl} alt="Health passport QR code" width={240} height={240}
            className="rounded-xl" unoptimized />
          <p className="mt-3 text-center text-xs text-muted">
            Secure, signed &amp; time-limited. Scanning reveals your records only to clinic staff.
          </p>
        </div>
      </div>

      {/* Critical info (what a paramedic needs) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted"><Droplet size={14} /> Blood group</div>
          <p className="mt-1 text-xl font-bold">{c.bloodGroup}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted"><Dna size={14} /> Genotype</div>
          <p className="mt-1 text-xl font-bold">{c.genotype}</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted"><TriangleAlert size={14} /> Allergies</div>
        {c.allergies.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {c.allergies.map((a) => (
              <span key={a} className="pill bg-red-50 text-red-600">{a}</span>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted">None recorded</p>
        )}
      </div>

      {c.emergencyContact?.phone && (
        <div className="card p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted"><Phone size={14} /> Emergency contact</div>
          <p className="mt-1 font-medium">{c.emergencyContact.name} · {c.emergencyContact.relationship}</p>
          <a href={`tel:${c.emergencyContact.phone}`} className="text-sm text-brand-ink">{c.emergencyContact.phone}</a>
        </div>
      )}
    </div>
  );
}
