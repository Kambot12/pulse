/**
 * Deterministic medication scheduling — turns a human frequency + duration into
 * concrete dose times, an end date, and the full list of dose slots for a course.
 * Pure functions, no deps. This is part of the "thinks rationally" layer.
 */

export const FREQUENCIES = [
  { key: "once_daily", label: "Once daily", times: ["09:00"] },
  { key: "twice_daily", label: "Twice daily", times: ["08:00", "20:00"] },
  { key: "three_times_daily", label: "3 times daily", times: ["08:00", "14:00", "20:00"] },
  { key: "four_times_daily", label: "4 times daily", times: ["08:00", "12:00", "16:00", "20:00"] },
  { key: "every_6h", label: "Every 6 hours", times: ["06:00", "12:00", "18:00", "00:00"] },
  { key: "every_8h", label: "Every 8 hours", times: ["06:00", "14:00", "22:00"] },
  { key: "every_12h", label: "Every 12 hours", times: ["08:00", "20:00"] },
  { key: "as_needed", label: "As needed", times: [] },
] as const;

export type FrequencyKey = (typeof FREQUENCIES)[number]["key"];

const BY_KEY = new Map(FREQUENCIES.map((f) => [f.key, f]));

export function generateTimes(frequencyKey: string): string[] {
  return [...(BY_KEY.get(frequencyKey as FrequencyKey)?.times ?? [])];
}

export function frequencyLabel(frequencyKey: string): string {
  return BY_KEY.get(frequencyKey as FrequencyKey)?.label ?? "Custom";
}

export function dosesPerDay(frequencyKey: string): number {
  return BY_KEY.get(frequencyKey as FrequencyKey)?.times.length ?? 0;
}

const DAY_MS = 86_400_000;

/** Local (not UTC) YYYY-MM-DD — stable for users in any timezone. */
const iso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export function todayISO(): string {
  return iso(new Date());
}

export function addDays(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T00:00:00`);
  d.setDate(d.getDate() + days);
  return iso(d);
}

/** Inclusive end date: a 7-day course starting today ends on day 7 (today + 6). */
export function computeEndDate(startDateISO: string, durationDays?: number | null): string | null {
  if (!durationDays || durationDays < 1) return null;
  return addDays(startDateISO, durationDays - 1);
}

export interface Course {
  active: boolean;
  totalDays: number | null;
  dayNumber: number | null; // 1-based day within the course (null = ongoing/as-needed)
  percentElapsed: number | null;
  finished: boolean;
}

/** Course progress for display + auto-finish decisions. */
export function courseProgress(startDateISO: string, endDateISO?: string | null, today = iso(new Date())): Course {
  if (!endDateISO) {
    return { active: true, totalDays: null, dayNumber: null, percentElapsed: null, finished: false };
  }
  const start = new Date(`${startDateISO}T00:00:00`).getTime();
  const end = new Date(`${endDateISO}T00:00:00`).getTime();
  const now = new Date(`${today}T00:00:00`).getTime();
  const totalDays = Math.round((end - start) / DAY_MS) + 1;
  const dayNumber = Math.min(totalDays, Math.max(1, Math.round((now - start) / DAY_MS) + 1));
  const finished = now > end;
  return {
    active: !finished,
    totalDays,
    dayNumber: finished ? totalDays : dayNumber,
    percentElapsed: Math.min(100, Math.round((dayNumber / totalDays) * 100)),
    finished,
  };
}

export interface DoseSlot {
  dateISO: string;
  time: string; // HH:mm
  at: Date;
}

/** All dose datetimes for a medication between [from, to] (inclusive), bounded by the course. */
export function doseSlots(
  med: { schedule?: string[]; startDate?: string | null; endDate?: string | null },
  from: Date,
  to: Date
): DoseSlot[] {
  const times = med.schedule ?? [];
  if (!times.length) return [];

  const rangeStart = new Date(Math.max(
    new Date(`${iso(from)}T00:00:00`).getTime(),
    med.startDate ? new Date(`${med.startDate}T00:00:00`).getTime() : -Infinity
  ));
  const rangeEnd = new Date(Math.min(
    new Date(`${iso(to)}T23:59:59`).getTime(),
    med.endDate ? new Date(`${med.endDate}T23:59:59`).getTime() : Infinity
  ));

  const slots: DoseSlot[] = [];
  for (let d = new Date(iso(rangeStart)); d.getTime() <= rangeEnd.getTime(); d.setDate(d.getDate() + 1)) {
    const dateISO = iso(d);
    for (const time of times) {
      const [hh, mm] = time.split(":").map(Number);
      const at = new Date(`${dateISO}T00:00:00`);
      at.setHours(hh, mm, 0, 0);
      if (at.getTime() >= rangeStart.getTime() && at.getTime() <= rangeEnd.getTime()) {
        slots.push({ dateISO, time, at });
      }
    }
  }
  return slots;
}
