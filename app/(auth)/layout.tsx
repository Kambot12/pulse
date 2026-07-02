import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <Link href="/" className="mx-auto mb-8">
        <Logo size={44} />
      </Link>
      <div className="card animate-fade-up p-7 sm:p-8">{children}</div>
      <p className="mt-6 text-center text-xs text-muted">
        Encrypted &amp; secure · Your data stays private
      </p>
    </div>
  );
}
