/**
 * Curated reference library of common medications (Sub-Saharan campus context).
 * EDUCATIONAL ONLY — used to auto-fill sensible defaults and show side-effects /
 * cautions. Pulse never decides treatment; a clinician's prescription does.
 */
import type { FrequencyKey } from "./schedule";

export type DrugClass =
  | "penicillin" | "cephalosporin" | "sulfonamide" | "macrolide" | "quinolone"
  | "nsaid" | "analgesic" | "antimalarial" | "antibiotic" | "antihistamine"
  | "ppi" | "supplement" | "ors" | "other";

export type WithFood = "before" | "after" | "with" | "any";

export interface DrugInfo {
  key: string;
  name: string;
  aliases: string[];
  drugClass: DrugClass;
  defaultFrequencyKey: FrequencyKey;
  withFood: WithFood;
  typicalCourseDays?: number;
  commonSideEffects: string[];
  cautions: string[];
}

export const DRUG_LIBRARY: DrugInfo[] = [
  { key: "paracetamol", name: "Paracetamol", aliases: ["acetaminophen", "panadol"], drugClass: "analgesic",
    defaultFrequencyKey: "three_times_daily", withFood: "any", commonSideEffects: ["Rare when used as directed"],
    cautions: ["Do not exceed 4g/day", "Avoid extra paracetamol in other cold/flu meds"] },
  { key: "ibuprofen", name: "Ibuprofen", aliases: ["brufen", "advil"], drugClass: "nsaid",
    defaultFrequencyKey: "three_times_daily", withFood: "after", commonSideEffects: ["Stomach upset", "Heartburn"],
    cautions: ["Take after food", "Caution with asthma, ulcers or kidney issues"] },
  { key: "diclofenac", name: "Diclofenac", aliases: ["voltaren", "cataflam"], drugClass: "nsaid",
    defaultFrequencyKey: "twice_daily", withFood: "after", commonSideEffects: ["Stomach upset"],
    cautions: ["Take after food", "Caution with asthma or ulcers"] },
  { key: "aspirin", name: "Aspirin", aliases: ["acetylsalicylic acid"], drugClass: "nsaid",
    defaultFrequencyKey: "once_daily", withFood: "after", commonSideEffects: ["Stomach irritation"],
    cautions: ["Avoid under 16 years", "Caution with asthma or bleeding"] },
  { key: "amoxicillin", name: "Amoxicillin", aliases: ["amoxil"], drugClass: "penicillin",
    defaultFrequencyKey: "three_times_daily", withFood: "any", typicalCourseDays: 7,
    commonSideEffects: ["Diarrhoea", "Nausea", "Rash"], cautions: ["Finish the full course", "Avoid if penicillin-allergic"] },
  { key: "amoxiclav", name: "Amoxicillin–Clavulanate", aliases: ["augmentin", "co-amoxiclav"], drugClass: "penicillin",
    defaultFrequencyKey: "twice_daily", withFood: "with", typicalCourseDays: 7,
    commonSideEffects: ["Diarrhoea", "Nausea"], cautions: ["Take with food", "Avoid if penicillin-allergic", "Finish the course"] },
  { key: "ampicillin", name: "Ampicillin", aliases: [], drugClass: "penicillin",
    defaultFrequencyKey: "four_times_daily", withFood: "before", typicalCourseDays: 7,
    commonSideEffects: ["Diarrhoea", "Rash"], cautions: ["Avoid if penicillin-allergic", "Finish the course"] },
  { key: "azithromycin", name: "Azithromycin", aliases: ["zithromax", "azithro"], drugClass: "macrolide",
    defaultFrequencyKey: "once_daily", withFood: "any", typicalCourseDays: 3,
    commonSideEffects: ["Nausea", "Stomach upset"], cautions: ["Usually a short 3-day course", "Finish the course"] },
  { key: "erythromycin", name: "Erythromycin", aliases: [], drugClass: "macrolide",
    defaultFrequencyKey: "four_times_daily", withFood: "after", typicalCourseDays: 7,
    commonSideEffects: ["Nausea", "Stomach cramps"], cautions: ["Take after food"] },
  { key: "ciprofloxacin", name: "Ciprofloxacin", aliases: ["cipro", "ciprotab"], drugClass: "quinolone",
    defaultFrequencyKey: "twice_daily", withFood: "any", typicalCourseDays: 5,
    commonSideEffects: ["Nausea", "Dizziness"], cautions: ["Avoid dairy/antacids around the dose", "Stay hydrated"] },
  { key: "metronidazole", name: "Metronidazole", aliases: ["flagyl"], drugClass: "antibiotic",
    defaultFrequencyKey: "three_times_daily", withFood: "after", typicalCourseDays: 7,
    commonSideEffects: ["Metallic taste", "Nausea"], cautions: ["Do NOT drink alcohol during and 48h after", "Take after food"] },
  { key: "cotrimoxazole", name: "Cotrimoxazole", aliases: ["septrin", "bactrim", "sulfamethoxazole-trimethoprim"], drugClass: "sulfonamide",
    defaultFrequencyKey: "twice_daily", withFood: "after", typicalCourseDays: 5,
    commonSideEffects: ["Nausea", "Rash"], cautions: ["Avoid if sulfa-allergic", "Drink plenty of water"] },
  { key: "act", name: "Artemether–Lumefantrine (ACT)", aliases: ["coartem", "lonart", "artemether", "lumefantrine"], drugClass: "antimalarial",
    defaultFrequencyKey: "twice_daily", withFood: "with", typicalCourseDays: 3,
    commonSideEffects: ["Headache", "Dizziness", "Loss of appetite"], cautions: ["Take with fatty food/milk for absorption", "Complete all doses"] },
  { key: "chloramphenicol", name: "Chloramphenicol", aliases: [], drugClass: "antibiotic",
    defaultFrequencyKey: "four_times_daily", withFood: "before", typicalCourseDays: 7,
    commonSideEffects: ["Nausea"], cautions: ["Use only as prescribed"] },
  { key: "loratadine", name: "Loratadine", aliases: ["clarityne"], drugClass: "antihistamine",
    defaultFrequencyKey: "once_daily", withFood: "any", commonSideEffects: ["Mild drowsiness (uncommon)"],
    cautions: ["Non-drowsy for most people"] },
  { key: "chlorpheniramine", name: "Chlorpheniramine", aliases: ["piriton"], drugClass: "antihistamine",
    defaultFrequencyKey: "three_times_daily", withFood: "any", commonSideEffects: ["Drowsiness", "Dry mouth"],
    cautions: ["May cause drowsiness — avoid driving"] },
  { key: "omeprazole", name: "Omeprazole", aliases: ["losec"], drugClass: "ppi",
    defaultFrequencyKey: "once_daily", withFood: "before", commonSideEffects: ["Headache", "Nausea"],
    cautions: ["Best taken 30 min before breakfast"] },
  { key: "ors", name: "Oral Rehydration Salts (ORS)", aliases: ["oral rehydration", "salt sugar solution"], drugClass: "ors",
    defaultFrequencyKey: "as_needed", withFood: "any", commonSideEffects: [],
    cautions: ["Sip after each loose stool", "Seek care if severe dehydration"] },
  { key: "ferrous", name: "Ferrous Sulphate (Iron)", aliases: ["iron tablet", "ferrous"], drugClass: "supplement",
    defaultFrequencyKey: "once_daily", withFood: "after", commonSideEffects: ["Dark stools", "Constipation"],
    cautions: ["Take with vitamin C for absorption"] },
  { key: "salbutamol", name: "Salbutamol (inhaler)", aliases: ["ventolin", "albuterol"], drugClass: "other",
    defaultFrequencyKey: "as_needed", withFood: "any", commonSideEffects: ["Shakiness", "Fast heartbeat"],
    cautions: ["Reliever — use when breathless", "Seek help if needing it very often"] },
  { key: "prednisolone", name: "Prednisolone", aliases: ["prednisone", "steroid"], drugClass: "other",
    defaultFrequencyKey: "once_daily", withFood: "after", typicalCourseDays: 5,
    commonSideEffects: ["Increased appetite", "Mood changes"], cautions: ["Take with food in the morning", "Don't stop abruptly if used long-term"] },
  { key: "amlodipine", name: "Amlodipine", aliases: ["amlod", "norvasc"], drugClass: "other",
    defaultFrequencyKey: "once_daily", withFood: "any", commonSideEffects: ["Ankle swelling", "Flushing"],
    cautions: ["For blood pressure — take at the same time daily"] },
  { key: "nitrofurantoin", name: "Nitrofurantoin", aliases: ["macrobid", "macrodantin"], drugClass: "antibiotic",
    defaultFrequencyKey: "four_times_daily", withFood: "with", typicalCourseDays: 5,
    commonSideEffects: ["Nausea"], cautions: ["Take with food", "Finish the course"] },
];

const INDEX = (() => {
  const m = new Map<string, DrugInfo>();
  for (const d of DRUG_LIBRARY) {
    m.set(d.name.toLowerCase(), d);
    m.set(d.key, d);
    d.aliases.forEach((a) => m.set(a.toLowerCase(), d));
  }
  return m;
})();

/** Fuzzy-ish lookup by name/alias/key. */
export function findDrug(query: string): DrugInfo | null {
  if (!query) return null;
  const q = query.trim().toLowerCase();
  if (INDEX.has(q)) return INDEX.get(q)!;
  for (const [name, info] of INDEX) {
    if (q.includes(name) || name.includes(q)) return info;
  }
  return null;
}

export function drugByKey(key: string): DrugInfo | null {
  return DRUG_LIBRARY.find((d) => d.key === key) ?? null;
}
