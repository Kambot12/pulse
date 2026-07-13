/** Client-safe shared enums (no server/mongoose imports). */
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export const GENOTYPES = ["AA", "AS", "SS", "AC", "SC"] as const;
export const GENDERS = ["male", "female", "other"] as const;
export const LEVELS = ["100", "200", "300", "400", "500", "600", "Postgraduate"] as const;

export type BloodGroup = (typeof BLOOD_GROUPS)[number];
export type Genotype = (typeof GENOTYPES)[number];
export type Gender = (typeof GENDERS)[number];

/** National emergency line (Nigeria). Central so SOS + Emergency Mode stay in sync. */
export const EMERGENCY_LINE = "112";

/**
 * Personal / free email providers. Users on these always fall into the default
 * institution (they never match an institution's domain), and institutions may
 * not register one of these as their email domain.
 */
export const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "ymail.com",
  "hotmail.com", "hotmail.co.uk", "outlook.com", "live.com", "msn.com",
  "icloud.com", "me.com", "aol.com", "proton.me", "protonmail.com",
  "yandex.com", "gmx.com", "mail.com", "zoho.com",
]);

export function isPublicEmailDomain(domain: string): boolean {
  return PUBLIC_EMAIL_DOMAINS.has(domain.toLowerCase().trim());
}
