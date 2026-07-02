import type { TriageResult } from "@/lib/intelligence/triage";

/** Profile context used to tailor (never personalise medical advice) the assistant. */
export interface AssistantContext {
  name?: string;
  age?: number;
  genotype?: string;
  conditions?: string[];
  allergies?: string[];
}

export function buildSystemPrompt(ctx: AssistantContext): string {
  const bits: string[] = [];
  if (ctx.age) bits.push(`age ${ctx.age}`);
  if (ctx.genotype) bits.push(`genotype ${ctx.genotype}`);
  if (ctx.conditions?.length) bits.push(`conditions: ${ctx.conditions.join(", ")}`);
  if (ctx.allergies?.length) bits.push(`allergies: ${ctx.allergies.join(", ")}`);
  const profileLine = bits.length
    ? `\nThe student's own health profile (for tailoring general education only, never for personal diagnosis): ${bits.join("; ")}.`
    : "";

  return `You are Pulse, a warm, concise health-education assistant for university students in Sub-Saharan Africa.

STRICT RULES:
- You give GENERAL HEALTH EDUCATION ONLY. You are NOT a doctor and must never claim to be.
- NEVER diagnose a condition. NEVER tell the user which specific medicine or dose to take for their symptoms. If asked to prescribe, explain that only a clinician can, and suggest booking an appointment in the Pulse app.
- If the message suggests an emergency (trouble breathing, chest pain, severe bleeding, fainting, a seizure, thoughts of self-harm, etc.), tell them to seek urgent care immediately and to use the SOS button on their Pulse dashboard. Keep that response short and clear.
- Encourage visiting the campus clinic for anything personal, worsening, or persistent.
- Be practical and culturally aware (malaria, typhoid, sickle-cell, asthma, hygiene are common concerns).
- Use plain, friendly language. Keep answers short (a few sentences or a short list).
- End with a brief one-line reminder that this is general information, not a diagnosis.${profileLine}`;
}

/** Rules-based reply used when no AI key is configured (or the model is unreachable). */
export function fallbackReply(_message: string, triage: TriageResult): string {
  const lead =
    triage.level === "urgent"
      ? "⚠️ Some of what you describe can be serious. Please seek urgent care now — use the SOS button on your dashboard or go straight to the clinic."
      : triage.level === "book_appointment"
        ? "It's best to get this checked at the clinic — you can book an appointment in Pulse. Meanwhile, rest and stay hydrated, and watch for any worsening."
        : "This can often be managed with rest, fluids, and monitoring. Book an appointment if it doesn't improve in a couple of days or gets worse.";

  return `${lead}

(Pulse's AI assistant isn't fully set up yet, so this is general guidance from Pulse's built-in safety rules — not a diagnosis. Please confirm anything personal with a clinician.)`;
}

export const STARTER_QUESTIONS = [
  "What causes malaria and how can I prevent it?",
  "What foods help boost iron for anaemia?",
  "How can I manage my asthma triggers?",
  "What are common side effects of ibuprofen?",
];
