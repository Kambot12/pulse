import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

/** Curated, offline-safe fonts (loaded via next/font). Keep in sync with lib/theme/fonts.ts. */
export const FONT_KEYS = ["geist", "inter", "manrope", "plus-jakarta"] as const;
export type FontKey = (typeof FONT_KEYS)[number];

export const DEFAULT_THEME = {
  brand: "#0ea5a4",
  brandInk: "#0b6b6a",
  accent: "#6366f1",
  fontKey: "geist" as FontKey,
};

/**
 * A tenant. Each institution (university clinic) is one Organization. All
 * tenant-scoped collections carry `orgId` pointing here. White-label branding
 * (colors, logo, name, font) lives on the org so it can be inlined server-side
 * and cached for offline use.
 */
const ThemeSchema = new Schema(
  {
    brand: { type: String, default: DEFAULT_THEME.brand },      // primary/brand color (hex)
    brandInk: { type: String, default: DEFAULT_THEME.brandInk }, // darker brand for text
    accent: { type: String, default: DEFAULT_THEME.accent },     // gradient accent (hex)
    fontKey: { type: String, enum: [...FONT_KEYS], default: DEFAULT_THEME.fontKey },
  },
  { _id: false }
);

const OrganizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    joinCode: { type: String, required: true, unique: true, uppercase: true, trim: true }, // student join code
    emailDomain: { type: String, default: "", lowercase: true, trim: true, index: true }, // e.g. "acme.edu" — signup maps here
    isDefault: { type: Boolean, default: false, index: true }, // catch-all for unmatched email domains (exactly one)
    theme: { type: ThemeSchema, default: () => ({}) },
    logoDataUri: { type: String, default: "" }, // small base64 data URI (offline/CSP-safe); empty = default Heart logo
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export type OrganizationDoc = InferSchemaType<typeof OrganizationSchema> & { _id: mongoose.Types.ObjectId };

export const Organization = models.Organization || model("Organization", OrganizationSchema);
