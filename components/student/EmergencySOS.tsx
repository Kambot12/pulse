"use client";

import { useRef, useState, useTransition } from "react";
import { Siren, Phone, Loader2, CheckCircle2 } from "lucide-react";
import { triggerEmergencyAction } from "@/lib/actions/emergency";

const HOLD_MS = 1200;
const EMERGENCY_LINE = "112"; // national emergency number

function getPosition(): Promise<{ lat: number; lng: number; accuracy: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60_000 }
    );
  });
}

export function EmergencySOS({ emergencyContact }: { emergencyContact?: { name?: string; phone?: string } }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(0);

  const clear = () => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
  };

  const fire = () => {
    clear();
    setProgress(100);
    start(async () => {
      const loc = await getPosition();
      const res = await triggerEmergencyAction({ lat: loc?.lat, lng: loc?.lng, accuracy: loc?.accuracy });
      setStatus(res.ok ? "sent" : "error");
      setProgress(0);
    });
  };

  const beginHold = () => {
    if (pending || status === "sent") return;
    progressRef.current = 0;
    const step = 40;
    timer.current = setInterval(() => {
      progressRef.current += (step / HOLD_MS) * 100;
      if (progressRef.current >= 100) {
        setProgress(100);
        fire(); // called from the interval callback, not during render
      } else {
        setProgress(progressRef.current);
      }
    }, step);
  };

  const cancelHold = () => {
    clear();
    progressRef.current = 0;
    if (status !== "sent" && !pending) setProgress(0);
  };

  if (status === "sent") {
    return (
      <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-5">
        <p className="flex items-center gap-2 font-bold text-red-700"><CheckCircle2 size={18} /> Help is on the way</p>
        <p className="mt-1 text-sm text-red-700/90">
          The campus clinic has been alerted with your location and critical medical info. Stay where you are if it&apos;s safe.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {emergencyContact?.phone && (
            <a href={`tel:${emergencyContact.phone}`} className="btn btn-primary">
              <Phone size={16} /> Call {emergencyContact.name || "contact"}
            </a>
          )}
          <a href={`tel:${EMERGENCY_LINE}`} className="btn btn-ghost text-red-600">
            <Phone size={16} /> Call {EMERGENCY_LINE}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4">
      <button
        onPointerDown={beginHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        disabled={pending}
        className="relative w-full overflow-hidden rounded-xl bg-red-600 px-4 py-4 text-white transition active:scale-[0.99]"
      >
        <span
          className="absolute inset-y-0 left-0 bg-red-800/60 transition-[width] duration-75"
          style={{ width: `${progress}%` }}
          aria-hidden
        />
        <span className="relative flex items-center justify-center gap-2 font-bold">
          {pending ? <><Loader2 className="animate-spin" size={18} /> Alerting clinic…</>
            : <><Siren size={18} /> Hold to send Emergency SOS</>}
        </span>
      </button>
      <p className="mt-2 text-center text-xs text-red-700/80">
        Press &amp; hold. Shares your location + critical medical info with the campus clinic.
        For life-threatening emergencies also call {EMERGENCY_LINE}.
      </p>
      {status === "error" && <p className="mt-1 text-center text-xs text-red-700">Couldn&apos;t send — please call {EMERGENCY_LINE}.</p>}
    </div>
  );
}
