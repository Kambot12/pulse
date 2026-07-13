"use client";

import { useEffect } from "react";
import { saveCache } from "@/lib/offline/db";
import type { EmergencyData } from "@/components/emergency/EmergencyCard";

/** Persists the student's emergency card so in-app Emergency Mode works offline. */
export function EmergencyCacheWriter({ data }: { data: EmergencyData }) {
  useEffect(() => {
    saveCache("emergency", data).catch(() => {});
  }, [data]);
  return null;
}
