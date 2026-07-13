import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

export const SEVERITY = ["mild", "moderate", "severe"] as const;
export type Severity = (typeof SEVERITY)[number];

/**
 * A student's self-reported symptom entry. Private to the student; feeds the AI
 * pattern summary and (anonymized, aggregate) the campus outbreak radar (Phase 10).
 */
const SymptomJournalSchema = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true, index: true },
    entryDate: { type: Date, default: Date.now },
    symptoms: { type: [String], default: [] }, // taxonomy keys from lib/intelligence/symptoms.ts
    severity: { type: String, enum: [...SEVERITY], default: "mild" },
    notes: { type: String, default: "" },
    triageLevel: { type: String, default: "self_care" }, // self_care | book_appointment | urgent
    aiSummary: { type: String, default: "" }, // latest pattern summary (cached on the newest entry)
  },
  { timestamps: true }
);

SymptomJournalSchema.index({ orgId: 1, entryDate: -1 });
SymptomJournalSchema.index({ studentId: 1, entryDate: -1 });

export type SymptomJournalDoc = InferSchemaType<typeof SymptomJournalSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SymptomJournal =
  models.SymptomJournal || model("SymptomJournal", SymptomJournalSchema);
