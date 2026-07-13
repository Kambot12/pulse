"use server";

import { revalidatePath } from "next/cache";
import { generateText } from "ai";
import { dbConnect } from "@/lib/db/connect";
import { getCurrentStudentContext } from "@/lib/auth/session";
import { SymptomJournal } from "@/lib/db/models/SymptomJournal";
import { journalSchema } from "@/lib/validation/schemas";
import { assessSymptoms } from "@/lib/intelligence/triage";
import { SYMPTOM_LABEL } from "@/lib/intelligence/symptoms";
import { buildJournalSummaryPrompt, journalLines, rulesJournalSummary } from "@/lib/ai/prompts";

export type JournalActionState = {
  error?: string;
  ok?: boolean;
  triageLevel?: "self_care" | "book_appointment" | "urgent";
} | undefined;

const SEV_NUM: Record<string, number> = { mild: 3, moderate: 6, severe: 8 };

export async function addJournalEntryAction(
  _prev: JournalActionState,
  formData: FormData
): Promise<JournalActionState> {
  const ctx = await getCurrentStudentContext();
  if (!ctx) return { error: "Not signed in." };

  const parsed = journalSchema.safeParse({
    symptoms: formData.getAll("symptoms").map(String),
    severity: formData.get("severity"),
    notes: (formData.get("notes") as string) ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { symptoms, severity, notes } = parsed.data;

  // Tag the entry with a triage level via the deterministic safety gate.
  const text = symptoms.map((s) => SYMPTOM_LABEL[s] ?? s).join(", ") + (notes ? `. ${notes}` : "");
  const triage = assessSymptoms({ text, severity: SEV_NUM[severity] ?? 3 });

  await dbConnect();
  await SymptomJournal.create({
    orgId: ctx.orgId,
    studentId: ctx.studentId,
    entryDate: new Date(),
    symptoms,
    severity,
    notes,
    triageLevel: triage.level,
  });

  revalidatePath("/journal");
  revalidatePath("/dashboard");
  return { ok: true, triageLevel: triage.level };
}

/** Summarize the last ~30 days of entries with Gemini (rules fallback), cached on the newest entry. */
export async function summarizeJournalAction(): Promise<JournalActionState> {
  const ctx = await getCurrentStudentContext();
  if (!ctx) return { error: "Not signed in." };

  await dbConnect();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const entries = await SymptomJournal.find({ studentId: ctx.studentId, entryDate: { $gte: since } })
    .sort({ entryDate: -1 })
    .limit(60)
    .lean<{ _id: unknown; entryDate: Date; symptoms?: string[]; severity?: string; notes?: string }[]>();

  if (!entries.length) return { ok: true };

  let summary: string;
  if (process.env.AI_GATEWAY_API_KEY) {
    try {
      const { text } = await generateText({
        model: process.env.AI_MODEL || "google/gemini-2.5-flash",
        system: buildJournalSummaryPrompt(),
        prompt: journalLines(entries),
        temperature: 0.4,
      });
      summary = text.trim() || rulesJournalSummary(entries);
    } catch {
      summary = rulesJournalSummary(entries);
    }
  } else {
    summary = rulesJournalSummary(entries);
  }

  await SymptomJournal.updateOne({ _id: entries[0]._id }, { aiSummary: summary });
  revalidatePath("/journal");
  return { ok: true };
}
