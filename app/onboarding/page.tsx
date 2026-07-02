import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { getCurrentStudentProfile, getCurrentUser } from "@/lib/auth/session";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCurrentStudentProfile();
  if (profile?.onboardingComplete) redirect("/dashboard");

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 py-10">
      <div className="mx-auto mb-6">
        <Logo size={44} />
      </div>
      <p className="mb-4 text-center text-sm text-muted">
        Let&apos;s set up your health profile. This powers your passport and reminders.
      </p>
      <div className="card animate-fade-up p-7 sm:p-8">
        <OnboardingForm />
      </div>
    </div>
  );
}
