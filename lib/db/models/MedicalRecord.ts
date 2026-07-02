import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

export const RECORD_TYPES = ["visit", "labResult", "prescription", "vaccination", "note"] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

const MedicalRecordSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true, index: true },
    type: { type: String, enum: [...RECORD_TYPES], required: true },
    title: { type: String, required: true },
    details: { type: String, default: "" },
    doctorId: { type: Schema.Types.ObjectId, ref: "User" },
    doctorName: { type: String, default: "" },
    visitId: { type: Schema.Types.ObjectId, ref: "MedicalRecord" }, // links a prescription to its consultation
    attachments: { type: [String], default: [] },
  },
  { timestamps: true }
);

MedicalRecordSchema.index({ studentId: 1, createdAt: -1 });

export type MedicalRecordDoc = InferSchemaType<typeof MedicalRecordSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const MedicalRecord =
  models.MedicalRecord || model("MedicalRecord", MedicalRecordSchema);
