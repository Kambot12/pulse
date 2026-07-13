"use client";

import { useState, useTransition } from "react";
import { ShieldAlert, Copy, Check, RefreshCw, Download } from "lucide-react";
import { regenerateEmergencyCodeAction } from "@/lib/actions/emergencyCard";

export function LockScreenSetup({ emergencyUrl, emergencyQr }: { emergencyUrl: string; emergencyQr: string }) {
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="card p-5">
      <div className="mb-1 flex items-center gap-2">
        <ShieldAlert size={18} className="text-red-600" />
        <h2 className="text-base font-bold">Lock-screen emergency access</h2>
      </div>
      <p className="mb-4 text-sm text-muted">
        Set this up so anyone can reach your critical info + first aid in an emergency — even from your locked phone.
      </p>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        {emergencyQr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={emergencyQr} alt="Emergency QR" className="size-40 shrink-0 rounded-xl border border-line" />
        ) : null}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
            <span className="min-w-0 flex-1 truncate font-mono text-xs">{emergencyUrl}</span>
            <button
              onClick={() => { navigator.clipboard?.writeText(emergencyUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="grid size-7 shrink-0 place-items-center rounded-md text-muted hover:bg-slate-200"
              aria-label="Copy link"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <a href={emergencyQr} download="pulse-emergency-qr.png" className="btn btn-ghost px-3 py-1.5 text-sm">
              <Download size={14} /> Save QR
            </a>
            <button
              onClick={() => start(() => regenerateEmergencyCodeAction())}
              disabled={pending}
              className="btn btn-ghost px-3 py-1.5 text-sm"
            >
              <RefreshCw size={14} className={pending ? "animate-spin" : ""} /> Reset link
            </button>
          </div>
        </div>
      </div>

      <ol className="mt-4 space-y-2 text-sm text-muted">
        <li><strong className="text-foreground">Wallpaper:</strong> save the QR and set it as your lock-screen wallpaper — a responder scans it.</li>
        <li><strong className="text-foreground">iPhone gesture:</strong> Settings → Accessibility → Touch → <em>Back Tap</em> → Double Tap → run a Shortcut that opens this link.</li>
        <li><strong className="text-foreground">Built-in Medical ID:</strong> add your critical info + this link to your phone&apos;s Medical ID / Emergency Info (it shows on the lock screen).</li>
      </ol>
      <p className="mt-3 text-[11px] text-muted">Anyone with this link sees your critical card + first aid (not your full history). Access is logged and you&apos;re notified. Reset the link anytime.</p>
    </div>
  );
}
