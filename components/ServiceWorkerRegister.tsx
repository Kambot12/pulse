"use client";

import { useEffect, useState } from "react";

/**
 * Registers the Serwist service worker and renders a small offline banner so
 * the student always knows Pulse is still working from its local cache.
 */
export function ServiceWorkerRegister() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-line bg-foreground/90 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur"
    >
      📴 Offline — showing your saved health data
    </div>
  );
}
