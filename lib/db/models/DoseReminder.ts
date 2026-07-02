import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

/** Dedupe record so the reminder cron never sends the same dose slot twice. */
const DoseReminderSchema = new Schema(
  {
    medicationId: { type: Schema.Types.ObjectId, ref: "Medication", required: true },
    slotKey: { type: String, required: true }, // ISO datetime of the dose slot
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

DoseReminderSchema.index({ medicationId: 1, slotKey: 1 }, { unique: true });

export type DoseReminderDoc = InferSchemaType<typeof DoseReminderSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const DoseReminder = models.DoseReminder || model("DoseReminder", DoseReminderSchema);
