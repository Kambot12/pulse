import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

export const DOSE_STATUS = ["taken", "skipped", "missed"] as const;
export type DoseStatus = (typeof DOSE_STATUS)[number];

const MedicationLogSchema = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    medicationId: { type: Schema.Types.ObjectId, ref: "Medication", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true, index: true },
    scheduledFor: { type: Date, required: true },
    status: { type: String, enum: [...DOSE_STATUS], required: true },
    actedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

MedicationLogSchema.index({ studentId: 1, scheduledFor: -1 });

export type MedicationLogDoc = InferSchemaType<typeof MedicationLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const MedicationLog =
  models.MedicationLog || model("MedicationLog", MedicationLogSchema);
