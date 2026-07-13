import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

const StaffInviteSchema = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    code: { type: String, required: true, unique: true, index: true },
    role: { type: String, enum: ["doctor", "reception", "admin"], required: true },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date, required: true },
    uses: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export type StaffInviteDoc = InferSchemaType<typeof StaffInviteSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const StaffInvite = models.StaffInvite || model("StaffInvite", StaffInviteSchema);
