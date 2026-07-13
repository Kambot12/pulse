/**
 * Controlled symptom vocabulary + diagnosis categorization. Shared by the Symptom
 * Journal (Phase 9) and the Campus Outbreak Radar (Phase 10) so student-reported
 * symptoms and clinician diagnoses roll up into the same categories.
 */
export interface SymptomOption {
  key: string;
  label: string;
  category: string;
}

export const SYMPTOMS: SymptomOption[] = [
  { key: "fever", label: "Fever", category: "Febrile" },
  { key: "chills", label: "Chills / sweats", category: "Febrile" },
  { key: "cough", label: "Cough", category: "Respiratory" },
  { key: "sore_throat", label: "Sore throat", category: "Respiratory" },
  { key: "runny_nose", label: "Runny / blocked nose", category: "Respiratory" },
  { key: "shortness_breath", label: "Shortness of breath", category: "Respiratory" },
  { key: "headache", label: "Headache", category: "Neurological" },
  { key: "dizziness", label: "Dizziness", category: "Neurological" },
  { key: "diarrhea", label: "Diarrhea", category: "Diarrheal" },
  { key: "vomiting", label: "Vomiting", category: "Diarrheal" },
  { key: "nausea", label: "Nausea", category: "Gastro" },
  { key: "abdominal_pain", label: "Abdominal pain", category: "Gastro" },
  { key: "body_aches", label: "Body / joint aches", category: "Musculoskeletal" },
  { key: "fatigue", label: "Fatigue / weakness", category: "General" },
  { key: "rash", label: "Rash", category: "Skin / rash" },
  { key: "painful_urination", label: "Painful urination", category: "Urinary" },
  { key: "eye_redness", label: "Eye redness / pain", category: "Eye" },
  { key: "toothache", label: "Toothache", category: "Dental" },
];

export const SYMPTOM_LABEL: Record<string, string> = Object.fromEntries(SYMPTOMS.map((s) => [s.key, s.label]));
export const SYMPTOM_CATEGORY: Record<string, string> = Object.fromEntries(SYMPTOMS.map((s) => [s.key, s.category]));

/** Diagnosis keyword → outbreak category (applied to MedicalRecord `visit` titles/details). */
const DIAGNOSIS_CATEGORIES: Array<[RegExp, string]> = [
  [/malaria/i, "Malaria"],
  [/typhoid|enteric fever/i, "Typhoid"],
  [/cholera|diarrh|gastroenter|dysentery|food poison/i, "Diarrheal"],
  [/flu|influenza|common cold|urti|upper respiratory|catarrh/i, "Respiratory"],
  [/covid|corona|sars/i, "COVID-like"],
  [/measles|chicken ?pox|rubella|rash/i, "Skin / rash"],
  [/uti|urinary|cystitis/i, "Urinary"],
  [/conjunctivitis|pink ?eye|apollo/i, "Eye"],
];

export function categorizeDiagnosis(text: string): string | null {
  const t = text || "";
  for (const [rx, cat] of DIAGNOSIS_CATEGORIES) if (rx.test(t)) return cat;
  return null;
}

export function symptomsToCategories(keys: string[]): string[] {
  return [...new Set(keys.map((k) => SYMPTOM_CATEGORY[k]).filter(Boolean))];
}
