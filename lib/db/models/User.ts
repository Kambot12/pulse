import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

export const ROLES = ["student", "doctor", "reception", "admin", "superadmin", "developer"] as const;
export type Role = (typeof ROLES)[number];

const UserSchema = new Schema(
  {
    // Tenant. Null only for the platform super-admin, who belongs to no institution.
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: [...ROLES], default: "student", index: true },
    name: { type: String, default: "" }, // used for staff display (students use StudentProfile.name)
    mustChangePassword: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    onboardingComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const User = models.User || model("User", UserSchema);
