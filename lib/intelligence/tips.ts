/**
 * Personalized daily wellness tip — deterministic (rules-first) so it's instant on
 * the dashboard with no LLM call. Tailored by the student's conditions/genotype and
 * medication adherence. (Optional Gemini enrichment can be layered on later.)
 */
export interface TipContext {
  conditions?: string[];
  genotype?: string;
  adherencePct?: number; // 0–100, recent dose adherence
}

export interface Tip {
  title: string;
  body: string;
}

const GENERAL: Tip[] = [
  { title: "Stay hydrated", body: "Aim for around 2 litres of water today — a bit more in the heat or after sport." },
  { title: "Guard against malaria", body: "Sleep under a treated net and clear any stagnant water around your hostel." },
  { title: "Rest well", body: "Aim for 7–8 hours of sleep; it's one of the biggest boosts to your immune system." },
  { title: "Eat regularly", body: "Try not to skip meals — steady meals keep your energy and focus up during lectures." },
  { title: "Wash your hands", body: "A quick hand-wash before meals cuts your risk of typhoid and diarrhoeal illness." },
  { title: "Move a little", body: "A short walk between classes helps your mood, circulation, and concentration." },
];

export function dailyTip(ctx: TipContext): Tip {
  const conds = (ctx.conditions ?? []).map((c) => c.toLowerCase());
  const priority: Tip[] = [];

  if ((ctx.adherencePct ?? 100) < 70) {
    priority.push({ title: "Keep your streak", body: "Your recent dose adherence dipped — taking your meds on time keeps your health score up." });
  }
  if (conds.some((c) => c.includes("asthma"))) {
    priority.push({ title: "Asthma care", body: "Keep your reliever inhaler handy and steer clear of dust and smoke today." });
  }
  if (conds.some((c) => c.includes("sickle")) || ["SS", "SC"].includes(ctx.genotype ?? "")) {
    priority.push({ title: "Sickle-cell care", body: "Drink water regularly, avoid getting too cold, and don't over-exert — it helps prevent a crisis." });
  }
  if (conds.some((c) => c.includes("ulcer") || c.includes("gastritis"))) {
    priority.push({ title: "Gentle on your stomach", body: "Eat small regular meals and avoid painkillers like ibuprofen on an empty stomach." });
  }
  if (conds.some((c) => c.includes("diabet"))) {
    priority.push({ title: "Steady sugars", body: "Keep meals regular and carry a quick snack in case your sugar dips between classes." });
  }

  // Deterministic per-day rotation so it feels fresh but stable within a day.
  const day = new Date().getDate();
  if (priority.length) return priority[day % priority.length];
  return GENERAL[day % GENERAL.length];
}
