import { z } from "zod";
import { BLOOD_GROUPS, GENOTYPES, GENDERS } from "@/lib/constants";

export const signupSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Multi-step onboarding — a comma string is normalised to a list. */
const listFromString = z
  .union([z.string(), z.array(z.string())])
  .transform((v) =>
    (Array.isArray(v) ? v : v.split(","))
      .map((s) => s.trim())
      .filter(Boolean)
  );

export const onboardingSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  matricNumber: z.string().min(3, "Enter your matric number"),
  faculty: z.string().min(1, "Required"),
  department: z.string().min(1, "Required"),
  level: z.string().min(1, "Required"),
  age: z.coerce.number().int().min(10).max(100),
  gender: z.enum(GENDERS),
  bloodGroup: z.enum(BLOOD_GROUPS),
  genotype: z.enum(GENOTYPES),
  allergies: listFromString.default([]),
  medicalConditions: listFromString.default([]),
  currentMedication: listFromString.default([]),
  emergencyContactName: z.string().default(""),
  emergencyContactPhone: z.string().default(""),
  emergencyContactRelationship: z.string().default(""),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

export const medicationSchema = z.object({
  name: z.string().min(2, "Medication name is required"),
  dosage: z.string().default(""),
  frequencyKey: z.string().min(1, "Choose how often it's taken"),
  durationDays: z.coerce.number().int().min(0).max(365).optional(),
  drugKey: z.string().default(""),
  notes: z.string().default(""),
});

export const appointmentSchema = z.object({
  date: z.string().min(1, "Pick a date"),
  time: z.string().min(1, "Pick a time"),
  reason: z.string().min(3, "Tell us the reason for your visit"),
});

export const clinicPrescribeSchema = medicationSchema.extend({
  studentId: z.string().min(1),
  instructions: z.string().default(""),
});

export const clinicRecordSchema = z.object({
  studentId: z.string().min(1),
  type: z.enum(["visit", "note", "vaccination", "labResult"]),
  title: z.string().min(2, "Add a title"),
  details: z.string().default(""),
});

export const clinicFollowUpSchema = z.object({
  studentId: z.string().min(1),
  date: z.string().min(1, "Pick a date"),
  time: z.string().min(1, "Pick a time"),
  reason: z.string().min(2, "Add a reason"),
});

const prescriptionItemSchema = z.object({
  name: z.string().min(2, "Medication name is required"),
  dosage: z.string().default(""),
  frequencyKey: z.string().min(1, "Choose a frequency"),
  durationDays: z.coerce.number().int().min(0).max(365).optional(),
  drugKey: z.string().default(""),
  instructions: z.string().default(""),
});

export const consultationSchema = z.object({
  studentId: z.string().min(1),
  complaint: z.string().min(2, "Enter the presenting complaint"),
  diagnosis: z.string().default(""),
  notes: z.string().default(""),
  pregnant: z.boolean().default(false),
  prescriptions: z.array(prescriptionItemSchema).default([]),
});

export type PrescriptionItem = z.infer<typeof prescriptionItemSchema>;

export const staffSchema = z.object({
  name: z.string().min(2, "Enter the staff member's name"),
  email: z.string().email("Enter a valid email"),
  role: z.enum(["doctor", "reception", "admin"]),
});

export const firstAdminSchema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  secret: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});
