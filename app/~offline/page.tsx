import type { Metadata } from "next";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Offline — Pulse" };

// Must be fully static so it can be precached and served with no network.
export const dynamic = "force-static";

/**
 * Branded offline fallback. The service worker serves this for any navigation
 * that fails while offline and isn't already cached (see app/sw.ts fallbacks).
 * Keep it self-contained: no auth, no data fetching, no dynamic imports.
 */
export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 py-12 text-center">
      <div className="mx-auto max-w-sm space-y-6">
        <div className="flex justify-center"><Logo /></div>

        <div className="brand-gradient mx-auto grid size-16 place-items-center rounded-2xl text-3xl">
          📴
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">You&apos;re offline</h1>
          <p className="text-sm text-muted">
            This page needs a connection and isn&apos;t saved on your device yet.
            Your <strong className="text-foreground">Health Passport</strong> and{" "}
            <strong className="text-foreground">medication reminders</strong> still work offline —
            everything else will sync once you&apos;re back online.
          </p>
        </div>

        <div className="space-y-3">
          {/* Reload attempts the network again; if online, the real page loads. */}
          <a href="/dashboard" className="btn btn-primary w-full">Try again</a>
          <a href="/passport" className="btn btn-ghost w-full">Open my passport</a>
        </div>

        <p className="text-xs text-muted">
          Tip: reconnect for a moment to sync new prescriptions, appointments and records.
        </p>
      </div>
    </main>
  );
}
