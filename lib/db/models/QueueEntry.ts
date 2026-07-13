import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

export const QUEUE_STATUS = ["waiting", "in_progress", "done"] as const;
export type QueueStatus = (typeof QUEUE_STATUS)[number];

const QueueEntrySchema = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
    studentName: { type: String, default: "" },
    reason: { type: String, default: "" },
    number: { type: Number, required: true },
    status: { type: String, enum: [...QUEUE_STATUS], default: "waiting", index: true },
    enqueuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export type QueueEntryDoc = InferSchemaType<typeof QueueEntrySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const QueueEntry = models.QueueEntry || model("QueueEntry", QueueEntrySchema);
