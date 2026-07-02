/**
 * Condition-aware prescription templates — clinician order-sets. A doctor clicks
 * one to PRE-FILL a prescription row, then confirms/edits. Never auto-prescribed.
 * Educational defaults only; the clinician sets the final dose.
 */
import type { FrequencyKey } from "./schedule";

export interface RxTemplate {
  label: string;
  conditionLabel: string;
  drugKey: string;
  name: string;
  dosage: string;
  frequencyKey: FrequencyKey;
  durationDays?: number;
  instructions: string;
}

const BY_CONDITION: Array<[RegExp, RxTemplate[]]> = [
  [/asthma/i, [
    { label: "Reliever inhaler", conditionLabel: "Asthma", drugKey: "salbutamol", name: "Salbutamol (inhaler)", dosage: "2 puffs", frequencyKey: "as_needed", instructions: "Use when breathless (reliever)" },
    { label: "Steroid short course", conditionLabel: "Asthma", drugKey: "prednisolone", name: "Prednisolone", dosage: "30mg", frequencyKey: "once_daily", durationDays: 5, instructions: "Short course, take with food in the morning" },
  ]],
  [/malaria/i, [
    { label: "ACT (antimalarial)", conditionLabel: "Malaria", drugKey: "act", name: "Artemether–Lumefantrine (ACT)", dosage: "per body weight", frequencyKey: "twice_daily", durationDays: 3, instructions: "Take with fatty food; complete all doses" },
  ]],
  [/typhoid/i, [
    { label: "Ciprofloxacin", conditionLabel: "Typhoid", drugKey: "ciprofloxacin", name: "Ciprofloxacin", dosage: "500mg", frequencyKey: "twice_daily", durationDays: 7, instructions: "Stay hydrated; finish the course" },
  ]],
  [/uti|urinary/i, [
    { label: "Nitrofurantoin", conditionLabel: "UTI", drugKey: "nitrofurantoin", name: "Nitrofurantoin", dosage: "100mg", frequencyKey: "four_times_daily", durationDays: 5, instructions: "Take with food; finish the course" },
  ]],
  [/ulcer|gastritis/i, [
    { label: "Omeprazole", conditionLabel: "Gastritis", drugKey: "omeprazole", name: "Omeprazole", dosage: "20mg", frequencyKey: "once_daily", durationDays: 14, instructions: "Take before breakfast" },
  ]],
  [/hypertension|high blood/i, [
    { label: "Amlodipine", conditionLabel: "Hypertension", drugKey: "amlodipine", name: "Amlodipine", dosage: "5mg", frequencyKey: "once_daily", instructions: "Take at the same time daily" },
  ]],
];

/** Always-available common order-sets. */
export const COMMON_TEMPLATES: RxTemplate[] = [
  { label: "Paracetamol (pain/fever)", conditionLabel: "Common", drugKey: "paracetamol", name: "Paracetamol", dosage: "1g", frequencyKey: "three_times_daily", durationDays: 3, instructions: "For pain or fever" },
  { label: "ORS (rehydration)", conditionLabel: "Common", drugKey: "ors", name: "Oral Rehydration Salts (ORS)", dosage: "1 sachet", frequencyKey: "as_needed", instructions: "After each loose stool" },
];

export function templatesForConditions(conditions: string[] = []): RxTemplate[] {
  const out: RxTemplate[] = [];
  for (const [rx, items] of BY_CONDITION) {
    if (conditions.some((c) => rx.test(c))) out.push(...items);
  }
  return out;
}
