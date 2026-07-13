"use client";

import { useCallback, useEffect, useState } from "react";
import { Siren, X, Phone } from "lucide-react";
import { readCache } from "@/lib/offline/db";
import { EmergencyCard, type EmergencyData } from "@/components/emergency/EmergencyCard";
import { EMERGENCY_LINE } from "@/lib/constants";

/**
 * Global quick-access Emergency Mode for students. Opens via the floating button
 * OR a shake gesture, and renders the emergency card from the offline cache so it
 * works with no signal. (A web app can't open from the OS lock screen — that's the
 * lock-screen QR / Back-Tap setup on the passport page.)
 */
export function EmergencyMode() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<EmergencyData | null>(null);
  const [offline, setOffline] = useState(false);

  const openMode = useCallback(async () => {
    // iOS needs a user-gesture permission for motion — request it on this tap so shake works after.
    try {
      const DME = window.DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
      if (DME && typeof DME.requestPermission === "function") await DME.requestPermission();
    } catch { /* ignore */ }
    const cached = await readCache<EmergencyData>("emergency");
    if (cached?.data) setData(cached.data);
    setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    setOpen(true);
  }, []);

  // Shake to open (best-effort; iOS enables after the first button tap grants permission).
  useEffect(() => {
    let lastShake = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.abs(a.x ?? 0) + Math.abs(a.y ?? 0) + Math.abs(a.z ?? 0);
      const now = Date.now();
      if (mag > 32 && now - lastShake > 1500) {
        lastShake = now;
        void openMode();
      }
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [openMode]);

  return (
    <>
      <button
        onClick={openMode}
        className="fixed bottom-20 right-4 z-30 flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700 md:bottom-6"
        aria-label="Open emergency card"
      >
        <Siren size={16} /> Emergency
      </button>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
          <div className="mx-auto max-w-2xl px-4 py-6">
            <div className="mb-3 flex justify-end">
              <button onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full bg-slate-100" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            {data ? (
              <EmergencyCard data={data} offline={offline} />
            ) : (
              <div className="mx-auto max-w-md space-y-4 py-10 text-center">
                <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-600"><Siren size={28} /></div>
                <p className="text-sm text-muted">Open Pulse online once to save your emergency card for offline use.</p>
                <a href={`tel:${EMERGENCY_LINE}`} className="btn btn-primary"><Phone size={16} /> Call {EMERGENCY_LINE}</a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
