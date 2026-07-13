import { redirect } from "next/navigation";
import { AppShell } from "@/components/student/AppShell";
import { MustChangePasswordBanner } from "@/components/MustChangePasswordBanner";
import { ThemeStyle } from "@/components/ThemeStyle";
import { getCurrentStudentProfile, getCurrentUser } from "@/lib/auth/session";
import { getOrgBrand } from "@/lib/theme/org";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // clinic staff + super-admin don't belong in the student area
  if (["doctor", "reception", "admin", "superadmin"].includes(user.role)) redirect("/doctor");

  const profile = await getCurrentStudentProfile();
  if (!profile?.onboardingComplete) redirect("/onboarding");

  const brand = await getOrgBrand(user.orgId);

  return (
    <>
      {brand && <ThemeStyle brand={brand.brand} brandInk={brand.brandInk} accent={brand.accent} fontKey={brand.fontKey} />}
      <AppShell name={profile.name} orgName={brand?.name ?? "Pulse"} orgLogo={brand?.logoDataUri ?? ""}>
        <MustChangePasswordBanner show={user.mustChangePassword} />
        {children}
      </AppShell>
    </>
  );
}
