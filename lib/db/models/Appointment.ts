import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

export const APPOINTMENT_STATUS = [
  "pending", "approved", "rejected", "completed", "cancelled",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[number];

const AppointmentSchema = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true, index: true },
    date: { type: String, required: true }, // ISO date (YYYY-MM-DD)
    time: { type: String, required: true }, // HH:mm
    reason: { type: String, required: true },
    status: { type: String, enum: [...APPOINTMENT_STATUS], default: "pending", index: true },
    queueNumber: { type: Number },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export type AppointmentDoc = InferSchemaType<typeof AppointmentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Appointment = models.Appointment || model("Appointment", AppointmentSchema);
