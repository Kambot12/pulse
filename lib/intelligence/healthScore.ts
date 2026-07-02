/**
 * Deterministic health-score computation. This is the "thinks rationally" core:
 * trustworthy, explainable math that runs with or without the LLM.
 *
 * Score starts from a baseline and is adjusted by medication adherence, active
 * medical conditions, and recent clinic engagement. Always clamped to 0..100.
 */

export interface HealthScoreInput {
  adherenceRate?: number;      // 0..1 (taken / scheduled over last 30 days)
  activeConditions?: number;   // count of chronic conditions
  upcomingAppointment?: boolean;
  daysSinceLastVisit?: number | null;
}

export interface HealthScoreResult {
  score: number;
  band: "excellent" | "good" | "fair" | "attention";
  factors: string[];
}

export function computeHealthScore(input: HealthScoreInput): HealthScoreResult {
  const { adherenceRate, activeConditions = 0, upcomingAppointment, daysSinceLastVisit } = input;
  const factors: string[] = [];
  let score = 82;

  if (typeof adherenceRate === "number") {
    const delta = Math.round((adherenceRate - 0.75) * 40); // +/- up to ~16
    score += delta;
    if (adherenceRate >= 0.9) factors.push("Great medication adherence");
    else if (adherenceRate < 0.6) factors.push("Missed several recent doses");
  }

  if (activeConditions > 0) {
    score -= Math.min(activeConditions * 4, 12);
    factors.push(`${activeConditions} condition${activeConditions > 1 ? "s" : ""} being managed`);
  }

  if (upcomingAppointment) {
    score += 3;
    factors.push("Upcoming check-up scheduled");
  }

  if (typeof daysSinceLastVisit === "number" && daysSinceLastVisit > 180) {
    score -= 5;
    factors.push("No clinic visit in 6+ months");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const band: HealthScoreResult["band"] =
    score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 55 ? "fair" : "attention";

  if (factors.length === 0) factors.push("Baseline healthy profile");

  return { score, band, factors };
}
