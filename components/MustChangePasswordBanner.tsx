import Link from "next/link";
import { KeyRound } from "lucide-react";

export function MustChangePasswordBanner({ show }: { show?: boolean }) {
  if (!show) return null;
  return (
    <Link
      href="/change-password"
      className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
    >
      <KeyRound size={16} /> You&apos;re using a temporary password — tap to set your own.
    </Link>
  );
}
