import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

const MedicationSchema = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true, index: true },
    name: { type: String, required: true },
    dosage: { type: String, default: "" },
    schedule: { type: [String], default: [] }, // generated concrete times ["08:00", "20:00"]
    frequencyKey: { type: String, default: "" }, // e.g. "twice_daily", "every_8h"
    durationDays: { type: Number },
    withFood: { type: String, default: "any" }, // before | after | with | any
    drugKey: { type: String, default: "" }, // reference-library key, if matched
    form: { type: String, default: "" }, // tablet | capsule | syrup | ...
    instructions: { type: String, default: "" },
    remindersEnabled: { type: Boolean, default: true },
    source: { type: String, default: "self" }, // "self" | "clinic"
    prescribedById: { type: Schema.Types.ObjectId, ref: "User" },
    prescribedByName: { type: String, default: "" },
    visitId: { type: Schema.Types.ObjectId, ref: "MedicalRecord" }, // consultation episode
    startDate: { type: String },
    endDate: { type: String },
    active: { type: Boolean, default: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export type MedicationDoc = InferSchemaType<typeof MedicationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Medication = models.Medication || model("Medication", MedicationSchema);
