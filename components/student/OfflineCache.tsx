"use client";

import { useEffect } from "react";
import { saveCache } from "@/lib/offline/db";

/**
 * Persists the latest dashboard snapshot into IndexedDB whenever it renders
 * online, so the same data can be shown instantly and while offline.
 */
export function OfflineCache({ snapshot }: { snapshot: unknown }) {
  useEffect(() => {
    saveCache("dashboard", snapshot).catch(() => {});
  }, [snapshot]);
  return null;
}
