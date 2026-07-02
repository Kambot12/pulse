import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

export const ROLES = ["student", "doctor", "reception", "admin"] as const;
export type Role = (typeof ROLES)[number];

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: [...ROLES], default: "student", index: true },
    onboardingComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const User = models.User || model("User", UserSchema);
