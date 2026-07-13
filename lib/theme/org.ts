import "server-only";
import { dbConnect } from "@/lib/db/connect";
import { Organization, DEFAULT_THEME } from "@/lib/db/models/Organization";

export interface OrgBrand {
  name: string;
  brand: string;
  brandInk: string;
  accent: string;
  fontKey: string;
  logoDataUri: string;
}

/** Load an institution's branding for server-side theme inlining. Null if none. */
export async function getOrgBrand(orgId?: string | null): Promise<OrgBrand | null> {
  if (!orgId) return null;
  await dbConnect();
  const o = await Organization.findById(orgId)
    .select("name theme logoDataUri")
    .lean<{ name: string; theme?: Partial<typeof DEFAULT_THEME>; logoDataUri?: string }>();
  if (!o) return null;
  return {
    name: o.name,
    brand: o.theme?.brand ?? DEFAULT_THEME.brand,
    brandInk: o.theme?.brandInk ?? DEFAULT_THEME.brandInk,
    accent: o.theme?.accent ?? DEFAULT_THEME.accent,
    fontKey: o.theme?.fontKey ?? DEFAULT_THEME.fontKey,
    logoDataUri: o.logoDataUri ?? "",
  };
}

/** Load an active org's branding by slug (for the pre-auth signup page). */
export async function getOrgBrandBySlug(slug?: string | null): Promise<OrgBrand | null> {
  if (!slug) return null;
  await dbConnect();
  const o = await Organization.findOne({ slug: slug.toLowerCase(), active: true })
    .select("name theme logoDataUri")
    .lean<{ name: string; theme?: Partial<typeof DEFAULT_THEME>; logoDataUri?: string }>();
  if (!o) return null;
  return {
    name: o.name,
    brand: o.theme?.brand ?? DEFAULT_THEME.brand,
    brandInk: o.theme?.brandInk ?? DEFAULT_THEME.brandInk,
    accent: o.theme?.accent ?? DEFAULT_THEME.accent,
    fontKey: o.theme?.fontKey ?? DEFAULT_THEME.fontKey,
    logoDataUri: o.logoDataUri ?? "",
  };
}
