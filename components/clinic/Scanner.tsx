"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraOff, Loader2 } from "lucide-react";

/**
 * Clinic-side QR scanner. Reads a student's Health Passport QR, resolves the
 * signed token to a studentId (clinic-only), and opens the patient workspace.
 */
export function Scanner() {
  const regionId = "pulse-scan-region";
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [manual, setManual] = useState("");
  const stopRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode(regionId);
        stopRef.current = () => scanner.stop().catch(() => {});
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            if (cancelled) return;
            cancelled = true;
            scanner.stop().catch(() => {});
            open(decodedText);
          },
          () => {}
        );
      } catch {
        setError("Camera unavailable. Use manual entry below.");
      }
    })();
    return () => { cancelled = true; stopRef.current?.(); };
  }, []);

  const extractToken = (text: string): string => {
    try { return new URL(text).searchParams.get("token") ?? ""; } catch { return text.trim(); }
  };

  const open = async (text: string) => {
    const token = extractToken(text);
    if (!token) return setError("Couldn't read that QR code.");
    setResolving(true);
    setError(null);
    try {
      const res = await fetch("/api/passport/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.ok) {
        router.push(`/patient/${data.studentId}`);
      } else {
        setResolving(false);
        setError(data.reason === "expired" ? "This passport has expired — ask the student to refresh it." : "Invalid passport code.");
      }
    } catch {
      setResolving(false);
      setError("Network error — please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Scan passport</h1>
        <p className="text-sm text-muted">Point at the student&apos;s QR code to open their record.</p>
      </div>

      <div id={regionId} className="overflow-hidden rounded-2xl border border-line bg-black/5" />

      {resolving && (
        <p className="flex items-center justify-center gap-1.5 text-sm text-brand-ink">
          <Loader2 className="animate-spin" size={15} /> Opening patient record…
        </p>
      )}
      {error && (
        <p className="flex items-center justify-center gap-1.5 text-sm text-amber-600">
          <CameraOff size={15} /> {error}
        </p>
      )}

      <div className="card p-4">
        <label className="label" htmlFor="manual">Or paste a passport token</label>
        <div className="flex gap-2">
          <input id="manual" className="input" value={manual} onChange={(e) => setManual(e.target.value)}
            placeholder="paste token…" />
          <button className="btn btn-primary" onClick={() => manual && open(manual)}>Open</button>
        </div>
      </div>
    </div>
  );
}
