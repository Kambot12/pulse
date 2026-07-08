"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

// Chrome/Edge/Android fire this before showing their own install UI; we capture
// it so we can trigger install from our own button instead.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pulse-install-dismissed";

/**
 * "Download / install the app" prompt. On Android + desktop it's a real one-tap
 * install (via beforeinstallprompt). On iPhone (Safari blocks that event) it
 * shows Add-to-Home-Screen instructions instead. Hides itself once installed or
 * dismissed. Mounted globally in the root layout.
 */
export function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    // Already installed / running as an installed app → never show.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(iOS);
    if (iOS) setHidden(false); // iOS has no prompt event — show manual instructions

    const onPrompt = (e: Event) => {
      e.preventDefault(); // stop Chrome's default mini-infobar
      setDeferred(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    const onInstalled = () => setHidden(true);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
  };

  const onClick = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      setDeferred(null);
      if (outcome === "accepted") setHidden(true);
    } else if (isIOS) {
      setShowIOSHelp(true);
    }
  };

  if (hidden) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:bottom-4">
        <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-lg">
          <div className="brand-gradient grid size-10 shrink-0 place-items-center rounded-xl text-white">
            <Download size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight">Install Pulse</p>
            <p className="truncate text-xs text-muted">Add to your device — works offline.</p>
          </div>
          <button onClick={onClick} className="btn btn-primary shrink-0 px-3 py-1.5 text-sm">
            {isIOS && !deferred ? "How" : "Install"}
          </button>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {showIOSHelp && (
        <div
          className="fixed inset-0 z-50 grid place-items-end sm:place-items-center"
          onClick={() => setShowIOSHelp(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative m-4 w-full max-w-sm space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold">Add Pulse to your Home Screen</h2>
            <ol className="space-y-3 text-sm text-muted">
              <li className="flex items-center gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-foreground">1</span>
                Tap the <Share size={15} className="inline" /> <strong className="text-foreground">Share</strong> button in Safari&apos;s toolbar.
              </li>
              <li className="flex items-center gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-foreground">2</span>
                Scroll and tap <strong className="text-foreground">Add to Home Screen</strong>.
              </li>
              <li className="flex items-center gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-foreground">3</span>
                Tap <strong className="text-foreground">Add</strong> — open Pulse from its icon for full offline mode &amp; reminders.
              </li>
            </ol>
            <button onClick={() => setShowIOSHelp(false)} className="btn btn-primary w-full">Got it</button>
          </div>
        </div>
      )}
    </>
  );
}
