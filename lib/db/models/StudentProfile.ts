import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";
import { BLOOD_GROUPS, GENOTYPES, GENDERS } from "@/lib/constants";

const EmergencyContactSchema = new Schema(
  {
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    relationship: { type: String, default: "" },
  },
  { _id: false }
);

const StudentProfileSchema = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    name: { type: String, required: true },
    matricNumber: { type: String, required: true, index: true, trim: true }, // unique per org (compound index below)
    faculty: { type: String, default: "" },
    department: { type: String, default: "" },
    level: { type: String, default: "" },
    age: { type: Number, min: 10, max: 100 },
    gender: { type: String, enum: [...GENDERS] },
    bloodGroup: { type: String, enum: [...BLOOD_GROUPS] },
    genotype: { type: String, enum: [...GENOTYPES] },
    allergies: { type: [String], default: [] },
    medicalConditions: { type: [String], default: [] },
    currentMedication: { type: [String], default: [] },
    emergencyContact: { type: EmergencyContactSchema, default: () => ({}) },
    healthScore: { type: Number, default: 80, min: 0, max: 100 },
    onboardingComplete: { type: Boolean, default: false },
    emergencyCode: { type: String, unique: true, sparse: true, index: true }, // stable break-glass /e/<code> link
  },
  { timestamps: true }
);

// Matric numbers are unique within an institution, not globally.
StudentProfileSchema.index({ orgId: 1, matricNumber: 1 }, { unique: true });

export type StudentProfileDoc = InferSchemaType<typeof StudentProfileSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const StudentProfile =
  models.StudentProfile || model("StudentProfile", StudentProfileSchema);
