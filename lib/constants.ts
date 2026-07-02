/** Client-safe shared enums (no server/mongoose imports). */
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export const GENOTYPES = ["AA", "AS", "SS", "AC", "SC"] as const;
export const GENDERS = ["male", "female", "other"] as const;
export const LEVELS = ["100", "200", "300", "400", "500", "600", "Postgraduate"] as const;

export type BloodGroup = (typeof BLOOD_GROUPS)[number];
export type Genotype = (typeof GENOTYPES)[number];
export type Gender = (typeof GENDERS)[number];
