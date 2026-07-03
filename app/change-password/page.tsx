import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth/session";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const home = ["doctor", "reception", "admin"].includes(user.role) ? "/doctor" : "/settings";

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <div className="mx-auto mb-8"><Logo size={44} /></div>
      <div className="card animate-fade-up p-7 sm:p-8">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">Change password</h1>
        <p className="mb-4 text-sm text-muted">Choose a new password for your account.</p>
        <ChangePasswordForm />
      </div>
      <Link href={home} className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={15} /> Back
      </Link>
    </div>
  );
}
