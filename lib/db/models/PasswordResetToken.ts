import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * One-time password-reset token. We store only a SHA-256 hash of the token (never
 * the raw value), so a database leak can't be used to reset anyone's password.
 * Expired docs are auto-purged by the TTL index.
 */
const PasswordResetTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-delete tokens once they expire.
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PasswordResetTokenDoc = InferSchemaType<typeof PasswordResetTokenSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PasswordResetToken =
  models.PasswordResetToken || model("PasswordResetToken", PasswordResetTokenSchema);
