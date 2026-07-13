import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

const AuditLogSchema = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", index: true }, // may be null for break-glass/platform
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    actorLabel: { type: String, default: "" }, // e.g. "break-glass", clinic name
    action: { type: String, required: true }, // "passport.view", "record.read", "break_glass"
    targetType: { type: String, default: "" },
    targetId: { type: String, default: "" },
    ip: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });

export type AuditLogDoc = InferSchemaType<typeof AuditLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AuditLog = models.AuditLog || model("AuditLog", AuditLogSchema);
