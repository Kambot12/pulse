import { EMERGENCY_LINE } from "@/lib/constants";

/**
 * Curated, standard basic first-aid. NOT medical advice, never a diagnosis or a
 * drug/dose prescription — it's bystander emergency response (call for help, CPR,
 * positioning). Static → works fully offline. `firstAidFor` returns the sections
 * relevant to a person's allergies/conditions/genotype first, then general ones.
 */
export interface FirstAidSection {
  key: string;
  title: string;
  when: string;
  steps: string[];
  urgent?: boolean;
}

export const FIRST_AID_DISCLAIMER =
  `Basic first aid only — not a substitute for professional care. In doubt, call ${EMERGENCY_LINE}.`;

/** Always shown at the top. */
export const GENERAL_STEPS: string[] = [
  "Stay calm. Check the area is safe for you and them.",
  `Call their emergency contact and the national line ${EMERGENCY_LINE}.`,
  "Don't move them unnecessarily unless they're in danger.",
  "Reassure them and stay until help arrives.",
];

const SECTIONS: Record<string, FirstAidSection> = {
  anaphylaxis: {
    key: "anaphylaxis",
    title: "Severe allergic reaction (anaphylaxis)",
    when: "Swelling of face/throat, trouble breathing, or a spreading rash after a known allergen",
    urgent: true,
    steps: [
      `Call ${EMERGENCY_LINE} immediately.`,
      "If they carry an adrenaline auto-injector (e.g. EpiPen), help them use it on the outer thigh.",
      "Help them sit up if breathing is hard; lie them flat with legs raised if faint.",
      "Loosen tight clothing. Do NOT give food or drink.",
      "Be ready to start CPR if they stop breathing.",
    ],
  },
  asthma: {
    key: "asthma",
    title: "Asthma attack",
    when: "Wheezing, tight chest, or struggling to breathe",
    urgent: true,
    steps: [
      "Help them sit upright and stay calm — don't lie them down.",
      "Help them take their reliever inhaler (usually blue): 1 puff every 30–60s, up to 10 puffs.",
      `Call ${EMERGENCY_LINE} if there's no inhaler, no improvement after 10 puffs, or they get worse.`,
      "Loosen tight clothing and keep them reassured.",
    ],
  },
  sickle_cell: {
    key: "sickle_cell",
    title: "Sickle-cell crisis",
    when: "Sudden severe pain (bones, back, chest), often with tiredness",
    urgent: true,
    steps: [
      "Help them rest comfortably and keep them warm.",
      "Give fluids (water) if they are fully awake.",
      "Encourage their own prescribed pain relief if they have it — don't give new medicines.",
      `Call ${EMERGENCY_LINE} / go to a clinic urgently if there's severe pain, fever, trouble breathing, or swelling.`,
    ],
  },
  diabetic: {
    key: "diabetic",
    title: "Diabetic emergency (low blood sugar)",
    when: "Confusion, shakiness, sweating, or drowsiness in someone with diabetes",
    steps: [
      "If awake and able to swallow, give something sugary — juice, glucose, or sweets.",
      "Let them rest; recheck in 10 minutes.",
      `If they don't improve, can't swallow, or become unconscious, call ${EMERGENCY_LINE} and place them on their side.`,
      "Do NOT give insulin in an emergency.",
    ],
  },
  seizure: {
    key: "seizure",
    title: "Seizure (fit)",
    when: "Sudden collapse with jerking movements",
    steps: [
      "Stay calm and note the time it starts. Move hard or sharp objects away.",
      "Cushion their head. Do NOT restrain them or put anything in their mouth.",
      "When it stops, gently roll them onto their side (recovery position).",
      `Call ${EMERGENCY_LINE} if it lasts over 5 minutes, repeats, they're injured, or don't wake up.`,
    ],
  },
  bleeding: {
    key: "bleeding",
    title: "Severe bleeding",
    when: "A wound bleeding heavily",
    urgent: true,
    steps: [
      "Press firmly and directly on the wound with a clean cloth.",
      "Keep pressing. If blood soaks through, add more cloth on top — don't remove the first.",
      "If possible, raise the injured part above the level of the heart.",
      `Call ${EMERGENCY_LINE} for heavy bleeding that won't stop.`,
    ],
  },
  unconscious: {
    key: "unconscious",
    title: "Unconscious / not breathing (CPR)",
    when: "Not responding and not breathing normally",
    urgent: true,
    steps: [
      "Check for a response and normal breathing.",
      `If they are NOT breathing normally, call ${EMERGENCY_LINE} and start CPR.`,
      "Push hard and fast in the centre of the chest, about 100–120 pushes a minute, letting the chest rise fully.",
      "Keep going until help arrives or they recover.",
      "If they ARE breathing, place them on their side (recovery position) and monitor.",
    ],
  },
  choking: {
    key: "choking",
    title: "Choking",
    when: "Can't cough, speak, or breathe",
    steps: [
      "Ask 'Are you choking?' If they can't cough or speak, act now.",
      "Give up to 5 firm back blows between the shoulder blades.",
      "Then up to 5 abdominal thrusts: stand behind, hands just above the navel, pull sharply in and up.",
      `Alternate 5 back blows and 5 thrusts. Call ${EMERGENCY_LINE} if it doesn't clear.`,
    ],
  },
};

export function firstAidFor(p: { allergies?: string[]; medicalConditions?: string[]; genotype?: string }): FirstAidSection[] {
  const conds = (p.medicalConditions ?? []).map((c) => c.toLowerCase());
  const out: FirstAidSection[] = [];

  // Person-specific first.
  if ((p.allergies ?? []).length) out.push(SECTIONS.anaphylaxis);
  if (conds.some((c) => c.includes("asthma"))) out.push(SECTIONS.asthma);
  if (["SS", "SC"].includes(p.genotype ?? "") || conds.some((c) => c.includes("sickle"))) out.push(SECTIONS.sickle_cell);
  if (conds.some((c) => c.includes("diabet"))) out.push(SECTIONS.diabetic);
  if (conds.some((c) => c.includes("seizure") || c.includes("epilep"))) out.push(SECTIONS.seizure);

  // Always-useful general emergencies.
  out.push(SECTIONS.unconscious, SECTIONS.bleeding, SECTIONS.choking, SECTIONS.seizure);

  // De-dupe, preserving order.
  return [...new Map(out.map((s) => [s.key, s])).values()];
}
