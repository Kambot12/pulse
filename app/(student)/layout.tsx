import { redirect } from "next/navigation";
import { AppShell } from "@/components/student/AppShell";
import { MustChangePasswordBanner } from "@/components/MustChangePasswordBanner";
import { getCurrentStudentProfile, getCurrentUser } from "@/lib/auth/session";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // clinic staff don't belong in the student area
  if (["doctor", "reception", "admin"].includes(user.role)) redirect("/doctor");

  const profile = await getCurrentStudentProfile();
  if (!profile?.onboardingComplete) redirect("/onboarding");

  return (
    <AppShell name={profile.name}>
      <MustChangePasswordBanner show={user.mustChangePassword} />
      {children}
    </AppShell>
  );
}
