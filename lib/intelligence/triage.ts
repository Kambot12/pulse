/**
 * Symptom Triage — the deterministic safety gate of the "thinks rationally" engine.
 *
 * It NEVER diagnoses or names a drug/dose. It maps described symptoms to an action:
 * self-care · book an appointment · seek urgent care — flagging red-flags first and
 * always deferring to a real clinician. (LLM educational enrichment is Phase 4.)
 */

export type TriageLevel = "self_care" | "book_appointment" | "urgent";

export interface TriageInput {
  text: string;
  severity?: number; // 1–10 (optional self-rating)
  durationDays?: number;
}

export interface TriageResult {
  level: TriageLevel;
  headline: string;
  redFlags: string[];
  advice: string[];
  disclaimer: string;
  cta: "sos" | "book" | "monitor";
}

const RED_FLAGS: Array<[RegExp, string]> = [
  [/chest pain|tight chest|pressure in (my )?chest/i, "Chest pain"],
  [/can'?t breathe|difficulty breathing|trouble breathing|short(ness)? of breath|gasping/i, "Difficulty breathing"],
  [/unconscious|fainted|passed out|unresponsive|collaps/i, "Loss of consciousness"],
  [/seizure|convuls|fitting/i, "Seizure"],
  [/severe bleeding|bleeding (a lot|heavily)|won'?t stop bleeding|hemorrhage/i, "Severe bleeding"],
  [/stiff neck.*(fever|rash)|(fever|rash).*stiff neck/i, "Stiff neck with fever (possible meningitis)"],
  [/coughing (up )?blood|vomiting blood|blood in (my )?vomit/i, "Coughing/vomiting blood"],
  [/slurred speech|face droop|weak(ness)? (on )?one side|numb one side/i, "Stroke warning signs"],
  [/suicid|kill myself|end my life|self.?harm/i, "Thoughts of self-harm"],
  [/swollen (face|throat|tongue|lips)|throat closing|anaphyla/i, "Severe allergic reaction"],
  [/severe (abdominal|stomach) pain|worst pain/i, "Severe abdominal pain"],
  [/sickle.?cell crisis|severe (bone|joint) pain crisis/i, "Possible sickle-cell crisis"],
  [/poison|overdose|swallowed (a lot|too many)/i, "Possible poisoning/overdose"],
  [/(fever|temperature).*(4[0-3]|39\.[5-9])|very high fever/i, "Very high fever"],
];

const MODERATE: RegExp[] = [
  /fever|temperature/i, /vomit|throwing up/i, /diarrh?ea|loose stool/i, /rash/i,
  /persistent (headache|cough)/i, /sore throat/i, /ear ?ache|ear pain/i,
  /painful urination|burning (when|while) (i )?(pee|urinat)/i, /body ?ache|joint pain/i,
  /can'?t sleep|insomnia/i, /dizzy|dizziness/i, /toothache/i, /eye (pain|redness)/i,
];

const SELF_CARE_ADVICE = [
  "Rest and drink plenty of fluids.",
  "Monitor your symptoms and note if they get worse.",
  "For over-the-counter relief, ask a pharmacist or the clinic — don't self-prescribe.",
  "Book an appointment if things don't improve in 48 hours or you feel worse.",
];

const DISCLAIMER =
  "Pulse gives general guidance only — it doesn't diagnose or prescribe. Always confirm with a clinician.";

export function assessSymptoms(input: TriageInput): TriageResult {
  const text = (input.text || "").trim();
  const redFlags = RED_FLAGS.filter(([rx]) => rx.test(text)).map(([, label]) => label);
  const severity = input.severity ?? 0;
  const duration = input.durationDays ?? 0;

  if (redFlags.length || severity >= 9) {
    return {
      level: "urgent",
      headline: "This needs urgent attention",
      redFlags,
      advice: [
        "Please seek medical help now — go to the campus clinic or nearest hospital.",
        "If it's life-threatening, use the SOS button to alert the clinic and call your emergency contact.",
        "Do not wait to see if it passes.",
      ],
      disclaimer: DISCLAIMER,
      cta: "sos",
    };
  }

  const moderateHits = MODERATE.filter((rx) => rx.test(text)).length;
  if (moderateHits > 0 || severity >= 6 || duration >= 4) {
    return {
      level: "book_appointment",
      headline: "Worth getting this checked",
      redFlags,
      advice: [
        "Book an appointment at the clinic so a clinician can assess you properly.",
        "Meanwhile, rest, stay hydrated, and keep track of your symptoms.",
        "Seek urgent care if new severe symptoms appear (trouble breathing, severe pain, high fever).",
      ],
      disclaimer: DISCLAIMER,
      cta: "book",
    };
  }

  return {
    level: "self_care",
    headline: "Likely manageable with self-care",
    redFlags,
    advice: SELF_CARE_ADVICE,
    disclaimer: DISCLAIMER,
    cta: "monitor",
  };
}
