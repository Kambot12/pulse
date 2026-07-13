import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

export const EMERGENCY_STATUS = ["active", "acknowledged", "resolved"] as const;
export type EmergencyStatus = (typeof EMERGENCY_STATUS)[number];

const EmergencyAlertSchema = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true, index: true },
    status: { type: String, enum: [...EMERGENCY_STATUS], default: "active", index: true },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      accuracy: { type: Number },
    },
    criticalSnapshot: {
      name: String,
      matricNumber: String,
      bloodGroup: String,
      genotype: String,
      allergies: [String],
      medicalConditions: [String],
      emergencyContact: {
        name: String,
        phone: String,
        relationship: String,
      },
    },
    note: { type: String, default: "" },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: "User" },
    acknowledgedAt: { type: Date },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

export type EmergencyAlertDoc = InferSchemaType<typeof EmergencyAlertSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const EmergencyAlert =
  models.EmergencyAlert || model("EmergencyAlert", EmergencyAlertSchema);
