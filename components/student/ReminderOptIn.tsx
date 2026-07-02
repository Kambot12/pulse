"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type State = "checking" | "unsupported" | "no-sw" | "ready" | "enabled" | "denied" | "busy";

export function ReminderOptIn() {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    (async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        return setState("unsupported");
      }
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return setState("no-sw"); // SW only active in the production/installed app
      if (Notification.permission === "denied") return setState("denied");
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "enabled" : "ready");
    })();
  }, []);

  const enable = async () => {
    setState("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setState("denied");
      const reg = await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) return setState("no-sw");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      setState("enabled");
    } catch {
      setState("ready");
    }
  };

  const disable = async () => {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("ready");
    } catch {
      setState("enabled");
    }
  };

  if (state === "checking" || state === "unsupported") return null;

  return (
    <div className="card flex items-center justify-between gap-3 p-4">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-[#ecfeff] text-brand-ink">
          {state === "enabled" ? <BellRing size={18} /> : <Bell size={18} />}
        </div>
        <div>
          <p className="text-sm font-semibold">Dose reminders</p>
          <p className="text-xs text-muted">
            {state === "enabled" && "On — you'll be reminded even when the app is closed."}
            {state === "ready" && "Get notified when it's time to take your medication."}
            {state === "denied" && "Notifications are blocked in your browser settings."}
            {state === "no-sw" && "Install Pulse (Add to Home Screen) to enable background reminders."}
            {state === "busy" && "Working…"}
          </p>
        </div>
      </div>

      {state === "ready" && (
        <button onClick={enable} className="btn btn-primary px-3 py-2 text-sm">Enable</button>
      )}
      {state === "enabled" && (
        <button onClick={disable} className="btn btn-ghost px-3 py-2 text-sm text-muted"><BellOff size={15} /> Turn off</button>
      )}
      {state === "busy" && <Loader2 className="animate-spin text-muted" size={18} />}
    </div>
  );
}
