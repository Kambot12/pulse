/**
 * Deterministic wellness rules — the safety-gated part of the intelligence layer.
 * These run first and are always trustworthy; the LLM only adds educational
 * colour on top. Each rule returns a card the dashboard can render.
 */

export interface WellnessSignal {
  id: string;
  tone: "info" | "warn" | "ok" | "danger";
  icon: string;
  title: string;
  body: string;
}

export interface ProfileSignalsInput {
  medicalConditions?: string[];
  allergies?: string[];
  genotype?: string;
  hour?: number; // local hour, for time-based nudges
  airQualityPoor?: boolean; // fed from a weather/AQI source when online
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function buildWellnessSignals(input: ProfileSignalsInput): WellnessSignal[] {
  const conditions = (input.medicalConditions ?? []).map((c) => c.toLowerCase());
  const signals: WellnessSignal[] = [];

  const hasAsthma = conditions.some((c) => c.includes("asthma"));
  if (hasAsthma && input.airQualityPoor) {
    signals.push({
      id: "asthma-air",
      tone: "warn",
      icon: "🌫️",
      title: "Air quality alert",
      body: "Air quality is poor today. Keep your inhaler close and limit strenuous outdoor activity.",
    });
  }

  if (input.genotype === "SS" || input.genotype === "SC") {
    signals.push({
      id: "sickle-hydration",
      tone: "info",
      icon: "💧",
      title: "Stay well hydrated",
      body: "With your genotype, staying hydrated and avoiding extreme temperatures helps prevent a crisis.",
    });
  }

  // Universal hydration nudge (rules always give the student something useful)
  signals.push({
    id: "hydration",
    tone: "info",
    icon: "🥤",
    title: "Hydration reminder",
    body: "Aim for 6–8 glasses of water today. Small sips through the day beat one big gulp.",
  });

  return signals;
}

const HEALTH_TIPS = [
  "A 10-minute walk between lectures boosts focus and circulation.",
  "Aim for 7–8 hours of sleep — it's when your body repairs itself.",
  "Wash your hands often during exam season to avoid campus colds.",
  "Swap one sugary drink for water today.",
  "Stretch for 2 minutes every hour you study.",
];

export function tipOfTheDay(seed = new Date().getDate()): string {
  return HEALTH_TIPS[seed % HEALTH_TIPS.length];
}
