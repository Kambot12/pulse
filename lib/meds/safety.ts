/**
 * Conservative, curated medication safety checks — allergy clashes, duplicate
 * therapy, and personalised cautions (condition, genotype, age, pregnancy).
 * Informational (never blocks); designed to warn, not to prescribe.
 * Neutral phrasing so it reads for both the student and the clinician.
 */
import { findDrug, type DrugClass, type DrugInfo } from "./library";

export interface SafetyWarning {
  level: "high" | "info";
  message: string;
}

export interface SafetyContext {
  allergies?: string[];
  currentMedNames?: string[];
  conditions?: string[];
  genotype?: string;
  age?: number;
  pregnant?: boolean;
}

const ALLERGY_CLASS: Array<[RegExp, DrugClass]> = [
  [/penicillin|amoxicillin|ampicillin|augmentin|amoxiclav/i, "penicillin"],
  [/sulfa|sulpha|sulfur|sulphur|septrin|bactrim|cotrimoxazole/i, "sulfonamide"],
  [/aspirin|ibuprofen|nsaid|diclofenac|brufen|voltaren|naproxen/i, "nsaid"],
  [/erythromycin|azithromycin|macrolide|clarithromycin/i, "macrolide"],
  [/cephalosporin|ceftriaxone|cefuroxime|cephalexin/i, "cephalosporin"],
  [/ciprofloxacin|quinolone|levofloxacin|ofloxacin/i, "quinolone"],
];

type DrugLike = DrugInfo | { name: string; drugClass: DrugClass };

export function checkSafety(drug: DrugLike, ctx: SafetyContext = {}): SafetyWarning[] {
  const { allergies = [], currentMedNames = [], conditions = [], genotype, age, pregnant } = ctx;
  const warnings: SafetyWarning[] = [];
  const cls = drug.drugClass;
  const name = drug.name;
  const key = ("key" in drug ? drug.key : findDrug(name)?.key) ?? "";

  // 1) Allergy clashes
  for (const raw of allergies) {
    const a = raw.trim();
    if (!a) continue;
    if (name.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(name.toLowerCase())) {
      warnings.push({ level: "high", message: `Allergy to "${a}" on record — this appears to be that same medicine.` });
      continue;
    }
    for (const [rx, allergyClass] of ALLERGY_CLASS) {
      if (rx.test(a) && allergyClass === cls) {
        warnings.push({ level: "high", message: `Allergy to "${a}" on record — ${name} is in the same drug family (${cls}).` });
      }
      if (rx.test(a) && allergyClass === "penicillin" && cls === "cephalosporin") {
        warnings.push({ level: "high", message: `Penicillin allergy on record — ${name} (cephalosporin) can cross-react in some people.` });
      }
    }
  }

  // 2) Duplicate therapy / interactions vs current meds
  const currentClasses = currentMedNames.map((n) => findDrug(n)?.drugClass).filter(Boolean) as DrugClass[];
  if (cls === "nsaid" && currentClasses.includes("nsaid")) {
    warnings.push({ level: "info", message: "Already on another anti-inflammatory (NSAID) — two together raise stomach/kidney risk." });
  }
  if (currentClasses.includes(cls) && ["penicillin", "macrolide", "quinolone", "antibiotic", "sulfonamide"].includes(cls)) {
    warnings.push({ level: "info", message: `Already has another ${cls} medicine on record — confirm both are meant to run together.` });
  }

  // 3) Condition-based cautions
  const hasAsthma = conditions.some((c) => /asthma/i.test(c));
  if (cls === "nsaid" && hasAsthma) {
    warnings.push({ level: "high", message: `Asthma on record — NSAIDs like ${name} can trigger attacks in some people.` });
  }
  if (cls === "nsaid" && conditions.some((c) => /ulcer|gastritis/i.test(c))) {
    warnings.push({ level: "high", message: `Stomach/ulcer condition on record — NSAIDs can worsen it.` });
  }

  // 4) Genotype (sickle-cell) cautions
  if ((genotype === "SS" || genotype === "SC")) {
    if (cls === "nsaid") {
      warnings.push({ level: "info", message: `Sickle-cell genotype (${genotype}) — use NSAIDs cautiously and keep the patient well hydrated (kidney risk).` });
    }
  }

  // 5) Age cautions
  if (typeof age === "number" && age < 16 && (key === "aspirin" || /aspirin/i.test(name))) {
    warnings.push({ level: "high", message: `Patient is under 16 — aspirin is linked to Reye's syndrome. Avoid unless specifically indicated.` });
  }

  // 6) Pregnancy cautions
  if (pregnant) {
    const risky = cls === "quinolone" || cls === "nsaid" || cls === "sulfonamide" || key === "metronidazole" || /doxycycline|tetracycline/i.test(name);
    if (risky) {
      warnings.push({ level: "high", message: `Patient marked pregnant — ${name} is generally avoided in pregnancy. Consider a safer alternative.` });
    }
  }

  return warnings;
}
