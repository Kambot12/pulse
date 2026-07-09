import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

/**
 * Reset-password page. Reads the one-time token from the email link's query string.
 * Token validity is checked server-side when the form is submitted.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Invalid reset link</h1>
        <p className="text-sm text-muted">
          This link is missing its reset token. Please request a new one.
        </p>
        <Link href="/forgot-password" className="btn btn-primary w-full">Request a new link</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
        <p className="mt-1 text-sm text-muted">Enter a new password for your account.</p>
      </div>
      <ResetPasswordForm token={token} />
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="text-brand-ink hover:underline">Back to login</Link>
      </p>
    </div>
  );
}
